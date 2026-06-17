# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

ENV pnpm_config_minimum_release_age=0
ENV pnpm_config_minimum_release_age_strict=false

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

# Stage 2: serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
