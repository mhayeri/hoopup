// Hand-maintained types for the public schema. Mirror these to migrations
// in supabase/migrations/. We're not using `supabase gen types` yet — it
// requires the supabase CLI installed locally and adds a lot of generated
// rows we don't need. Switch to generated types if the schema gets big.

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro';
export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export type RsvpStatus = 'going' | 'waitlist' | 'cancelled';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          bio: string | null;
          skill_level: SkillLevel | null;
          preferred_position: Position | null;
          years_playing: number | null;
          home_court_id: number | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          bio?: string | null;
          skill_level?: SkillLevel | null;
          preferred_position?: Position | null;
          years_playing?: number | null;
          home_court_id?: number | null;
          avatar_url?: string | null;
        };
        Update: {
          username?: string;
          bio?: string | null;
          skill_level?: SkillLevel | null;
          preferred_position?: Position | null;
          years_playing?: number | null;
          home_court_id?: number | null;
          avatar_url?: string | null;
        };
      };
      courts: {
        Row: {
          id: number;
          osm_id: number | null;
          name: string | null;
          lat: number;
          lng: number;
          surface: string | null;
          hoops: number | null;
          lit: boolean | null;
          last_synced_at: string;
          created_at: string;
        };
        Insert: never; // writes are service_role only via RPC
        Update: never;
      };
      sessions: {
        Row: {
          id: string;
          court_id: number;
          host_id: string;
          starts_at: string;
          ends_at: string;
          notes: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          court_id: number;
          host_id: string;
          starts_at: string;
          ends_at: string;
          notes?: string | null;
        };
        Update: {
          starts_at?: string;
          ends_at?: string;
          notes?: string | null;
          cancelled_at?: string | null;
        };
      };
      session_rsvps: {
        Row: {
          session_id: string;
          user_id: string;
          status: RsvpStatus;
          created_at: string;
        };
        Insert: {
          session_id: string;
          user_id: string;
          status?: RsvpStatus;
        };
        Update: {
          status?: RsvpStatus;
        };
      };
    };
  };
};

// Postgres error codes we throw from triggers
export const PG_ERROR_CODES = {
  SESSION_FULL: 'P0001',
  SESSION_NOT_AVAILABLE: 'P0002',
  USERNAME_GENERATION_FAILED: 'P0003',
} as const;
