# Pledg Server

A DeFi lending platform backend built with Node.js, Prisma, PostgreSQL, and Supabase.

## Tech Stack

- **Backend**: Node.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cloud**: Supabase
- **Blockchain**: Solidity (for smart contracts)

## Features

- User management with KYC status tracking
- Collateral management (ETH)
- Loan creation and management
- Installment tracking
- Transaction history
- Bank account integration
- Wallet management

## Database Schema

The application includes the following main entities:

- **Users**: Core user information with KYC status
- **UserWallets**: Blockchain wallet addresses
- **UserBankAccounts**: Bank account integration
- **Collaterals**: ETH collateral management
- **Loans**: Loan creation and lifecycle management
- **Installments**: Payment schedule tracking
- **Transactions**: All financial transactions

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pledg-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Update the `.env` file with your database connection:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/pledg_db?schema=public"
   ```
   
   For Supabase:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Create and apply migrations
   npm run prisma:migrate
   ```

5. **Verify Setup**
   ```bash
   # Open Prisma Studio to view your database
   npm run prisma:studio
   ```

## Available Scripts

- `npm run dev` - Generate Prisma client and run migrations
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Create and apply new migrations
- `npm run prisma:migrate:deploy` - Deploy migrations to production
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:db:push` - Push schema changes directly to database
- `npm run prisma:db:seed` - Run database seeding

## Database Constraints

The schema includes several business logic constraints:

- Loan amounts: Between ₹1,000 and ₹5,00,000
- Loan duration: Between 1 and 36 months
- Transaction status: Must be 'pending', 'confirmed', or 'failed'

## Development Guidelines

- Follow SOLID principles
- Adhere to DRY, KISS, and YAGNI principles
- Follow OWASP security best practices
- Break tasks into smallest units
- Approach problems step-by-step

## License

ISC 