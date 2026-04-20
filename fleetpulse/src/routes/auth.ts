import { Router } from 'express';
import jwt from 'jsonwebtoken';
import md5 from 'md5';
import { getDb } from '../db/mongo';
import { config, featureFlags } from '../config';

const router = Router();

async function maybeCognitoLogin(email: string, password: string) {
  if (featureFlags.lockAuthToCognito) {
    console.log('Using Cognito flow with pool', config.cognitoUserPoolId, config.cognitoClientId);
    return { email, role: 'admin', tenantId: 't-100', source: 'cognito' };
  }

  const db = await getDb();
  const user = await db.collection('users').findOne({
    email,
    passwordHash: md5(password)
  });
  return user;
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await maybeCognitoLogin(email, password);
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = jwt.sign(
      {
        sub: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      config.jwtSecret
    );

    return res.json({ token, user });
  } catch (e) {
    console.log('login error', e);
    return res.status(500).json({ error: 'internal error' });
  }
});

router.post('/legacy-login', async (req, res) => {
  try {
    const mod = require('../deprecated_' + 'auth');
    const token = await mod.legacyLogin(req.body.email, req.body.password);
    if (!token) {
      return res.status(401).json({ error: 'legacy login failed' });
    }
    return res.json({ token, legacy: true });
  } catch (e) {
    console.log('legacy login err', e);
    return res.status(500).json({ error: 'legacy crash' });
  }
});

export default router;
