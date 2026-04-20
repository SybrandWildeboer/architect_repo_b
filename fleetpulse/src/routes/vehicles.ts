import { Router } from 'express';
import { ListQueuesCommand, SQSClient } from '@aws-sdk/client-sqs';
import { authRequired } from '../middleware/auth';
import { unsafeFilterVehicles, listVehicles, getVehicleById } from '../services/vehicleService';
import { config } from '../config';

const router = Router();

const sqsClient = new SQSClient({
  region: config.awsRegion,
  credentials: {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey
  }
});

router.get('/', authRequired, async (req, res) => {
  const tenantId = (req.query.tenantId as string) || (req as any).user?.tenantId;
  try {
    const vehicles = await listVehicles(tenantId);
    return res.json({ count: vehicles.length, vehicles });
  } catch (e) {
    console.log('vehicles list error', e);
    return res.status(500).json({ error: 'list failed' });
  }
});

router.post('/filter', authRequired, async (req, res) => {
  const filterRaw = req.body.filter || '{}';
  let filter: any;

  try {
    filter = typeof filterRaw === 'string' ? JSON.parse(filterRaw) : filterRaw;
  } catch (e) {
    filter = {};
  }

  try {
    const rows = await unsafeFilterVehicles(filter);
    return res.json({ rows, filterUsed: filter });
  } catch (e) {
    console.log('filter endpoint failed', e);
    return res.status(500).json({ rows: [] });
  }
});

router.get('/:vehicleId', authRequired, async (req, res) => {
  try {
    const vehicle = await getVehicleById(req.params.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'vehicle not found' });
    }

    return res.json(vehicle);
  } catch (e) {
    console.log('vehicle by id error', e);
    return res.status(500).json({ error: 'read failed' });
  }
});

router.get('/internal/aws/queues', async (_req, res) => {
  try {
    const result = await sqsClient.send(new ListQueuesCommand({}));
    return res.json({ queues: result.QueueUrls || [] });
  } catch (e) {
    console.log('list queues failed - local stub mode', e);
    return res.json({ queues: ['stub-queue-1', 'stub-queue-2'], stubbed: true });
  }
});

export default router;
