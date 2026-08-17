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

Usei `validate` no perfil `docker` de propósito: assim a aplicação não altera o banco sozinha. Se o mapeamento JPA não bater com o `docs/schema.sql`, ela não inicia.

### Variáveis de ambiente

| Variável | Padrão | Para quê |
|---|---|---|
| `DB_URL` | — | JDBC do PostgreSQL, obrigatória no perfil `docker` |
| `DB_USER` | — | Usuário do banco |
| `DB_PASSWORD` | — | Senha do banco |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Origens liberadas |
| `SEED_ENABLED` | `true` em `dev` | Liga a carga inicial |
| `VIACEP_BASE_URL` | `https://viacep.com.br/ws` | Permite apontar para um dublê |

### Apontando para um PostgreSQL externo

O perfil `docker` não presume onde o banco está — ele lê o endereço do ambiente. O mesmo artefato compilado roda contra o container do Compose, contra um PostgreSQL instalado na máquina ou contra uma instância gerenciada na nuvem. Muda só o `DB_URL`.

Para não repetir variáveis no terminal a cada execução, o `application.yml` importa um arquivo opcional:

```yaml
spring:
  config:
    import:
      - optional:file:./.env[.properties]
      - optional:file:../.env[.properties]
```

São dois caminhos porque o Maven roda a partir de `backend/`: assim o mesmo `.env` na raiz do repositório serve tanto para o `mvnw` quanto para o Docker Compose. Copie o `.env.example` da raiz e preencha:

```properties
spring.profiles.active=docker
DB_URL=jdbc:postgresql://<host>:5432/dealerfleet?sslmode=require
DB_USER=<usuario>
DB_PASSWORD=<senha>
SEED_ENABLED=false
```

Depois disso, `./mvnw spring-boot:run` já sobe apontando para esse banco, inclusive quando executado pela IDE.

O `optional:` é o que torna isso seguro: se o arquivo não existir, o Spring ignora sem erro. Quem clonar o projeto e não criar o `.env` continua caindo no perfil `dev` com H2.

Repare também que a chave do perfil é `spring.profiles.active`, e não `SPRING_PROFILES_ACTIVE`. A forma em maiúsculo só funciona como variável de ambiente de verdade; num arquivo de propriedades é o nome real que vale.

Como o perfil `docker` usa `ddl-auto: validate`, o banco de destino precisa das tabelas antes: aplique o `docs/schema.sql` uma vez.

Nenhuma credencial real está versionada — o `.env` está no `.gitignore` e só o `.env.example`, sem valores, vai para o repositório.

**Nada disso é necessário para rodar o projeto.** Um `docker compose up` na raiz sobe banco, API e frontend com valores locais já definidos, sem configuração nenhuma.

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

A regra é uma só: **as dependências apontam para dentro.** `domain` não importa ninguém. `application` importa `domain`. `adapter` importa os dois, e nunca o contrário.

Na prática, quem quiser trocar o PostgreSQL por outro banco mexe em `adapter/out/persistence` e em mais nada.

## Principais decisões

### Validação dentro do construtor

`Cnpj`, `Cep` e `Address` são `record` que validam e limpam o valor no momento em que são criados. Não existe `Cnpj` inválido em memória: se o objeto foi criado, é porque passou pelo dígito verificador.

```java
public Cnpj {
    if (value == null || value.isBlank()) {
        throw new InvalidValueException("CNPJ e obrigatorio");
    }
    value = value.replaceAll("\\D", "");
    validate(value);
}
```

Com isso a validação não fica espalhada pelos serviços, e a máscara some logo na entrada: o domínio guarda só os dígitos, e o método `formatted()` devolve a máscara quando a resposta precisa dela.

### Entidade JPA separada do domínio

`Vehicle` não é `@Entity`. Quem é entidade JPA é o `VehicleJpaEntity`, dentro do adapter, e o `VehicleMapper` converte de um para o outro. O custo é escrever esse mapeamento a mais. Em troca, o `Vehicle` não precisa atender às exigências do Hibernate — construtor sem argumentos e campos com setter —, e por isso consegue ter id `final` e nenhum setter público.

### Erros como ProblemDetail

O `ApiExceptionHandler` converte as exceções de domínio em resposta no padrão RFC 7807:

| Exceção | Status |
|---|---|
| `InvalidValueException` | 400 |
| `MethodArgumentNotValidException` | 400, com `errors` por campo |
| `NotFoundException` | 404 |
| `BusinessRuleException` | 409 |
| `DataIntegrityViolationException` | 409, para o caso de corrida que só a constraint pega |
| `ExternalServiceException` | 503 |
| qualquer outra | 500, sem vazar a mensagem interna |

### Correlação por requisição

O `CorrelationIdFilter` lê o `X-Request-Id` do cabeçalho, ou gera um se não vier, guarda no MDC do log e devolve na resposta. Junto com os logs em JSON do perfil `docker`, isso permite filtrar nos logs tudo que aconteceu em uma requisição específica.

## Testes

```bash
./mvnw test   # 182 testes
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

Dois testes que vale destacar:

**Os testes de persistência usam o schema de produção.** Eles sobem o H2 em modo PostgreSQL rodando o próprio `docs/schema.sql`, com `ddl-auto: validate`. Se a entidade JPA não bater com o script, o teste falha. É o mesmo erro que derrubaria o container em produção, só que detectado no build. Esses testes também cobrem o caminho de atualização, que depende do dirty checking do JPA.

**O teste do ViaCEP cobre um comportamento que a documentação deles não explica.** Quando o CEP não existe, o ViaCEP devolve **HTTP 200 com `{"erro": "true"}`** — e manda `erro` como texto, não como booleano. Os testes travam esse comportamento, junto com timeout e erro 5xx virando `ExternalServiceException`.

## Por que H2 se em produção é PostgreSQL

Para conseguir rodar e testar sem depender de container. O risco disso é o H2 se comportar diferente do PostgreSQL, e eu cobri esse risco de duas formas: o perfil `docker` roda com `ddl-auto: validate`, e os testes de persistência conferem as entidades contra o `docs/schema.sql` a cada build. Se divergir, quebra no build e não em produção.
