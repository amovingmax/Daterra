import { createSupabaseServerClient } from './server';
import type { Database } from '@daterra/database';

type SupplierRow = Database['public']['Tables']['suppliers']['Row'];
type SupplierUserRole = Database['public']['Tables']['supplier_users']['Row']['role'];

export interface CurrentSupplier {
  supplier: SupplierRow;
  role: SupplierUserRole;
}

/**
 * Resolve o fornecedor que o usuário logado gerencia.
 * Retorna null se: não logado, ou logado mas sem mapeamento em supplier_users.
 */
export async function getCurrentSupplier(): Promise<CurrentSupplier | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: link } = await supabase
    .from('supplier_users')
    .select('supplier_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!link) return null;

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', link.supplier_id)
    .maybeSingle();

  if (!supplier) return null;

  return { supplier, role: link.role };
}
