// config/redis.js
const Redis = require("ioredis");
require('dotenv').config()

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASS,
});

module.exports = redis;
