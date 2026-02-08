const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
  const articles = await prisma.article.findMany();

  console.log(`users ${users.length} articles ${articles.length}`);
  console.log(`firstUserEmail ${users[0]?.email ?? ''}`);
  console.log(`firstUserPasswordPrefix ${(users[0]?.password ?? '').slice(0, 4)}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
