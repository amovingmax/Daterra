import { formatBRL } from '@daterra/shared';

export default function DashboardPage() {
  const kpis = [
    { label: 'Pedidos hoje', value: '0' },
    { label: 'Faturamento hoje', value: formatBRL(0) },
    { label: 'Pedidos da semana', value: '0' },
    { label: 'Avaliação média', value: '—' },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-brand-700">Dashboard</h1>
      <p className="mt-2 text-ink-secondary">Visão geral da sua loja no Da Terra.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-ink-secondary">{kpi.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink-primary">{kpi.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-brand-700">Pedidos pendentes</h2>
        <p className="mt-3 text-sm text-ink-secondary">
          Nada pendente agora. Quando entrarem novos pedidos, eles aparecem aqui em destaque.
        </p>
      </section>
    </div>
  );
}
