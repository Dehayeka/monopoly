import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-brand">Selelos Bank</h1>
          <p className="mt-2 text-text-secondary text-lg">Digital banking for game night.</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <Link 
            href="/login"
            className="w-full flex items-center justify-center bg-brand text-white h-14 rounded-2xl font-semibold text-[17px] active:bg-brand-active transition-colors"
          >
            Masuk
          </Link>
          <Link 
            href="/register"
            className="w-full flex items-center justify-center bg-surface-secondary text-text-primary h-14 rounded-2xl font-semibold text-[17px] active:bg-divider transition-colors"
          >
            Daftar
          </Link>
        </div>
        
        <div className="pt-8">
          <Link 
            href="/banker/login"
            className="text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
          >
            Masuk sebagai bankir
          </Link>
        </div>
      </div>
    </main>
  );
}
