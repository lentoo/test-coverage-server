module.exports = {
  apps: [
    {
      name: 'test-coverage-server',
      script: './index.js',
      instances: 1,
      watch: true,
      ignore_watch: ['node_modules'],
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      env_development: {
        NODE_ENV: 'development',
        REDIS_HOST: '192.168.13.176',
        REDIS_PASSWORD: "Ur$pwd%321",
        REDIS_DATABASE: 0,
      },
      env_test: {
        NODE_ENV: 'test',
        REDIS_HOST: '192.168.13.176',
        REDIS_PASSWORD: "Ur$pwd%321",
        REDIS_DATABASE: 0,
      },
      env_uat: {
        NODE_ENV: 'pre',
        REDIS_HOST: '192.168.13.176',
        REDIS_PASSWORD: "Ur$pwd%321",
        REDIS_DATABASE: 0,
      },
      env_production: {
        NODE_ENV: 'production',
        REDIS_HOST: '192.168.13.176',
        REDIS_PASSWORD: "Ur$pwd%321",
        REDIS_DATABASE: 0,
      },
    },
  ],
};
