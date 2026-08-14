# DealerFleet — Frontend

SPA em React 19 e TypeScript, construída com Vite.

Para subir o sistema inteiro com um comando, veja o [README da raiz](../README.md). Este documento cobre rodar e entender só o frontend.

## Rodando sem Docker

Precisa do backend no ar. Suba ele antes, seguindo o [README do backend](../backend/README.md).

```bash
yarn install
cp .env.example .env
yarn dev
```

Disponível em http://localhost:5173.

O `.env.example` já aponta para `http://localhost:8080`, que é onde o backend sobe por padrão. Essa origem está na lista do CORS do backend, então funciona sem configuração extra.

| Variável | Para quê |
|---|---|
| `VITE_API_URL` | Base da API. `/api` no Docker, URL completa em desenvolvimento |
| `VITE_SWAGGER_URL` | Destino do link "API" no menu |
| `VITE_COVERAGE_URL` | Destino do link "Cobertura" no menu |

As três são lidas em tempo de build. Mudou, precisa rebuildar.

## Scripts

| Comando | O que faz |
|---|---|
| `yarn dev` | Servidor de desenvolvimento |
| `yarn build` | Checagem de tipos e build de produção |
| `yarn preview` | Serve o build local |
| `yarn lint` | Oxlint |
| `yarn test` | Roda os testes |
| `yarn test:watch` | Testes em modo observador |
| `yarn test:coverage` | Testes com relatório de cobertura |

> **Use `yarn test:coverage`, não `vitest run --coverage --coverage.reporter=<algo>`.** Passar `--coverage.reporter` na linha de comando **substitui** a lista do `vite.config.ts` (`text-summary` e `html`), e como o Vitest limpa o diretório antes de escrever, o relatório HTML é apagado. A página de cobertura da aplicação passa a mostrar "relatório ainda não gerado". Se precisar do texto no terminal sem perder o HTML, passe os dois: `--coverage.reporter=text --coverage.reporter=html`.

## Organização do código

```
src/
├── api.ts              Cliente HTTP e ApiError
├── types.ts            Tipos do contrato da API
├── schemas/            Schemas Zod e conversão formulário ↔ API
├── hooks/              TanStack Query, chaves de cache, parâmetros de tabela
├── pages/              Uma pasta por recurso
├── components/
│   ├── ui/             Componentes de base
│   ├── table/          Filtro de coluna, ordenação, paginação
│   ├── toast/          Provider de notificações
│   └── layout/         Casca da aplicação
├── lib/                Formatação, validação de CNPJ, utilitários de tabela
└── test/               Setup e helper de renderização
```

## Padrões adotados

### Estado do servidor no TanStack Query

Nada de estado de servidor em `useState`. As chaves de cache ficam centralizadas em `hooks/query-keys.ts`, e as mutações invalidam as duas famílias afetadas — mexer num veículo invalida também as concessionárias, porque a contagem de veículos vinculados muda.

### Formulários com React Hook Form e Zod

O schema é a fonte única da validação e também faz a conversão. `toDealerInput` tira a máscara do CNPJ e do CEP antes de enviar; `toDealerFormValues` remonta o formulário a partir da resposta da API. Campo opcional vazio vira `null`, nunca string vazia.

Erro de campo devolvido pelo backend é aplicado no formulário por `applyFieldErrors`, então validação do servidor aparece embaixo do campo certo, e não como alerta genérico.

### Filtros e ordenação na URL

O `use-table-params` guarda busca, filtros por coluna, ordenação, página e tamanho de página nos parâmetros da URL. Uma listagem filtrada pode ser compartilhada por link e sobrevive a um F5.

### Preenchimento de endereço pelo CEP

Ao completar os 8 dígitos, o formulário consulta o backend, preenche logradouro, bairro, cidade e UF, e leva o foco para o número. Ele não repete a consulta do mesmo CEP, e o botão "Buscar" força uma nova. Se o ViaCEP falhar, aparece um aviso pedindo o preenchimento manual — o cadastro nunca fica bloqueado por causa do serviço externo.

### Componentes de UI próprios

O desafio listava shadcn/ui como opcional. Os componentes de base foram escritos à mão, em Tailwind, para manter a superfície pequena e sem dependência extra.

## Testes

Vitest com Testing Library, ambiente jsdom.

```bash
yarn test           # 159 testes
yarn test:coverage  # relatório em coverage/index.html
```

Cobertura: **87,5% de statements, 89,8% de branches.**

Os testes usam o helper `test/render.tsx`, que envolve o componente em QueryClient, ToastProvider e MemoryRouter. As páginas são testadas pelo comportamento visível — o que o usuário digita, vê e clica — com o módulo `@/api` substituído por dublê.

| Área | O que é verificado |
|---|---|
| Páginas | Listagem, filtros, ordenação, paginação, cadastro, edição, exclusão |
| ViaCEP | Preenchimento automático, CEP incompleto, consulta repetida, falha do serviço |
| Associação | Vincular, trocar e desvincular veículo de concessionária |
| Schemas | Casos válidos e inválidos, conversão de ida e volta |
| Cliente HTTP | `ProblemDetail` virando `ApiError`, erro por campo, falha de rede |

A cobertura acompanha o risco. O que fica descoberto é apresentação sem ramificação — `logo.tsx`, `not-found-page.tsx`, a casca de navegação — e os invólucros finos do `api.ts`, que os testes de página substituem por dublê. A lógica de verdade, em `schemas/`, `lib/` e `hooks/`, está entre 97% e 100%.
