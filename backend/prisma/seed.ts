import { PrismaClient, CertificateStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const hex = randomBytes(4).toString('hex').toUpperCase();
  return `CC-${year}-${hex}`;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Demo admin user
  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@certichain.demo' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@certichain.demo',
      passwordHash,
      emailVerified: true,
    },
  });

  console.log('✓ Created admin user:', adminUser.email);

  // Demo organization
  const org = await prisma.organization.upsert({
    where: { id: 'demo-org-001' },
    update: {},
    create: {
      id: 'demo-org-001',
      name: 'KIT — Kanpur Institute of Technology',
      type: 'University',
      email: 'admin@kit.edu',
      website: 'https://kit.edu',
      description: 'A premier engineering institution.',
      members: {
        create: {
          userId: adminUser.id,
          role: 'OWNER',
        },
      },
    },
  });

  console.log('✓ Created organization:', org.name);

  // Demo template
  const template = await prisma.certificateTemplate.upsert({
    where: { id: 'demo-template-001' },
    update: {},
    create: {
      id: 'demo-template-001',
      organizationId: org.id,
      name: 'Standard Certificate of Completion',
      configuration: {
        layout: 'landscape',
        primaryColor: '#112a29',
        accentColor: '#ddf05c',
        fontFamily: 'Playfair Display',
        showLogo: true,
        showQR: true,
        showSignature: false,
      },
    },
  });

  console.log('✓ Created template:', template.name);

  // Demo recipient
  const recipient = await prisma.recipient.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'amit@example.com' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Amit Chaurasiya',
      email: 'amit@example.com',
    },
  });

  console.log('✓ Created recipient:', recipient.name);

  // Demo certificate
  const certId = 'CC-2026-DEMO01';
  const existingCert = await prisma.certificate.findUnique({ where: { certificateId: certId } });

  if (!existingCert) {
    const cert = await prisma.certificate.create({
      data: {
        certificateId: certId,
        organizationId: org.id,
        templateId: template.id,
        recipientId: recipient.id,
        title: 'Certificate of Completion — B.Tech Information Technology',
        description: 'Successfully completed the four-year B.Tech programme in Information Technology.',
        achievement: 'B.Tech — Information Technology',
        issueDate: new Date('2026-08-19'),
        status: CertificateStatus.ACTIVE,
        verificationUrl: `http://localhost:5173/verify/${certId}`,
        issuedById: adminUser.id,
      },
    });
    console.log('✓ Created certificate:', cert.certificateId);
  }

  // Revoked demo certificate
  const revokedId = 'CC-2026-REVOKED';
  const existingRevoked = await prisma.certificate.findUnique({ where: { certificateId: revokedId } });

  if (!existingRevoked) {
    const revCert = await prisma.certificate.create({
      data: {
        certificateId: revokedId,
        organizationId: org.id,
        recipientId: recipient.id,
        title: 'Certificate of Participation — Workshop on AI',
        issueDate: new Date('2026-07-01'),
        status: CertificateStatus.REVOKED,
        verificationUrl: `http://localhost:5173/verify/${revokedId}`,
        revocation: {
          create: {
            reason: 'Issued in error — incorrect recipient details.',
            revokedById: adminUser.id,
            revokedAt: new Date('2026-07-15'),
          },
        },
      },
    });
    console.log('✓ Created revoked certificate:', revCert.certificateId);
  }

  console.log('\n✅ Seed complete.');
  console.log('\nDemo credentials:');
  console.log('  Email:    admin@certichain.demo');
  console.log('  Password: Demo@1234');
  console.log('\nDemo certificate IDs:');
  console.log('  Active:  CC-2026-DEMO01');
  console.log('  Revoked: CC-2026-REVOKED');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
