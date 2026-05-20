// Hand-maintained types for the public schema. Mirror these to migrations
// in supabase/migrations/. We're not using `supabase gen types` yet — it
// requires the supabase CLI installed locally and adds a lot of generated
// rows we don't need. Switch to generated types if the schema gets big.

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro';
export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export type RsvpStatus = 'going' | 'waitlist' | 'cancelled';
export type FriendshipStatus = 'pending' | 'accepted';

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
        Relationships: [];
      };
      courts: {
        Row: {
          id: number;
          osm_id: number | null;
          name: string | null;
          address: string | null;
          lat: number;
          lng: number;
          surface: string | null;
          hoops: number | null;
          lit: boolean | null;
          last_synced_at: string;
          created_at: string;
        };
        // courts is upserted only by the service_role via an RPC; the
        // anon/authenticated client cannot insert or update directly
        // (no write RLS policies). Keep these structurally empty so
        // postgrest-js accepts the Database type but practical writes
        // through the public client are blocked at the API layer.
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      friendships: {
        Row: {
          requester_id: string;
          addressee_id: string;
          status: FriendshipStatus;
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          requester_id: string;
          addressee_id: string;
          status?: FriendshipStatus;
        };
        // Only `status` is mutable (a BEFORE UPDATE trigger blocks parties +
        // illegal transitions; the addressee-only RLS narrows that further).
        Update: {
          status?: FriendshipStatus;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      upsert_osm_courts: {
        Args: { payload: OsmCourtUpsert[] };
        Returns: null;
      };
      set_court_address: {
        Args: { p_court_id: number; p_address: string };
        Returns: null;
      };
      get_email_by_username: {
        Args: { p_username: string };
        Returns: string | null;
      };
    };
  };
};

// Shape the upsert_osm_courts RPC expects in each payload entry.
export type OsmCourtUpsert = {
  osm_id: number;
  name: string | null;
  lat: number;
  lng: number;
  surface?: string | null;
  hoops?: number | null;
  lit?: 'yes' | 'no' | null;
};

/** Public-readable subset of a profile — used wherever one user is shown to another. */
export type PublicProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  skill_level: SkillLevel | null;
  preferred_position: Position | null;
  years_playing: number | null;
};

/** RSVP row joined with the player's public profile (PostgREST embed). */
export type RsvpWithProfile = {
  session_id: string;
  user_id: string;
  status: RsvpStatus;
  created_at: string;
  profile: PublicProfile | null;
};

/** Friendship row joined with both parties' public profiles (PostgREST embed). */
export type FriendshipWithProfiles = {
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  accepted_at: string | null;
  requester: PublicProfile | null;
  addressee: PublicProfile | null;
};

// Postgres error codes we throw from triggers
export const PG_ERROR_CODES = {
  SESSION_FULL: 'P0001',
  SESSION_NOT_AVAILABLE: 'P0002',
  USERNAME_GENERATION_FAILED: 'P0003',
  FRIENDSHIP_SELF: 'P0004',
  FRIENDSHIP_DUPLICATE: 'P0005',
  FRIENDSHIP_IMMUTABLE: 'P0006',
} as const;
