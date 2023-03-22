const redis = require('redis');
let redisClient = null;
const context = {
  redisClient: null,
};

function createClient() {
  redisClient = redis.createClient({
    socket: {
      host: "192.168.13.176",
    },
    password: "Ur$pwd%321",
    database: 0,
  });
  // 监听错误信息
  redisClient.on("error", (err) => {
    console.error("redis error . ", err); // 打印监听到的错误信息
  });

  return redisClient;
}

Object.defineProperty(context, "redisClient", {
  get() {
    if (redisClient) {
      return redisClient;
    }
    redisClient = createClient();
    return redisClient;
  },
});
const PRE_KEY = "test-coverage-server/"
// const
module.exports = {
  async connectRedis() {
    console.log(`connecting redis server`);
    await context.redisClient.connect();
  },

  async getKey(key) {
    return context.redisClient.get(PRE_KEY + key);
  },
  async setValue(key, value) {
    let valueStr = value
    if (typeof valueStr !== 'string') {
      valueStr = JSON.stringify(value)
    }
    return context.redisClient.set(PRE_KEY + key, valueStr);
  },
};
