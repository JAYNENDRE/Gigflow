# GigFlow - Freelance Marketplace MVP

A minimal viable product for a freelance marketplace where users can post gigs and submit bids.

## Features

- User authentication (register/login)
- Post gigs with title, description, and budget
- Browse and search open gigs
- Submit bids on gigs
- Gig owners can view all bids and hire freelancers
- Hiring logic ensures only one freelancer per gig

## Tech Stack

**Frontend:**
- React.js with Vite
- Tailwind CSS
- TypeScript

**Backend:**
- Supabase (Database + Authentication + Edge Functions)
- PostgreSQL with Row Level Security

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**

   The `.env` file is already configured with Supabase credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Database Schema

### Tables

**gigs**
- id (uuid, primary key)
- title (text)
- description (text)
- budget (numeric)
- owner_id (uuid, references auth.users)
- status (text: 'open' or 'assigned')
- created_at (timestamp)

**bids**
- id (uuid, primary key)
- gig_id (uuid, references gigs)
- freelancer_id (uuid, references auth.users)
- message (text)
- price (numeric)
- status (text: 'pending', 'hired', or 'rejected')
- created_at (timestamp)

## User Flow

1. **Register/Login**: Users create an account or log in
2. **Dashboard**: View all open gigs with search functionality
3. **Create Gig**: Post a new gig with details and budget
4. **View Gig**: Click on a gig to see details
5. **Submit Bid**: Non-owners can submit bids with message and price
6. **View Bids**: Gig owners can see all bids for their gigs
7. **Hire Freelancer**: Gig owners can hire one freelancer, which:
   - Changes selected bid status to 'hired'
   - Changes all other bids to 'rejected'
   - Changes gig status to 'assigned'

## Key Implementation Details

### Authentication
- Supabase Auth with email/password
- User data stored in auth.users table
- Auth state managed via React Context

### Hiring Logic
- Implemented as a Supabase Edge Function
- Ensures atomic operations
- Prevents multiple hires for the same gig

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only create gigs as themselves
- Users cannot bid on their own gigs
- Only gig owners can view bids for their gigs

## Project Structure

```
src/
├── contexts/
│   └── AuthContext.tsx       # Authentication state management
├── hooks/
│   └── useNavigate.ts        # Simple navigation hook
├── lib/
│   └── supabase.ts          # Supabase client configuration
├── pages/
│   ├── Dashboard.tsx        # Main page with gig listing
│   ├── Login.tsx            # Login page
│   ├── Register.tsx         # Registration page
│   ├── CreateGig.tsx        # Create new gig
│   └── GigDetails.tsx       # View gig and submit/view bids
├── App.tsx                  # Main app with routing
└── main.tsx                 # Entry point
```

## API Endpoints (via Supabase)

### Authentication
- Sign up: `supabase.auth.signUp()`
- Sign in: `supabase.auth.signInWithPassword()`
- Sign out: `supabase.auth.signOut()`

### Gigs
- List gigs: `supabase.from('gigs').select()`
- Create gig: `supabase.from('gigs').insert()`

### Bids
- Create bid: `supabase.from('bids').insert()`
- List bids: `supabase.from('bids').select()`
- Hire freelancer: POST to edge function `/functions/v1/hire-freelancer`
