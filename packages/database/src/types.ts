/**
 * Tipos gerados automaticamente pelo Supabase CLI.
 *
 * Após conectar o projeto ao Supabase remoto:
 *   pnpm --filter @daterra/database db:gen-types:remote
 *
 * Para uso com Supabase local:
 *   pnpm --filter @daterra/database db:gen-types
 *
 * Este arquivo é regerado automaticamente — não edite à mão.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
