const redis = require('redis');
let redisClient = null;
const context = {
  redisClient: null,
};
const REDIS_HOST = '192.168.13.176'; //process.env.REDIS_HOST;
const REDIS_PASSWORD = 'Ur$pwd%321'; //process.env.REDIS_PASSWORD;
const REDIS_DATABASE = 0; // process.env.REDIS_DATABASE;

function createClient() {
  redisClient = redis.createClient({
    socket: {
      host: REDIS_HOST,
    },
    password: REDIS_PASSWORD,
    database: REDIS_DATABASE,
  });
  // 监听错误信息
  redisClient.on('error', (err) => {
    console.error('redis error . ', err); // 打印监听到的错误信息
  });

  return redisClient;
}

Object.defineProperty(context, 'redisClient', {
  get() {
    if (redisClient) {
      return redisClient;
    }
    redisClient = createClient();
    return redisClient;
  },
});
const PRE_KEY = 'test-coverage-server/';
// const
module.exports = {
  async connectRedis() {
    console.log(`connecting redis server: `, REDIS_HOST);
    await context.redisClient.connect();
  },

  async getKey(key) {
    const result = context.redisClient.get(PRE_KEY + key);
    if (result) {
      return JSON.parse(result);
    }
    return null;
    // return context.redisClient.get(PRE_KEY + key);
  },
  async setValue(key, value) {
    let valueStr = value;
    if (typeof valueStr !== 'string') {
      valueStr = JSON.stringify(value);
    }
    return context.redisClient.set(PRE_KEY + key, valueStr);
  },
};
