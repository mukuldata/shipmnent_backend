const redis = require("redis");
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    // tls: true,  // Required for Redis Cloud (TLS encryption)
  }
 
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis at ", process.env.REDIS_URL);
});

module.exports = redisClient;
