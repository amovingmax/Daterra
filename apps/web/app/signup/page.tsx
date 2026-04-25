'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signupSchema } from '@daterra/shared';
import { createBrowserClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);

    const parsed = signupSchema.safeParse({
      full_name: fullName,
      email,
      phone,
      password,
      password_confirm: passwordConfirm,
      accepted_terms: acceptedTerms,
    });

    if (!parsed.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]?.toString() ?? '_';
        if (!newErrors[path]) newErrors[path] = issue.message;
      }
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
        },
      },
    });
    setLoading(false);

    if (error) {
      setGlobalError(
        error.message.includes('registered')
          ? 'Esse email já está cadastrado.'
          : error.message,
      );
      return;
    }

    if (data.session) {
      router.push('/painel');
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <span className="text-5xl">📩</span>
          <h1 className="mt-6 font-display text-2xl font-semibold text-brand-700">
            Confirme seu email
          </h1>
          <p className="mt-3 text-sm text-ink-secondary">
            Enviamos um link de confirmação pra <strong>{email}</strong>. Clique nele e depois faça
            login pra entrar no painel.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-brand-500">
          <span className="text-2xl">🌱</span>
          <span className="font-display text-lg font-semibold">Da Terra</span>
        </Link>
        <h1 className="mt-6 font-display text-2xl font-semibold text-brand-700">Criar conta</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Acesso ao painel é por convite — você precisa estar cadastrado no programa Feito Potiguar.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Nome completo" error={errors.full_name}>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              required
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </Field>
          <Field label="Celular" error={errors.phone}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="(84) 9 8888-7777"
              required
            />
          </Field>
          <Field label="Senha" error={errors.password}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Mínimo 8 caracteres com 1 número"
              required
            />
          </Field>
          <Field label="Confirmar senha" error={errors.password_confirm}>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="input"
              required
            />
          </Field>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span className="text-ink-secondary">
              Aceito os <span className="text-brand-500">Termos de Uso</span> e a{' '}
              <span className="text-brand-500">Política de Privacidade</span>.
            </span>
          </label>
          {errors.accepted_terms && (
            <p className="text-xs text-status-danger">{errors.accepted_terms}</p>
          )}

          {globalError && (
            <p className="rounded-lg bg-status-danger/10 p-3 text-sm text-status-danger">
              {globalError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-secondary">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand-500 underline">
            Entrar
          </Link>
        </p>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          background: white;
          border: 1px solid #d9cfb5;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
        }
        .input:focus {
          outline: none;
          border-color: #2d5f3f;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-primary">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
    </div>
  );
}
