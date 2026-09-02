import { createBrowserClient } from '@supabase/ssr';

const DEFAULT_SUPABASE_URL = 'https://xrpykleatmyjwykysfks.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycHlrbGVhdG15and5a3lzZmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NTE4NTYsImV4cCI6MjEwMTUyNzg1Nn0.I6qBB4lF92-X4qTPIXrEiZK-oxksLgWO4a4LvndrW7U';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

  return createBrowserClient(url, key);
}
