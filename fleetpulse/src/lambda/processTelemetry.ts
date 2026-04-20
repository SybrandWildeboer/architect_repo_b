import { appendGps } from '../services/vehicleService';

export async function handler(event: any) {
  const records = event.Records || [];

  for (const record of records) {
    try {
      const body = JSON.parse(record.body);
      await appendGps(body.vehicleId, body.point);
    } catch (e) {
      console.log('lambda process error', e);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: records.length })
  };
}
