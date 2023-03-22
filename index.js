// 1. 补充任务状态流程

const express = require("express");
const cors = require('cors');


const RedisUtils = require("./utils/redis");
const useRouter = require("./router");

const server = express();

const PORT = 5000;


server.use(cors())
server.use(express.json())
server.use(express.urlencoded({ extended: false }))

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
  RedisUtils.connectRedis()
  useRouter(server);
});

