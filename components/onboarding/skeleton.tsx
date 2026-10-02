/** Loading placeholder for the step panel (also used as the route's Suspense fallback). */
export function StepSkeleton() {
  return (
    <div aria-hidden className="animate-fade-in">
      <div className="h-6 w-56 animate-pulse rounded-full bg-muted" />
      <div className="mt-6 h-12 w-full max-w-lg animate-pulse rounded-xl bg-muted" />
      <div className="mt-3 h-12 w-2/3 max-w-md animate-pulse rounded-xl bg-muted" />
      <div className="mt-6 h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-3/4 max-w-lg animate-pulse rounded bg-muted" />
      <div className="mt-10 h-14 w-full animate-pulse rounded-xl bg-muted" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="h-9.5 animate-pulse rounded-[10px] bg-muted" />
        <div className="h-9.5 animate-pulse rounded-[10px] bg-muted" />
      </div>
    </div>
  );
}

export function OnboardingSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto w-full max-w-[720px] px-4 pt-10 sm:px-6 lg:pt-14">
        <StepSkeleton />
      </div>
    </div>
  );
}
