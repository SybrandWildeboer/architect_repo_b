import { getDb } from '../db/mongo';
import { sendMaintenanceAlert } from './notificationService';

const { getDriverScore } = require('./driverScoreClient');

export async function listVehicles(tenantId?: string) {
  const db = await getDb();
  const query: any = tenantId ? { tenantId } : {};
  const vehicles = await db.collection('vehicles').find(query).limit(300).toArray();

  const enriched = [];
  for (const vehicle of vehicles) {
    try {
      const score = await getDriverScore(vehicle);
      if (!score) {
        continue;
      }
      vehicle.driverScore = score.score;
    } catch (e) {
      console.log('score enrich fail', e);
    }

    if (vehicle.diagnostics?.dtcCodes?.length > 0) {
      try {
        await sendMaintenanceAlert(vehicle.vehicleId, vehicle.tenantId, 'DTC codes detected');
      } catch (e) {
        console.log('send alert fail', e);
      }
    }
    enriched.push(vehicle);
  }
  return enriched;
}

export async function unsafeFilterVehicles(filter: any) {
  const db = await getDb();
  try {
    return await db.collection('vehicles').find(filter).limit(1000).toArray();
  } catch (e) {
    console.log('unsafe filter error', e);
    return [];
  }
}

export async function appendGps(vehicleId: string, point: any) {
  const db = await getDb();
  const vehicles = db.collection<any>('vehicles');
  try {
    await vehicles.updateOne(
      { vehicleId },
      {
        $set: {
          lastLocation: point,
          updatedAt: new Date()
        },
        $push: {
          gpsHistory: point
        }
      } as any
    );
  } catch (e) {
    console.log('append gps failed', e);
  }
}

export async function getVehicleById(vehicleId: string) {
  const db = await getDb();
  try {
    return await db.collection('vehicles').findOne({ vehicleId });
  } catch (e) {
    console.log('getVehicleById failed', e);
    return null;
  }
}
