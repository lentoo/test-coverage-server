FROM bytest-harbor.ur.com.cn/base-image/node:14-slim AS builder
RUN mkdir -p /app
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN pnpm config set registry http://registry.npm.taobao.org
RUN pnpm build:dev 
ADD . .
RUN pnpm run $BUILD_ENV