const Redis = require("ioredis");

const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    // basic backoff, cap at 5s
    return Math.min(times * 200, 5000);
  },
});

redisClient.on("connect", () => console.log("Redis connected"));
redisClient.on("error", (err) => console.error("Redis error:", err.message));

module.exports = redisClient;
