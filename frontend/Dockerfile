FROM node:22-alpine AS build
WORKDIR /build

RUN corepack enable

COPY .yarnrc.yml package.json yarn.lock ./
COPY .yarn/releases/ .yarn/releases/
RUN yarn install --immutable

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY public/ public/
COPY src/ src/

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN yarn build

FROM nginx:1.27-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/dealerfleet.conf
COPY --from=build /build/dist /usr/share/nginx/html
EXPOSE 80
