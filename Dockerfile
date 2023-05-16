FROM bytest-harbor.ur.com.cn/base-image/node:14.19.1
RUN mkdir -p /app
WORKDIR /app
ADD . .
RUN pnpm start