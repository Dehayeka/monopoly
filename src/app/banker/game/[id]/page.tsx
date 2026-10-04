import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function BankerGamePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/banker/login");
  }

  // Get the game
  const { data: game, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !game) {
    redirect("/banker/dashboard");
  }

  return (
    <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full pt-12 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/banker/dashboard" className="text-brand font-medium flex-none">
          ‹ Kembali
        </Link>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary">{game.name}</h1>
        <p className="text-lg text-text-secondary mt-1">Status: {game.status}</p>
      </div>
      
      <div className="bg-surface-secondary rounded-3xl p-8 flex flex-col items-center justify-center space-y-2 text-center">
        <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">Kode Room</p>
        <p className="text-5xl font-bold tracking-widest text-text-primary py-2">{game.room_code}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-[18px] font-semibold text-text-primary">Pemain (0)</h2>
        <div className="bg-surface-secondary rounded-2xl p-6 text-center">
          <p className="text-text-secondary text-sm">Menunggu pemain bergabung...</p>
        </div>
      </div>

      {game.status === 'WAITING' && (
        <button className="w-full bg-brand text-white font-semibold h-14 rounded-2xl flex items-center justify-center active:bg-brand-active transition-colors mt-auto sticky bottom-6 shadow-lg shadow-brand/20">
          Mulai Permainan
        </button>
      )}
    </main>
  );
}
