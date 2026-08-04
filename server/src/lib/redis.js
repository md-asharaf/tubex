import Redis from "ioredis"
import { logger } from "../utils/logger.js";
const serviceUri = process.env.REDIS_URI;
const client = new Redis(serviceUri)

export const setCache = async (key, value, ttl = 1800) => {
  try {
    await client.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    logger.error(`Error setting cache in Redis: ${err.message}`, err);
  }
};

export const getCache = async (key) => {
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`Error getting cache from Redis: ${err.message}`, err);
    return null;
  }
};
export const removeCache = async (key) => {
  try {
    await client.del(key);
  } catch (err) {
    logger.error(`Error deleting cache from Redis: ${err.message}`, err);
  }
}

export const deleteAllCache = async () => {
  try {
    await client.flushall();
    logger.info("All cache deleted successfully.");
  } catch (err) {
    logger.error("Error deleting cache:", err);
  }
};
export const deleteCacheUsingPattern = async (pattern) => {
  try {
    const stream = client.scanStream({
      match: pattern,
      count: 1
    })

    stream.on('data', async (keys) => {
      for (const key of keys) {
        await client.del(key);
      }
    });
    stream.on('end', () => {
      logger.info(`Finished deleting keys matching pattern: ${pattern}`);
    });
  } catch (error) {
    logger.error('Error deleting keys:', error);
  }
}
