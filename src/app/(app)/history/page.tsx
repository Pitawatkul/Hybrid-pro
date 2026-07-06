import { verifySession } from "@/lib/db/dal";
import { createClient } from "@/lib/supabase/server";
import { formatLabel } from "@/lib/constants/injuries";

const SOURCE_LABEL: Record<string, string> = {
  auto: "Auto-generated",
  manual_regenerate: "Manually regenerated",
  manual_edit: "Manually edited",
};

export default async function HistoryPage() {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("weekly_plans")
    .select("*")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false });

  return (
    <div>
      <h1 className="text-xl font-semibold px-4 pt-4">History</h1>

      <div className="p-4 flex flex-col gap-3">
        {(!plans || plans.length === 0) && (
          <p className="text-sm text-zinc-500">No plans generated yet.</p>
        )}

        {plans?.map((plan) => (
          <details key={plan.id} className="rounded-xl border border-black/10 p-3">
            <summary className="flex items-center justify-between cursor-pointer">
              <span className="font-medium">Week of {plan.week_start_date}</span>
              <span className="text-xs text-zinc-500">
                {formatLabel(plan.status)} · {SOURCE_LABEL[plan.generation_source]}
              </span>
            </summary>
            <ul className="mt-2 flex flex-col gap-1">
              {plan.generation_rationale.map((line, i) => (
                <li key={i} className="text-sm text-zinc-600">
                  {line}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
