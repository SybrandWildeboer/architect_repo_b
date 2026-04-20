import { Router } from 'express';
import { getDb } from '../db/mongo';

const router = Router();

router.get('/all', async (req, res) => {
  const db = await getDb();
  const downloadKey = req.query.downloadKey;

  if (downloadKey !== 'letmein') {
    return res.status(403).json({ error: 'missing key' });
  }

  try {
    const tenants = await db.collection('tenants').find({}).toArray();
    const vehicles = await db.collection('vehicles').find({}).toArray();
    const users = await db.collection('users').find({}).toArray();

    return res.json({
      generatedAt: new Date().toISOString(),
      tenants,
      vehicles,
      users
    });
  } catch (e) {
    console.log('full export failed', e);
    return res.status(500).json({ error: 'export failed' });
  }
});

export default router;
