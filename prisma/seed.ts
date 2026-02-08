import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user1 = await prisma.user.upsert({
    where: { email: 'sabin@adams.com' },
    update: {},
    create: {
      email: 'sabin@adams.com',
      name: 'Sabin Adams',
      password: 'password-sabin',
    },
  });

 const user2 = await prisma.user.upsert({
    where: { email: 'alex@ruheni.com' },
    update: {},
    create: {
      email: 'alex@ruheni.com',
      name: 'Alex Ruheni',
      password: 'password-alex',
    },
  });

  const post1 = await prisma.article.upsert({
    where: { title: 'Prisma Adds Support for MongoDB' },
    update: {
      authorId: user1.id,
    },
    create: {
      title: 'Prisma Adds Support for MongoDB',
      body: 'Support for MongoDB has been one of the most requested features since the initial release of...',
      description:
        "We are excited to share that today's Prisma ORM release adds stable support for MongoDB!",
      published: false,
      authorId: user1.id,
    },
  });

  const post2 = await prisma.article.upsert({
    where: { title: "What's new in Prisma? (Q1/22)" },
    update: {
      authorId: user2.id,
    },
    create: {
      title: "What's new in Prisma? (Q1/22)",
      body: 'Our engineers have been working hard, issuing new releases with many improvements...',
      description:
        'Learn about everything in the Prisma ecosystem and community from January to March 2022.',
      published: true,
      authorId: user2.id,
    },
  });

  const post3 = await prisma.article.upsert({
    where: { title: 'Prisma Client Extensions: A New Way to Add Functionality' },
    update: {},
    create: {
      title: 'Prisma Client Extensions: A New Way to Add Functionality',
      body: 'Prisma Client extensions provide a powerful way to extend your Prisma Client...',
      description: 'Learn how to extend Prisma Client with your own helpers.',
      published: true,
    },
  });

  console.log({
    users: [user1.email, user2.email],
    articles: [post1.title, post2.title, post3.title],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
