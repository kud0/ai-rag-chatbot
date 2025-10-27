/**
 * Database type definitions for Supabase.
 *
 * This file contains TypeScript types that match your Supabase database schema.
 * These types should be generated or updated after running database migrations.
 *
 * To generate these types automatically from your Supabase project:
 * ```bash
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
 * ```
 *
 * Or if using local development:
 * ```bash
 * npx supabase gen types typescript --local > types/database.ts
 * ```
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Main database interface.
 * Add your table definitions here after running migrations.
 */
export interface Database {
  public: {
    Tables: {
      // Example table structure (replace with your actual tables):
      // users: {
      //   Row: {
      //     id: string;
      //     email: string;
      //     created_at: string;
      //   };
      //   Insert: {
      //     id?: string;
      //     email: string;
      //     created_at?: string;
      //   };
      //   Update: {
      //     id?: string;
      //     email?: string;
      //     created_at?: string;
      //   };
      // };
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: string;
    };
  };
}

/**
 * Helper type to extract a table's row type
 * @example
 * type User = Tables<'users'>
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Helper type to extract a table's insert type
 * @example
 * type NewUser = TablesInsert<'users'>
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * Helper type to extract a table's update type
 * @example
 * type UserUpdate = TablesUpdate<'users'>
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/**
 * Helper type to extract an enum type
 * @example
 * type UserRole = Enums<'user_role'>
 */
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
