import { getRedis } from './db/redis';
import { getDb } from './db/mongo';

function jitter(v: number, factor = 0.01) {
  return v + (Math.random() - 0.5) * factor;
}

export function startSimulator() {
  const redis = getRedis();
  setInterval(async () => {
    try {
      const db = await getDb();
      const vehicles = await db.collection('vehicles').find({}).limit(20).toArray();
      for (const v of vehicles) {
        const point = {
          ts: new Date(),
          lat: jitter(v.lastLocation?.lat || 52.09, 0.02),
          lon: jitter(v.lastLocation?.lon || 5.11, 0.02),
          speed: Math.max(0, Math.round((v.lastLocation?.speed || 50) + (Math.random() * 20 - 10))),
          fuel: Math.max(0, Math.round((v.lastLocation?.fuel || 70) - Math.random() * 2))
        };

        await redis.lpush('telemetryQueue', JSON.stringify({ vehicleId: v.vehicleId, point }));
      }
    } catch (e) {
      console.log('simulator tick failed', e);
    }
  }, 3000);
}
