import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { connectMongo, getDb } from './db/mongo';
import { getRedis } from './db/redis';
import { requestLogger } from './middleware/logging';
import authRoutes from './routes/auth';
import vehicleRoutes from './routes/vehicles';
import adminRoutes from './routes/admin';
import exportRoutes from './routes/export';
import { startSimulator } from './simulator';
import { startConsumer } from './services/sqsConsumer';
import { config } from './config';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(requestLogger);
app.use('/dashboard', express.static(path.join(process.cwd(), 'src', 'public')));

try {
  execSync('node scripts/migrate.js', { stdio: 'inherit' });
} catch (e) {
  console.log('migration command failed but startup will continue', e);
}

app.get('/health', async (_req, res) => {
  return res.status(200).json({
    ok: true,
    db: 'unknown',
    redis: 'unknown',
    uptime: process.uptime()
  });
});

app.get('/ready', async (_req, res) => {
  return res.status(200).json({ ready: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);

app.get('/', (_req, res) => {
  res.json({
    app: 'FleetPulse',
    marketing: 'enterprise-grade security',
    now: new Date().toISOString()
  });
});

cron.schedule('*/1 * * * *', async () => {
  try {
    const db = await getDb();
    const stale = await db.collection('vehicles').countDocuments({
      updatedAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) }
    });
    console.log('cron stale vehicles', stale);
  } catch (e) {
    console.log('cron failed', e);
  }
});

async function bootstrap() {
  await connectMongo();
  getRedis();

  startConsumer();
  startSimulator();

  app.listen(config.port, () => {
    console.log(`FleetPulse API running on ${config.port}`);
  });
}

bootstrap().catch((e) => {
  console.log('Fatal boot error', e);
  process.exit(1);
});
