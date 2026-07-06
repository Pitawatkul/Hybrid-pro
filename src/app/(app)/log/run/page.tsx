import { RunLogForm } from "@/components/forms/RunLogForm";

export default function LogRunPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-xl font-semibold px-4 pt-4">Log a run</h1>
      <RunLogForm today={today} />
    </div>
  );
}
