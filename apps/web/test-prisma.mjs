// test-prisma.mjs
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const r = await p.$queryRaw`select 1 as one`;
  console.log('OK', r);
} catch (e) {
  console.error('ERR', e);
} finally {
  await p.$disconnect();
}
