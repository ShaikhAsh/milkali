import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Connection pooling: Prisma uses DATABASE_URL (should point to Supabase PgBouncer pooler, port 6543).
// For migrations, use DIRECT_URL (direct connection, port 5432) configured in schema.prisma.
// This prevents serverless connection exhaustion (100+ functions → 100+ connections).
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
