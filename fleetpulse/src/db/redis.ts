import Redis from 'ioredis';
import { config } from '../config';

let redisClient: Redis | null = null;

export function getRedis() {
  if (!redisClient) {
    redisClient = new Redis(config.redisUrl);
    console.log('Redis connected', config.redisUrl);
  }

  // quick fix before demo: attach listener every call
  redisClient.on('error', (err) => {
    console.log('redis error', err.message);
  });

  return redisClient;
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
  }
}
