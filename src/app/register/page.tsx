'use client'

import Link from "next/link";
import { useState, useTransition } from "react";
import { register } from "../actions";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await register(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Buat Akun</h1>
        </div>

        <form action={onSubmit} className="space-y-4">
          <div className="space-y-4 bg-surface-secondary rounded-2xl p-4">
            <div>
              <label className="sr-only" htmlFor="displayName">Nama</label>
              <input 
                id="displayName"
                name="displayName"
                type="text" 
                placeholder="Nama"
                className="w-full bg-transparent border-b border-divider pb-2 text-[17px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="username">Username</label>
              <input 
                id="username"
                name="username"
                type="text" 
                placeholder="Username"
                className="w-full bg-transparent border-b border-divider py-2 text-[17px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="email">Email</label>
              <input 
                id="email"
                name="email"
                type="email" 
                placeholder="Email"
                className="w-full bg-transparent border-b border-divider py-2 text-[17px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="password">Password</label>
              <input 
                id="password"
                name="password"
                type="password" 
                placeholder="Password"
                className="w-full bg-transparent border-b border-divider py-2 text-[17px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="confirmPassword">Konfirmasi Password</label>
              <input 
                id="confirmPassword"
                name="confirmPassword"
                type="password" 
                placeholder="Konfirmasi Password"
                className="w-full bg-transparent pt-2 text-[17px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
                required
                disabled={isPending}
              />
            </div>
          </div>

          {error && (
            <div className="text-color-expense text-sm text-center font-medium bg-color-expense/10 p-3 rounded-xl">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center bg-brand text-white h-14 rounded-2xl font-semibold text-[17px] active:bg-brand-active transition-colors mt-6 disabled:opacity-70"
          >
            {isPending ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <div className="text-center pt-4">
          <Link href="/login" className="text-[15px] text-text-secondary hover:text-text-primary font-medium">
            Kembali ke Masuk
          </Link>
        </div>
      </div>
    </main>
  );
}
