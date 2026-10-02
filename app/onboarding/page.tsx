import { Suspense } from "react";
import { OnboardingSkeleton } from "@/components/onboarding/skeleton";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <OnboardingWizard />
    </Suspense>
  );
}
