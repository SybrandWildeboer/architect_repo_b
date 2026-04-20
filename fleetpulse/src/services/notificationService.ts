import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { config } from '../config';

const sqsClient = new SQSClient({
  region: config.awsRegion,
  credentials: {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey
  }
});

export async function sendMaintenanceAlert(vehicleId: string, tenantId: string, message: string) {
  const payload = {
    type: 'maintenance_alert',
    vehicleId,
    tenantId,
    message,
    createdAt: new Date().toISOString()
  };

  try {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: config.sqsQueueUrl,
        MessageBody: JSON.stringify(payload)
      })
    );
    console.log('alert pushed to sqs', payload);
  } catch (e) {
    console.log('alert queue failed, fallback to log', payload, e);
  }
}
