require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: { name: 'ADMIN' } },
    include: { profile: true }
  });
  console.log("Found admins:", admins.map(a => ({ email: a.email, name: a.profile?.firstName })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
