import { redirect } from "next/navigation";
import { verifySession } from "@/lib/db/dal";
import { createClient } from "@/lib/supabase/server";
import { mondayOf } from "@/lib/db/queries";
import { EditPlanForm } from "@/components/plan/EditPlanForm";

export default async function EditPlanPage() {
  const { userId } = await verifySession();
  const supabase = await createClient();
  const weekStartDate = mondayOf(new Date());

  const { data: plan } = await supabase
    .from("weekly_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .eq("status", "active")
    .maybeSingle();

  if (!plan) {
    redirect("/dashboard");
  }

  const { data: plannedSessions } = await supabase
    .from("planned_sessions")
    .select("*")
    .eq("weekly_plan_id", plan.id);

  const { data: exercises } = await supabase.from("exercises").select("id, name");
  const exerciseNamesById = Object.fromEntries((exercises ?? []).map((e) => [e.id, e.name]));

  return (
    <div>
      <h1 className="text-xl font-semibold px-4 pt-4">Edit this week&apos;s plan</h1>
      <EditPlanForm
        weeklyPlanId={plan.id}
        initialSessions={plannedSessions ?? []}
        exerciseNamesById={exerciseNamesById}
      />
    </div>
  );
}
