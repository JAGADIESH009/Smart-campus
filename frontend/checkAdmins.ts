import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: { name: 'ADMIN' } },
    include: { profile: true }
  });
  console.log("Found admins:", admins.map(a => ({ email: a.email, name: a.profile?.firstName })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
