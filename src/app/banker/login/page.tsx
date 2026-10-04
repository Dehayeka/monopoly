import Link from "next/link";

export default function BankerLoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Banker</h1>
          <p className="mt-2 text-text-secondary text-[15px]">Masuk untuk mengelola permainan.</p>
        </div>

        <form className="space-y-4">
          <div className="space-y-4 bg-surface-secondary rounded-2xl p-4">
            <div>
              <label className="sr-only" htmlFor="username">Username</label>
              <input 
                id="username"
                name="username"
                type="text" 
                placeholder="Username (e.g. bank)"
                className="w-full bg-transparent border-b border-divider pb-2 text-[17px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
                required
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="password">Password</label>
              <input 
                id="password"
                name="password"
                type="password" 
                placeholder="Password"
                className="w-full bg-transparent pt-2 text-[17px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand transition-colors"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full flex items-center justify-center bg-text-primary text-background h-14 rounded-2xl font-semibold text-[17px] active:opacity-80 transition-opacity mt-6"
          >
            Masuk sebagai Bankir
          </button>
        </form>

        <div className="text-center space-y-4 pt-4">
          <Link href="/login" className="text-[15px] text-text-secondary hover:text-text-primary font-medium">
            Kembali ke login pemain
          </Link>
        </div>
      </div>
    </main>
  );
}
