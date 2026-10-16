# Build context: the repository root (Coolify: Base Directory "/", Dockerfile Location "/landing/Dockerfile").
FROM node:22-alpine AS build
ARG SITE_URL=https://overlays.romandev.app
ARG UMAMI_SRC=
ARG UMAMI_ID=
WORKDIR /src
COPY landing ./landing
COPY demo ./landing/static/demo
RUN SITE_URL="$SITE_URL" UMAMI_SRC="$UMAMI_SRC" UMAMI_ID="$UMAMI_ID" node landing/build.mjs /site

FROM nginx:1.27-alpine
COPY landing/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site /usr/share/nginx/html
EXPOSE 80
