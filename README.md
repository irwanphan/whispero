# PDCA TTFU Tracker

A comprehensive web application for managing meetings with PDCA (Plan-Do-Check-Action) methodology and Things To Follow Up (TTFU) tracking.

## Features

- **User Management**: Role-based access control (Admin, SPV, Reviewer, User)
- **Meeting Management**: Create, view, and manage meetings with participants
- **TTFU Tracking**: Create and assign tasks with due dates and status tracking
- **Evidence Management**: Submit evidence via links or file uploads
- **Review Workflow**: Approve/reject evidence with comments
- **Dashboard**: Real-time overview of meetings and TTFU status
- **Professional UI**: Modern interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud)
- npm or yarn package manager

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd pdca-ttfu-app
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pdca_ttfu_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Generate a secret with: openssl rand -base64 32
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3002`

## Default Login Credentials

After running the seed script, you can login with:

- **Admin**: `admin@example.com` / `admin123`
- **SPV**: `spv@example.com` / `spv123`
- **Reviewer**: `reviewer@example.com` / `reviewer123`
- **User**: `user@example.com` / `user123`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   └── meetings/          # Meeting management pages
├── components/            # Reusable components
│   └── providers/         # Context providers
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
└── types/                 # TypeScript type definitions
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Meetings
- `GET /api/meetings` - List meetings with filters
- `POST /api/meetings` - Create new meeting
- `GET /api/meetings/:id` - Get meeting details

### TTFUs
- `GET /api/ttfu` - List TTFUs with filters
- `POST /api/ttfu` - Create new TTFU
- `PATCH /api/ttfu/:id` - Update TTFU status

### Users
- `GET /api/users` - List users

## Database Schema

The application uses PostgreSQL with the following main entities:

- **User**: Users with roles (Admin, SPV, Reviewer, User)
- **Meeting**: Meetings with participants and TTFUs
- **TTFU**: Tasks assigned to users with status tracking
- **Evidence**: Submitted evidence (links or files)
- **Review**: Reviews of evidence with approval/rejection

## Development

### Available Scripts

```bash
npm run dev          # Start development server on port 3002
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
```

### Code Style

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement SOLID principles for components
- Use React Hook Form with Zod for form validation

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
