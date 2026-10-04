'use client'

import Link from "next/link";
import { useState, useTransition } from "react";
import { createGame } from "../../actions";

export default function CreateGamePage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createGame(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full pt-12 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/banker/dashboard" className="text-brand font-medium">
          Batal
        </Link>
        <h1 className="text-xl font-bold text-text-primary flex-1 text-center pr-12">
          Buat Permainan
        </h1>
      </div>

      <form action={onSubmit} className="space-y-6">
        <div className="space-y-4 bg-surface-secondary rounded-2xl p-4">
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1 block" htmlFor="name">
              Nama Permainan
            </label>
            <input 
              id="name"
              name="name"
              type="text" 
              placeholder="Contoh: Monopoly Malam Minggu"
              className="w-full bg-transparent border-b border-divider pb-2 text-[17px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1 block pt-2" htmlFor="initialBalance">
              Saldo Awal Pemain ($)
            </label>
            <input 
              id="initialBalance"
              name="initialBalance"
              type="number" 
              defaultValue="1500"
              className="w-full bg-transparent border-b border-divider pb-2 text-[17px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
              required
              disabled={isPending}
            />
          </div>
        </div>

        <div className="bg-surface-secondary rounded-2xl divide-y divide-divider">
          <div className="flex items-center justify-between p-4">
            <span className="text-[17px] text-text-primary">Tampilkan Saldo Pemain</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="showBalances" defaultChecked className="sr-only peer" disabled={isPending} />
              <div className="w-11 h-6 bg-divider rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-color-income"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-[17px] text-text-primary">Boleh Join Setelah Mulai</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="allowJoin" className="sr-only peer" disabled={isPending} />
              <div className="w-11 h-6 bg-divider rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-color-income"></div>
            </label>
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
          {isPending ? 'Memproses...' : 'Buat Permainan'}
        </button>
      </form>
    </main>
  );
}
