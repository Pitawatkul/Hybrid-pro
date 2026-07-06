import { GoalSetupForm } from "@/components/forms/GoalSetupForm";

export default function GoalSetupPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-xl font-semibold px-4 pt-4">Set up your goal</h1>
      <GoalSetupForm today={today} />
    </div>
  );
}
