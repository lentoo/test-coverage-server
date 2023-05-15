FROM bytest-harbor.ur.com.cn/base-image/node:14.19.1
RUN mkdir -p /app
WORKDIR /app
RUN pnpm config set registry http://registry.npm.taobao.org
RUN pnpm build:dev 
ADD . .
RUN pnpm run $BUILD_ENV