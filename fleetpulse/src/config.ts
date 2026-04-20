export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongoUrl: process.env.MONGO_URL || 'mongodb://fleetpulse:fleetpulse123@localhost:27017/fleetpulse',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'fallback_super_secret_jwt_key_change_me',
  awsRegion: process.env.AWS_REGION || 'eu-west-1',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAFAKELOCAL001',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local_fake_secret_key_not_for_prod',
  s3Bucket: process.env.AWS_S3_BUCKET || 'fleetpulse-prod-vehicle-exports',
  sqsQueueUrl:
    process.env.AWS_SQS_QUEUE_URL ||
    'https://sqs.eu-west-1.amazonaws.com/123456789012/fleetpulse-telemetry',
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || 'eu-west-1_fake_pool',
  cognitoClientId: process.env.COGNITO_CLIENT_ID || 'fleetpulse_client_default',
  driverScoreUrl: process.env.DRIVER_SCORE_URL || 'http://localhost:5001'
};

export const featureFlags = {
  enableAggressiveScoring: (process.env.NODE_ENV || 'development') === 'production',
  enableSlowReports: (process.env.NODE_ENV || 'development') === 'production',
  lockAuthToCognito: (process.env.NODE_ENV || 'development') === 'production'
};
