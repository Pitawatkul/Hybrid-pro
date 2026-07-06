"use client";

export function RegenerateButton({ hasExistingPlan }: { hasExistingPlan: boolean }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (
      hasExistingPlan &&
      !window.confirm("This replaces your current plan for this week. Continue?")
    ) {
      e.preventDefault();
    }
  }

  return (
    <form action="/api/plan/regenerate" method="POST" onSubmit={handleSubmit}>
      <button
        type="submit"
        className="h-11 w-full rounded-lg bg-foreground text-background font-medium"
      >
        {hasExistingPlan ? "Regenerate this week" : "Generate this week's plan"}
      </button>
    </form>
  );
}
