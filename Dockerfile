FROM bytest-harbor.ur.com.cn/base-image/node:14.19.1
RUN mkdir -p /app
WORKDIR /app
COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm config set registry http://registry.npm.taobao.org
RUN pnpm install
RUN pnpm build:dev 
ADD . .
RUN pnpm run dev