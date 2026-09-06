export function decodeJwtPayload<T>(token: string): T {
  const payloadSegment = token.split('.')[1];
  const decoded = Buffer.from(payloadSegment, 'base64url').toString('utf-8');
  return JSON.parse(decoded) as T;
}
