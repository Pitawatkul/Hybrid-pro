import { verifySession } from "@/lib/db/dal";
import { logout } from "@/lib/auth/actions";
import { BottomNav } from "@/components/ui/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await verifySession();

  return (
    <div className="flex flex-1 flex-col">
      <header
        className="flex items-center justify-between px-4 py-3 border-b border-black/10"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <span className="font-semibold">Hybrid Training Tracker</span>
        <form action={logout}>
          <button type="submit" className="text-sm text-zinc-500">
            Sign out
          </button>
        </form>
      </header>

      <main className="flex-1 pb-20">{children}</main>

      <BottomNav />
    </div>
  );
}
