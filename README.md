# Blog Application

A modern, full-featured blog application built with Next.js 15, TypeScript, shadcn/ui, and PostgreSQL.

## Features

- **CRUD Operations**: Create, Read, Update, and Delete blog posts
- **Authentication**: Simple email/password authentication with NextAuth.js
- **Rich UI**: Clean, elegant interface using shadcn/ui components
- **Dark/Light Mode**: Theme toggle with system preference detection
- **Responsive Design**: Mobile-friendly interface
- **Database**: PostgreSQL with Prisma ORM
- **Type Safety**: Full TypeScript support

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI**: shadcn/ui components with Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS with custom theme

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd blog-copilot
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/blog_copilot"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

4. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── posts/             # Blog post pages
│   └── create/            # Create post page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
└── lib/                  # Utility functions
    ├── auth.ts           # NextAuth configuration
    ├── prisma.ts         # Prisma client
    └── utils.ts          # Utility functions
```

## Features Overview

### Homepage

- Lists all blog posts with title, author, and preview
- Clean card-based layout
- Responsive design

### Blog Posts

- Full post content display
- Author information and creation date
- Edit/Delete buttons for post authors
- Back navigation

### Create/Edit Posts

- Simple form with title and content fields
- Rich text support
- Form validation
- Author-only editing permissions

### Authentication

- Sign up with name, email, and password
- Sign in with email and password
- Session management
- Protected routes

### Navigation

- Clean navbar with theme toggle
- User menu with logout option
- Responsive design
- Dark/light mode support

## API Routes

- `POST /api/posts` - Create a new post
- `PUT /api/posts/[id]` - Update a post
- `DELETE /api/posts/[id]` - Delete a post
- `POST /api/auth/register` - Register a new user

## Database Schema

- **User**: id, email, passwordHash, name, createdAt
- **Post**: id, title, content, authorId, createdAt, updatedAt
- **Session**: id, sessionToken, userId, expires

