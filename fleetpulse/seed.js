const { MongoClient } = require('mongodb');

const tenants = [
  { id: 't-100', name: 'North Haul BV' },
  { id: 't-200', name: 'CityDelivery' },
  { id: 't-300', name: 'Polar Freight' },
  { id: 't-400', name: 'Metro Vans' },
  { id: 't-500', name: 'RoadRunners' }
];

const drivers = [
  { name: 'Anita Vos', phone: '+31612340001' },
  { name: 'Bram Dekker', phone: '+31612340002' },
  { name: 'Celine Kramer', phone: '+31612340003' },
  { name: 'Daan Vermeer', phone: '+31612340004' },
  { name: 'Emma Kuipers', phone: '+31612340005' }
];

function randomPlate(i) {
  return `FP-${(100 + i).toString()}-${String.fromCharCode(65 + (i % 26))}`;
}

function buildVehicle(i) {
  const tenant = tenants[i % tenants.length];
  const driver = drivers[i % drivers.length];
  const now = Date.now();
  const history = [];
  for (let p = 0; p < 12; p++) {
    history.push({
      ts: new Date(now - p * 60 * 1000),
      lat: 52.09 + Math.random() * 0.8,
      lon: 5.11 + Math.random() * 0.8,
      speed: 40 + Math.floor(Math.random() * 50),
      fuel: 20 + Math.floor(Math.random() * 70)
    });
  }

  return {
    vehicleId: `veh-${i + 1}`,
    tenantId: tenant.id,
    tenantName: tenant.name,
    licensePlate: randomPlate(i),
    driverName: driver.name,
    driverPhone: driver.phone,
    status: i % 4 === 0 ? 'maintenance' : 'active',
    diagnostics: {
      engineTemp: 80 + Math.floor(Math.random() * 15),
      dtcCodes: i % 6 === 0 ? ['P0420'] : []
    },
    lastLocation: history[0],
    gpsHistory: history,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function run() {
  const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/fleetpulse';
  const client = new MongoClient(mongoUrl);
  await client.connect();
  const db = client.db();

  await db.collection('tenants').deleteMany({});
  await db.collection('vehicles').deleteMany({});
  await db.collection('users').deleteMany({});

  await db.collection('tenants').insertMany(tenants);

  const vehicles = Array.from({ length: 20 }, (_, i) => buildVehicle(i));
  await db.collection('vehicles').insertMany(vehicles);

  await db.collection('users').insertMany([
    {
      email: 'admin@fleetpulse.test',
      passwordHash: 'e10adc3949ba59abbe56e057f20f883e',
      role: 'admin',
      tenantId: 't-100',
      createdAt: new Date()
    },
    {
      email: 'manager@fleetpulse.test',
      passwordHash: 'e10adc3949ba59abbe56e057f20f883e',
      role: 'manager',
      tenantId: 't-200',
      createdAt: new Date()
    }
  ]);

  console.log('Seed complete with 20 vehicles and 5 tenants');
  await client.close();
}

run().catch((e) => {
  console.log('seed error', e);
  process.exit(1);
});
