// Hand-maintained types for the public schema. Mirror these to migrations
// in supabase/migrations/. We're not using `supabase gen types` yet — it
// requires the supabase CLI installed locally and adds a lot of generated
// rows we don't need. Switch to generated types if the schema gets big.

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro';
export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export type RsvpStatus = 'going' | 'waitlist' | 'cancelled';
export type FriendshipStatus = 'pending' | 'accepted';
export type NotificationType = 'friend_session' | 'friend_request';

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
          notifications_enabled: boolean;
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
          // notifications_enabled is omitted — it defaults true and the insert
          // path is the autocreate-on-signup trigger, not the client.
        };
        Update: {
          username?: string;
          bio?: string | null;
          skill_level?: SkillLevel | null;
          preferred_position?: Position | null;
          years_playing?: number | null;
          home_court_id?: number | null;
          avatar_url?: string | null;
          notifications_enabled?: boolean;
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
      court_favorites: {
        Row: {
          user_id: string;
          court_id: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          court_id: number;
        };
        // Toggle semantics — a favorite either exists or doesn't. No mutable
        // columns and no UPDATE RLS policy, so updates are never issued.
        Update: Record<string, never>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: NotificationType;
          session_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        // Rows are created only by SECURITY DEFINER fan-out triggers, never by
        // the client (no INSERT RLS policy) — same convention as `courts`.
        Insert: Record<string, never>;
        // Only read_at is mutable (mark-as-read); the owner-only UPDATE policy
        // keeps user_id pinned.
        Update: {
          read_at?: string | null;
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

/** Favorite row joined with the full court (PostgREST embed) — powers the Favorites tab. */
export type FavoriteCourtRow = {
  user_id: string;
  court_id: number;
  created_at: string;
  court: Database['public']['Tables']['courts']['Row'] | null;
};

/**
 * Notification row joined with the actor's public profile and (for
 * 'friend_session') the hosted session + its court (PostgREST embed).
 * `session` is null for 'friend_request' rows. Powers the navbar dropdown.
 */
export type NotificationWithActor = {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  session_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: Pick<PublicProfile, 'id' | 'username' | 'avatar_url'> | null;
  session: {
    id: string;
    starts_at: string;
    ends_at: string;
    cancelled_at: string | null;
    court: Pick<Database['public']['Tables']['courts']['Row'], 'id' | 'name'> | null;
  } | null;
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
