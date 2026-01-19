# MediQueue - Hospital Queue Management System

A modern hospital OPD queue management system built with React, TypeScript, and Supabase.

## Features

- **Patient Portal**: Book appointments, view queue status, and track token positions
- **Doctor Dashboard**: Manage patient queues, call next patients, mark appointments complete
- **Admin Panel**: Manage doctors, departments, view analytics, configure system settings
- **Real-time Updates**: Live queue status with WebSocket subscriptions
- **Smart Wait Time**: Estimated wait time based on average consultation duration
- **Notifications**: SMS/Push notifications when patient's turn is approaching

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Build Tool**: Vite
- **State Management**: TanStack Query

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or bun
- Supabase account

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd queue-buddy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Project Structure

```
src/
├── components/
│   ├── admin/        # Admin panel components
│   ├── doctor/       # Doctor dashboard components
│   ├── home/         # Landing page sections
│   ├── layout/       # Header, navigation
│   └── ui/           # Reusable UI components
├── hooks/            # Custom React hooks
├── integrations/     # Supabase client and types
├── lib/              # Utility functions
├── pages/            # Page components
└── types/            # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

Build the project and deploy to any static hosting:

```bash
npm run build
```

The build output will be in the `dist` folder.

## License

MIT
