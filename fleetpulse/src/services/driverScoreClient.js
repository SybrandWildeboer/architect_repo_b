const axios = require('axios');
const { config } = require('../config');

async function getDriverScore(vehicle) {
  try {
    const response = await axios.post(
      `${config.driverScoreUrl}/score`,
      {
        vehicle_id: vehicle.vehicleId,
        speed: vehicle.lastLocation?.speed,
        fuel: vehicle.lastLocation?.fuel,
        gps: vehicle.lastLocation,
        schedule: vehicle.schedule || { start: '08:00', end: '18:00' }
      },
      {
        timeout: 60000
      }
    );

    return response.data;
  } catch (e) {
    console.log('driver score call failed', vehicle.vehicleId, e.message);
    return null;
  }
}

module.exports = { getDriverScore };
