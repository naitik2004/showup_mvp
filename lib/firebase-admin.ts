import 'server-only';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function firebaseAdminApp() {
  if (getApps().length) return getApps()[0];
  const serialized = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serialized) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured.');
  const serviceAccount = JSON.parse(serialized);
  if (typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
  return initializeApp({ credential: cert(serviceAccount) });
}

export function verifyFirebaseToken(token: string) {
  return getAuth(firebaseAdminApp()).verifyIdToken(token);
}

export async function getFirebaseUserFromRequest(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error('Sign in to continue.');
  return verifyFirebaseToken(match[1]);
}
