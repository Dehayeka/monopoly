import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function BankerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/banker/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== 'BANKER') {
    redirect("/dashboard");
  }

  // Fetch active games
  const { data: activeGames } = await supabase
    .from("games")
    .select("*")
    .eq("banker_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full pt-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Banker</h1>
        <p className="text-lg text-text-secondary mt-1">Halo, {profile.display_name}.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-[18px] font-semibold text-text-primary">Permainan Aktif</h2>
        
        {(!activeGames || activeGames.length === 0) ? (
          <div className="bg-surface-secondary rounded-3xl p-8 flex flex-col items-center justify-center space-y-4">
            <p className="text-text-secondary text-sm font-medium">Belum ada permainan aktif.</p>
            <Link 
              href="/banker/create-game"
              className="bg-brand text-white font-semibold h-12 px-6 rounded-xl flex items-center justify-center active:bg-brand-active transition-colors"
            >
              + Buat Permainan
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeGames.map(game => (
              <Link 
                key={game.id} 
                href={`/banker/game/${game.id}`}
                className="block bg-surface-secondary rounded-2xl p-4 active:bg-divider transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-text-primary">{game.name}</p>
                    <p className="text-sm text-text-secondary mt-1">Kode: {game.room_code}</p>
                  </div>
                  <div className="text-brand font-medium">
                    {game.status}
                  </div>
                </div>
              </Link>
            ))}
            
            <Link 
              href="/banker/create-game"
              className="w-full bg-brand text-white font-semibold h-12 rounded-xl flex items-center justify-center active:bg-brand-active transition-colors mt-4"
            >
              + Buat Permainan Baru
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
