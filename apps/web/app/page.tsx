import Link from 'next/link';
import { FEITO_POTIGUAR_CATEGORIES } from '@daterra/shared';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-sand-50">
      <header className="border-b border-sand-200/60">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 text-brand-500">
            <span className="text-2xl">🌱</span>
            <span className="font-display text-xl font-semibold">Da Terra</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-5 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-accent-400 px-5 py-2 text-sm font-medium text-white hover:bg-accent-500"
            >
              Cadastrar minha loja
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-100 px-3 py-1 text-sm font-medium text-gold-500">
              🏅 Selo Feito Potiguar
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold text-brand-700 sm:text-5xl">
              Direto da terra potiguar pra sua mesa.
            </h1>
            <p className="mt-6 text-lg text-ink-secondary">
              Marketplace de produtos artesanais do Rio Grande do Norte. Compre direto de quem
              produz, com a curadoria oficial do programa Feito Potiguar.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-brand-500 px-6 py-3 text-base font-medium text-white hover:bg-brand-600"
              >
                Sou produtor — quero vender
              </Link>
              <a
                href="#"
                className="rounded-full border border-brand-500 px-6 py-3 text-base font-medium text-brand-600 hover:bg-brand-50"
              >
                Baixar app do cliente
              </a>
            </div>
          </div>

          <div className="rounded-3xl bg-brand-500 p-10 text-white shadow-lg">
            <h2 className="font-display text-2xl">Quem está no Da Terra</h2>
            <ul className="mt-6 grid grid-cols-2 gap-3">
              {FEITO_POTIGUAR_CATEGORIES.map((cat) => (
                <li
                  key={cat.slug}
                  className="rounded-xl bg-brand-600/40 px-4 py-3 text-sm backdrop-blur"
                >
                  <span className="mr-2 text-base">{cat.icon}</span>
                  {cat.label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-24 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: 'Comissão de 15%',
              body: 'Sem mensalidade. Pagamos via Pix em D+7 após cada entrega.',
            },
            {
              title: 'Curadoria embutida',
              body: 'Todo fornecedor já passou pela validação do Feito Potiguar.',
            },
            {
              title: 'Logística RN inteiro',
              body: 'Uber Direct na Grande Natal e Loggi pro interior. Retirada também.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="font-display text-lg font-semibold text-brand-700">{item.title}</h3>
              <p className="mt-2 text-sm text-ink-secondary">{item.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-sand-200/60 py-10 text-center text-sm text-ink-tertiary">
        © {new Date().getFullYear()} Da Terra · Rio Grande do Norte
      </footer>
    </div>
  );
}
