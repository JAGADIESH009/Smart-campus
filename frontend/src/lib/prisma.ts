import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;

// Create a pg pool and bypass TLS verification in development
const pool = new Pool({ 
  connectionString,
  ssl: process.env.NODE_ENV === 'development' 
    ? { rejectUnauthorized: false } 
    : undefined
});

const adapter = new PrismaPg(pool);

// Define global interface to allow Prisma to persist across HMR in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
