import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Starting database seeding...');

  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      passwordHash: '$2b$10$rQZ8N3YqJ8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+919876543210',
      dateOfBirth: new Date('1990-01-15'),
      emailRegistered: true,
      kycBasicStatus: 'verified',
      kycBankStatus: 'verified',
      kycAadharStatus: 'verified',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      email: 'jane.smith@example.com',
      passwordHash: '$2b$10$rQZ8N3YqJ8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z',
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '+919876543211',
      dateOfBirth: new Date('1985-05-20'),
      kycBasicStatus: 'verified',
      kycBankStatus: 'verified',
      kycAadharStatus: 'verified',
    },
  });

  console.log('Users created:', { user1: user1.email, user2: user2.email });

  await prisma.userWallet.create({
    data: {
      userId: user1.id,
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    },
  });

  await prisma.userWallet.create({
    data: {
      userId: user2.id,
      address: '0x8ba1f109551bD432803012645Hac136c772c3c7c',
    },
  });

  console.log('Wallets created');

  await prisma.userBankAccount.create({
    data: {
      userId: user1.id,
      secureToken: 'bank_token_12345',
      verified: true,
    },
  });

  await prisma.userBankAccount.create({
    data: {
      userId: user2.id,
      secureToken: 'bank_token_67890',
      verified: true,
    },
  });

  console.log('✅ Bank accounts created');

  const collateral1 = await prisma.collateral.create({
    data: {
      userId: user1.id,
      type: 'eth',
      amount: 2.5,
      remainingAmount: 2.5,
      lockedValueInr: 450000,
      lockedTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'locked',
    },
  });

  console.log('✅ Collateral created');

  // Create sample loan
  const loan1 = await prisma.loan.create({
    data: {
      borrowerId: user1.id,
      lenderId: user2.id,
      collateralId: collateral1.id,
      amountInr: 300000,
      interestRate: 12.5,
      durationMonths: 12,
      monthlyPayment: 27000,
      ltv: 66.67,
      status: 'active',
      fundedAt: new Date(),
    },
  });

  console.log('✅ Loan created');

  // Create sample installments
  for (let i = 1; i <= 12; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);
    
    await prisma.installment.create({
      data: {
        loanId: loan1.id,
        dueDate: dueDate,
        amount: 27000,
        status: i === 1 ? 'paid' : 'pending',
        paidAt: i === 1 ? new Date() : null,
      },
    });
  }

  console.log('✅ Installments created');

  // Create sample transactions
  await prisma.transaction.create({
    data: {
      loanId: loan1.id,
      userId: user1.id,
      type: 'collateral_lock',
      amount: 2.5,
      currency: 'eth',
      blockchainTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'confirmed',
      confirmedAt: new Date(),
    },
  });

  await prisma.transaction.create({
    data: {
      loanId: loan1.id,
      userId: user2.id,
      type: 'funding',
      amount: 300000,
      currency: 'inr',
      fiatReference: 'TXN123456789',
      status: 'confirmed',
      confirmedAt: new Date(),
    },
  });

  console.log('✅ Transactions created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 