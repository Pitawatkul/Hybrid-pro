import Link from "next/link";
import { verifySession } from "@/lib/db/dal";
import { createClient } from "@/lib/supabase/server";
import { resolveInjury } from "./actions";
import { formatLabel } from "@/lib/constants/injuries";
import type { Injury, InjuryStatus } from "@/lib/db/types";

const STATUS_ORDER: InjuryStatus[] = ["active", "recovering", "resolved"];
const STATUS_LABEL: Record<InjuryStatus, string> = {
  active: "Active",
  recovering: "Recovering",
  resolved: "Resolved",
};

function daysActive(dateStarted: string): number {
  const start = new Date(dateStarted).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
}

export default async function InjuriesPage() {
  const { userId } = await verifySession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("injuries")
    .select("*")
    .eq("user_id", userId)
    .order("date_started", { ascending: false });

  const injuries = (data ?? []) as Injury[];
  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: injuries.filter((i) => i.status === status),
  }));

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-xl font-semibold">Injuries</h1>
        <Link href="/injuries/new" className="text-sm font-medium">
          + Add
        </Link>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {injuries.length === 0 && (
          <p className="text-sm text-zinc-500">No injuries logged. Good luck keeping it that way.</p>
        )}

        {grouped.map(
          ({ status, items }) =>
            items.length > 0 && (
              <section key={status} className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
                  {STATUS_LABEL[status]}
                </h2>
                {items.map((injury) => (
                  <div
                    key={injury.id}
                    className="rounded-xl border border-black/10 p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatLabel(injury.body_part)}</span>
                        <span className="text-xs rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">
                          {formatLabel(injury.severity)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {status === "resolved"
                          ? `Resolved · started ${injury.date_started}`
                          : `${daysActive(injury.date_started)} days active`}
                      </p>
                    </div>

                    {status !== "resolved" && (
                      <form action={resolveInjury.bind(null, injury.id)}>
                        <button
                          type="submit"
                          className="h-11 px-3 rounded-lg border border-black/10 text-sm font-medium"
                        >
                          Mark resolved
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </section>
            )
        )}
      </div>
    </div>
  );
}
