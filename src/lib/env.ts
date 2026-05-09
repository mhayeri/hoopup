type RequiredEnv = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

function read(key: keyof RequiredEnv): string {
  const value = import.meta.env[`VITE_${key}`];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `Missing required env var VITE_${key}. Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

export const env: RequiredEnv = {
  SUPABASE_URL: read('SUPABASE_URL'),
  SUPABASE_ANON_KEY: read('SUPABASE_ANON_KEY'),
};
