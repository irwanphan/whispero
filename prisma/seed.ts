import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const spvPassword = await bcrypt.hash('spv123', 10);
  const reviewerPassword = await bcrypt.hash('reviewer123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      globalRole: 'ADMIN',
    },
  });

  const spv = await prisma.user.upsert({
    where: { email: 'spv@example.com' },
    update: {},
    create: {
      email: 'spv@example.com',
      name: 'Supervisor User',
      passwordHash: spvPassword,
      globalRole: 'SPV',
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@example.com' },
    update: {},
    create: {
      email: 'reviewer@example.com',
      name: 'Reviewer User',
      passwordHash: reviewerPassword,
      globalRole: 'REVIEWER',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      passwordHash: userPassword,
      globalRole: 'USER',
    },
  });

  // Create a sample meeting
  const meeting = await prisma.meeting.create({
    data: {
      title: 'Weekly Team Meeting',
      date: new Date('2024-01-15T10:00:00Z'),
      notes: 'Discussion about project progress and upcoming tasks',
      createdById: spv.id,
      participants: {
        create: [
          { userId: spv.id, role: 'spv' },
          { userId: reviewer.id, role: 'reviewer' },
          { userId: user.id, role: 'participant' },
        ],
      },
    },
  });

  // Create sample TTFUs
  const ttfu1 = await prisma.tTFU.create({
    data: {
      meetingId: meeting.id,
      title: 'Complete project documentation',
      description: 'Update all project documentation and share with team',
      assigneeId: user.id,
      reviewerId: reviewer.id,
      status: 'OPEN',
      dueDate: new Date('2024-01-22T17:00:00Z'),
    },
  });

  const ttfu2 = await prisma.tTFU.create({
    data: {
      meetingId: meeting.id,
      title: 'Review code changes',
      description: 'Review and approve pending code changes',
      assigneeId: reviewer.id,
      reviewerId: spv.id,
      status: 'IN_PROGRESS',
      dueDate: new Date('2024-01-20T17:00:00Z'),
    },
  });

  // Create sample evidence
  const evidence = await prisma.evidence.create({
    data: {
      ttfuId: ttfu1.id,
      type: 'link',
      url: 'https://docs.google.com/document/d/example',
      description: 'Updated project documentation link',
      submittedById: user.id,
    },
  });

  // Create sample review
  await prisma.review.create({
    data: {
      evidenceId: evidence.id,
      reviewerId: reviewer.id,
      status: 'approved',
      comment: 'Documentation looks good and comprehensive',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('Admin: admin@example.com / admin123');
  console.log('SPV: spv@example.com / spv123');
  console.log('Reviewer: reviewer@example.com / reviewer123');
  console.log('User: user@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
