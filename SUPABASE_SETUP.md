# Supabase Local Development Setup

## Current Status
✅ Supabase CLI installed  
✅ Project initialized  
✅ Environment file created  
✅ Client configuration updated  

## Next Steps

### Option 1: Local Supabase with Docker (Recommended for full local development)

1. **Install Docker Desktop**
   - Download from: https://docs.docker.com/desktop/
   - Install and start Docker Desktop

2. **Start Local Supabase**
   ```bash
   supabase start
   ```

3. **Get Local Credentials**
   ```bash
   supabase status
   ```
   Copy the API URL and anon key to your `.env.local` file

4. **Apply Migrations**
   ```bash
   supabase db reset
   ```

### Option 2: Use Supabase Cloud (Easier setup)

1. **Create Supabase Project**
   - Go to https://supabase.com/dashboard
   - Create a new project

2. **Get Project Credentials**
   - Go to Settings > API
   - Copy the Project URL and anon key

3. **Update Environment File**
   - Edit `.env.local` with your cloud project credentials

4. **Apply Migrations to Cloud**
   ```bash
   supabase db push
   ```

## Environment Configuration

Your `.env.local` file should contain:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Schema

Your app includes these tables:
- `profiles` - User profiles
- `tasks` - Habit tracking tasks
- `task_notes` - Daily task notes
- `task_participants` - Task sharing
- `friend_requests` - Social features
- `messages` - Messaging system

## Testing the Integration

1. Start your Next.js app:
   ```bash
   npm run dev
   ```

2. Check the browser console for any Supabase connection errors

3. Test authentication by trying to sign up/sign in

## Troubleshooting

- If you see "Cannot connect to Supabase" errors, check your environment variables
- Make sure Docker is running if using local Supabase
- Check that your Supabase project is active if using cloud

