import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full pt-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Selelos Bank</h1>
        <p className="text-lg text-text-secondary mt-1">Halo, {profile?.display_name || "Pemain"}.</p>
      </div>
      
      <div className="bg-surface-secondary rounded-3xl p-8 flex flex-col items-center justify-center space-y-4">
        <p className="text-text-secondary text-sm font-medium">Tidak ada permainan aktif.</p>
        <button className="bg-brand text-white font-semibold h-12 px-6 rounded-xl active:bg-brand-active transition-colors">
          Gabung Permainan
        </button>
      </div>
    </main>
  );
}
