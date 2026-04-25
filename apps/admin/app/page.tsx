import Link from 'next/link';

const SECTIONS = [
  { href: '/fornecedores', label: 'Fornecedores', description: 'Onboarding e gestão' },
  { href: '/pedidos', label: 'Pedidos', description: 'Visão consolidada' },
  { href: '/repasses', label: 'Repasses', description: 'Pix D+7 ao fornecedor' },
  { href: '/disputas', label: 'Disputas', description: 'Cancelamentos e reclamações' },
  { href: '/conteudo', label: 'Conteúdo', description: 'Banners e categorias' },
  { href: '/usuarios', label: 'Usuários', description: 'Equipe Da Terra' },
];

export default function AdminHome() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header>
        <h1 className="font-display text-3xl font-semibold text-brand-700">Da Terra · Admin</h1>
        <p className="mt-2 text-ink-secondary">Painel interno da equipe Da Terra.</p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-display text-lg font-semibold text-brand-700">{section.label}</h2>
            <p className="mt-1 text-sm text-ink-secondary">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
