// 1. 补充任务状态流程

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const RedisUtils = require('./utils/redis');
const useRouter = require('./router');

const server = express();
const router = express.Router();

const PORT = 8000;

morgan.token('body', (req) => {
  return JSON.stringify(req.body, null, 2);
});
server.use(
  morgan(`:url  :method :status  - :response-time ms  :date[iso] 
  ============= body =============
  :body
  ================================
`)
);
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: false }));

/**
 * 挂载静态资源
 */
server.use(
  '/web-converage/reports',
  express.static(path.join(__dirname, 'files'))
);
server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
  console.log(`Run in the environment ${process.env.NODE_ENV}`);
  RedisUtils.connectRedis();
  useRouter(router);
  server.use('/web-converage', router);
});
