import { createClient } from "@/lib/supabase/server";
import { LiftLogForm } from "@/components/forms/LiftLogForm";

export default async function LogLiftPage() {
  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name")
    .order("name");

  return (
    <div>
      <h1 className="text-xl font-semibold px-4 pt-4">Log a lift session</h1>
      <LiftLogForm today={today} exercises={exercises ?? []} />
    </div>
  );
}
