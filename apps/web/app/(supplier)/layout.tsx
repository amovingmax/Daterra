import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentSupplier } from '@/lib/supabase/get-current-supplier';

const NAV = [
  { href: '/painel', label: 'Dashboard', icon: '📊', enabled: true },
  { href: '/painel/pedidos', label: 'Pedidos', icon: '📦', enabled: true },
  { href: '/painel/cardapio', label: 'Cardápio', icon: '🥫', enabled: true },
  { href: '/painel/estoque', label: 'Estoque', icon: '📋', enabled: false },
  { href: '/painel/avaliacoes', label: 'Avaliações', icon: '⭐', enabled: false },
  { href: '/painel/financeiro', label: 'Financeiro', icon: '💰', enabled: false },
  { href: '/painel/loja', label: 'Configurações da loja', icon: '⚙️', enabled: false },
] as const;

export default async function SupplierLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const current = await getCurrentSupplier();

  // Sem mapeamento em supplier_users: mostra estado de "aguardando convite"
  if (!current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <span className="text-5xl">🌱</span>
          <h1 className="mt-6 font-display text-2xl font-semibold text-brand-700">
            Você ainda não tem uma loja associada
          </h1>
          <p className="mt-3 text-sm text-ink-secondary">
            O acesso ao painel do fornecedor é por convite da equipe Da Terra após validação do
            seu CNPJ no programa Feito Potiguar.
          </p>
          <p className="mt-3 text-sm text-ink-secondary">
            Entrou aqui sem ter sido convidado? Fale com a gente em{' '}
            <a href="mailto:contato@daterra.app" className="text-brand-500 underline">
              contato@daterra.app
            </a>
            .
          </p>
          <form action="/api/auth/signout" method="post" className="mt-8">
            <button
              type="submit"
              className="rounded-full border border-brand-500 px-6 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-sand-50">
      <aside className="flex w-64 flex-col border-r border-sand-200/60 bg-white">
        <Link href="/painel" className="flex items-center gap-2 px-4 py-5 text-brand-500">
          <span className="text-2xl">🌱</span>
          <span className="font-display text-lg font-semibold">Da Terra</span>
        </Link>

        <div className="border-y border-sand-200/60 px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-ink-tertiary">Sua loja</p>
          <p className="mt-1 truncate font-display text-sm font-semibold text-brand-700">
            {current.supplier.name}
          </p>
          <p className="text-xs text-ink-secondary">
            {current.supplier.city}, {current.supplier.state} ·{' '}
            <span
              className={current.supplier.is_active ? 'text-status-success' : 'text-status-warning'}
            >
              {current.supplier.is_active ? 'Ativa' : 'Aguardando ativação'}
            </span>
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.enabled ? item.href : '#'}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                item.enabled
                  ? 'text-ink-primary hover:bg-brand-50'
                  : 'cursor-not-allowed text-ink-tertiary'
              }`}
              aria-disabled={!item.enabled}
            >
              <span className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                {item.label}
              </span>
              {!item.enabled && <span className="text-xs">Em breve</span>}
            </Link>
          ))}
        </nav>

        <form action="/api/auth/signout" method="post" className="border-t border-sand-200/60 p-4">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-secondary hover:bg-sand-100"
          >
            Sair
          </button>
        </form>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
