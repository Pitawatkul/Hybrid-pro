import { InjuryForm } from "@/components/forms/InjuryForm";

export default function NewInjuryPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-xl font-semibold px-4 pt-4">Log an injury</h1>
      <InjuryForm today={today} />
    </div>
  );
}
