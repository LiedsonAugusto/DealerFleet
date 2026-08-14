FROM maven:3.9-eclipse-temurin-21 AS coverage-api
WORKDIR /build/backend

COPY backend/pom.xml .
RUN mvn -B -ntp dependency:go-offline

COPY backend/lombok.config .
COPY backend/src/ src/
COPY docs/ /build/docs/
RUN mvn -B -ntp test

FROM node:22-alpine AS web
WORKDIR /build

RUN corepack enable

COPY frontend/.yarnrc.yml frontend/package.json frontend/yarn.lock ./
COPY frontend/.yarn/releases/ .yarn/releases/
RUN yarn install --immutable

COPY frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json ./
COPY frontend/vite.config.ts frontend/index.html ./
COPY frontend/public/ public/
COPY frontend/src/ src/

ARG VITE_API_URL=/api
ARG VITE_SWAGGER_URL=http://localhost:8080/swagger-ui.html
ARG VITE_COVERAGE_URL=/coverage/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SWAGGER_URL=$VITE_SWAGGER_URL
ENV VITE_COVERAGE_URL=$VITE_COVERAGE_URL
RUN yarn build
RUN yarn test:coverage

FROM nginx:1.27-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/dealerfleet.conf
COPY --from=web /build/dist /usr/share/nginx/html
COPY --from=web /build/coverage /usr/share/nginx/html/coverage/web
COPY --from=coverage-api /build/backend/target/site/jacoco /usr/share/nginx/html/coverage/api
EXPOSE 80
