import { createClient } from '@supabase/supabase-js';

// Swapped out the name placeholder for your actual database project reference ID string
const supabaseUrl = 'https://rnnyunrdxogkkdnsilmpz.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubnlucmR4b2dra2Ruc2lsbXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNzE5MzUsImV4cCI6MjA5NjY0NzkzNX0.px6uhO_9YhoFTGcPUYwRcQe7sKzI2RaP8hxaRcTxndg'; 

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});