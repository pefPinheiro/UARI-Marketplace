import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dyajgalsbkcpfrxbingn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5YWpnYWxzYmtjcGZyeGJpbmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3Mzc3NDQsImV4cCI6MjA5NTMxMzc0NH0.aN0zQh4oZklHDt4rH0viYYr_y7LvCJ_iy7lBBREsxsg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
