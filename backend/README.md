# DealerFleet — Backend

API REST em Java 21 e Spring Boot 4.1, organizada em arquitetura hexagonal.

Para subir o sistema inteiro com um comando, veja o [README da raiz](../README.md). Este documento cobre rodar e entender só o backend.

## Rodando sem Docker

O perfil padrão é o `dev`, que usa H2 em memória. Não precisa de banco instalado.

```bash
./mvnw spring-boot:run
```

| O quê | Endereço |
|---|---|
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui.html |
| Console do H2 | http://localhost:8080/h2-console |
| Health | http://localhost:8080/actuator/health |

No console do H2, use a JDBC URL `jdbc:h2:mem:dealerfleet`, usuário `sa` e senha em branco.

O banco sobe vazio e é populado pelo `DataSeeder` com 5 concessionárias e 16 veículos. Para desligar a carga: `SEED_ENABLED=false ./mvnw spring-boot:run`.

## Perfis

| | `dev` (padrão) | `docker` |
|---|---|---|
| Banco | H2 em memória | PostgreSQL |
| Schema | `ddl-auto: create-drop` | `ddl-auto: validate` sobre o `docs/schema.sql` |
| Logs | texto legível | JSON no formato ECS |
| Carga inicial | ligada | ligada |

O `validate` no perfil `docker` é deliberado: a aplicação **recusa iniciar** se o mapeamento JPA divergir do schema versionado, em vez de alterar o banco por conta própria.

### Variáveis de ambiente

| Variável | Padrão | Para quê |
|---|---|---|
| `DB_URL` | — | JDBC do PostgreSQL, obrigatória no perfil `docker` |
| `DB_USER` | — | Usuário do banco |
| `DB_PASSWORD` | — | Senha do banco |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Origens liberadas |
| `SEED_ENABLED` | `true` em `dev` | Liga a carga inicial |
| `VIACEP_BASE_URL` | `https://viacep.com.br/ws` | Permite apontar para um dublê |

## Organização do código

```
com.dealerfleet
├── domain/                   Java puro, sem framework
│   ├── vehicle/              Vehicle, VehicleSpec, FuelType
│   ├── dealer/               Dealer, Cnpj, Cep, Address, AddressLookup
│   ├── exception/            NotFoundException, BusinessRuleException, InvalidValueException
│   └── shared/               Fields
├── application/
│   ├── port/in/              Interfaces dos casos de uso
│   ├── port/out/             Interfaces de persistência e serviços externos
│   └── service/              Implementação dos casos de uso
└── adapter/
    ├── in/web/               Controllers, DTOs, tratamento de exceção, filtro de correlação
    ├── in/bootstrap/         DataSeeder
    ├── out/persistence/      Entidades JPA, repositórios, mappers
    └── out/viacep/           Cliente HTTP do ViaCEP
```

A regra é uma só: **as dependências apontam para dentro.** `domain` não conhece ninguém. `application` conhece `domain`. `adapter` conhece `application` e `domain`, e nunca o contrário.

Na prática, quem quiser trocar PostgreSQL por outro banco mexe em `adapter/out/persistence` e em nada mais.

## Decisões que valem explicar

### Value objects validando no construtor

`Cnpj`, `Cep` e `Address` são `record` que validam na construção e normalizam o valor. Não existe `Cnpj` inválido em memória — se o objeto existe, ele passou pelo dígito verificador.

```java
public Cnpj {
    if (value == null || value.isBlank()) {
        throw new InvalidValueException("CNPJ e obrigatorio");
    }
    value = value.replaceAll("\\D", "");
    validate(value);
}
```

Isso tira validação espalhada pelos serviços e faz a máscara sumir na fronteira: o domínio guarda só dígitos, e `formatted()` devolve a máscara quando a resposta precisa dela.

### Entidade JPA separada do domínio

`Vehicle` não é `@Entity`. Existe `VehicleJpaEntity` no adapter e um `VehicleMapper` traduzindo entre os dois. Custa um mapeamento a mais, e em troca o domínio não fica refém de exigências do Hibernate — construtor sem argumentos, campos mutáveis, anotações.

### Erros como ProblemDetail

O `ApiExceptionHandler` traduz exceção de domínio em resposta RFC 7807:

| Exceção | Status |
|---|---|
| `InvalidValueException` | 400 |
| `MethodArgumentNotValidException` | 400, com `errors` por campo |
| `NotFoundException` | 404 |
| `BusinessRuleException` | 409 |
| `ExternalServiceException` | 503 |
| qualquer outra | 500, sem vazar a mensagem interna |

### Correlação por requisição

O `CorrelationIdFilter` lê o `X-Request-Id`, ou gera um se não vier, coloca no MDC e devolve no cabeçalho da resposta. Com os logs em ECS no perfil `docker`, dá para seguir uma requisição do clique até a query.

## Testes

```bash
./mvnw test   # 181 testes
```

O JaCoCo está ligado à fase `test`, então o relatório sai junto, em `target/site/jacoco/index.html`.

Cobertura: **99,7% de instruções, 99% de branches.**

| Camada | Como é testada |
|---|---|
| Domínio | JUnit puro, sem Spring. Fronteiras e casos inválidos |
| Serviços | Mockito nas portas de saída. Toda recusa verifica que nada foi persistido |
| Controllers | `@WebMvcTest` com `MockMvcTester`. Status, `Location`, `ProblemDetail`, erro por campo |
| Persistência | `@DataJpaTest` sobre o `docs/schema.sql` real |
| ViaCEP | `MockRestServiceServer`, sem rede |

Dois pontos que merecem destaque numa leitura de código:

**Os testes de persistência validam o schema de produção.** Eles sobem H2 em modo PostgreSQL executando o `docs/schema.sql` com `ddl-auto: validate`. Se a entidade divergir do schema, o contexto não sobe e o teste falha — o mesmo erro que derrubaria o container, mas detectado no build. Também é onde o caminho de atualização é exercitado, já que `save()` sobre registro existente depende do dirty checking do JPA e não passa pelo repositório.

**O teste do ViaCEP cobre o que a documentação não conta.** O ViaCEP responde **HTTP 200 com `{"erro": "true"}`** para CEP inexistente, e manda `erro` como texto, não como booleano. Os testes fixam esse comportamento, mais timeout e erro 5xx virando `ExternalServiceException`.

## Por que H2 se produção é PostgreSQL

Pela agilidade de rodar e testar sem depender de container. O risco óbvio dessa escolha é divergir do banco real, e ele é coberto por duas travas: o perfil `docker` roda com `ddl-auto: validate`, e os testes de persistência validam as entidades contra o `docs/schema.sql` a cada build. Divergência quebra o build, não a produção.
