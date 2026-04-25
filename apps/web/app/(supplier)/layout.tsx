import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const NAV = [
  { href: '/painel', label: 'Dashboard', icon: '📊' },
  { href: '/painel/pedidos', label: 'Pedidos', icon: '📦' },
  { href: '/painel/cardapio', label: 'Cardápio', icon: '🥫' },
  { href: '/painel/estoque', label: 'Estoque', icon: '📋' },
  { href: '/painel/avaliacoes', label: 'Avaliações', icon: '⭐' },
  { href: '/painel/financeiro', label: 'Financeiro', icon: '💰' },
  { href: '/painel/loja', label: 'Configurações da loja', icon: '⚙️' },
];

export default async function SupplierLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen bg-sand-50">
      <aside className="w-64 border-r border-sand-200/60 bg-white px-4 py-6">
        <Link href="/painel" className="flex items-center gap-2 px-2 py-2 text-brand-500">
          <span className="text-2xl">🌱</span>
          <span className="font-display text-lg font-semibold">Da Terra</span>
        </Link>
        <nav className="mt-6 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-primary hover:bg-brand-50"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
