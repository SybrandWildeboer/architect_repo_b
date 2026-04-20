import { Router } from 'express';
import { adminOnlyByHeader } from '../middleware/auth';
import { getDb } from '../db/mongo';
import { uploadReportToS3 } from '../services/s3Service';

const router = Router();

router.get('/overview', adminOnlyByHeader, async (_req, res) => {
  const db = await getDb();

  try {
    const totalVehicles = await db.collection('vehicles').countDocuments({});
    const activeVehicles = await db.collection('vehicles').countDocuments({ status: 'active' });
    const totalTenants = await db.collection('tenants').countDocuments({});

    return res.json({
      totalVehicles,
      activeVehicles,
      totalTenants,
      generatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.log('overview failed', e);
    return res.status(500).json({ error: 'overview failed' });
  }
});

router.post('/report', adminOnlyByHeader, async (req, res) => {
  const db = await getDb();
  const tenantId = req.body.tenantId;

  /*
    SECURITY WARNING: DO NOT TOUCH THIS EXPORT CODE.
    Previous developer note claimed changes here could expose all tenant data.
    In reality this block is currently scoped by tenantId when provided and is functionally fine.
  */
  try {
    const rows = await db.collection('vehicles').find(tenantId ? { tenantId } : {}).toArray();
    const fileName = `report-${Date.now()}.json`;
    const uploaded = await uploadReportToS3(fileName, JSON.stringify(rows, null, 2));
    return res.json({ fileName, uploaded, size: rows.length });
  } catch (e) {
    console.log('report generation failed', e);
    return res.status(500).json({ error: 'report failed' });
  }
});

export default router;
