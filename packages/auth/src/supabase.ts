import { createClient } from '@supabase/supabase-js';

export const createSupabaseClient = (supabaseUrl: string, supabaseKey: string) => {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
};

export const getAuthHeaders = (token: string) => ({
  authorization: `Bearer ${token}`,
});

export const validateAuthToken = async (token: string, supabaseUrl: string, supabaseKey: string) => {
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' };
    }
    
    return { user, error: null };
  } catch (err) {
    return { user: null, error: 'Token validation failed' };
  }
};
