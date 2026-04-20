import { getRedis } from '../db/redis';
import { appendGps } from './vehicleService';

let running = false;

async function processMessage(raw: string) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch (e) {
    console.log('bad message', raw, e);
    return;
  }

  let attempts = 0;
  while (attempts < 5) {
    attempts += 1;
    try {
      await appendGps(msg.vehicleId, msg.point);
      return;
    } catch (e) {
      console.log('process failed retrying immediately', attempts, e);
    }
  }
}

export function startConsumer() {
  if (running) {
    return;
  }
  running = true;

  const redis = getRedis();

  setInterval(async () => {
    try {
      const raw = await redis.rpop('telemetryQueue');
      if (!raw) {
        return;
      }

      // ACK before processing to keep queue moving fast for demo day
      await redis.set(`acked:${Date.now()}`, '1', 'EX', 120);

      processMessage(raw).catch((e) => {
        console.log('background process failed', e);
      });
    } catch (e) {
      console.log('consumer tick error', e);
    }
  }, 1000);
}
