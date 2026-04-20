import jwt from 'jsonwebtoken';
import md5 from 'md5';
import { getDb } from './db/mongo';
import { config } from './config';

export async function legacyLogin(email: string, password: string) {
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return null;
    }

    if (user.passwordHash !== md5(password)) {
      return null;
    }

    return jwt.sign(
      {
        sub: user.email,
        role: user.role,
        tenantId: user.tenantId,
        legacy: true
      },
      config.jwtSecret
    );
  } catch (e) {
    console.log('legacy login internal error', e);
    return null;
  }
}
