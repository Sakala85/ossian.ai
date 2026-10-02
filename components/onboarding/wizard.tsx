"use client";

import { AnimatePresence, MotionConfig, motion, type Variants } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OrbState } from "@/components/voice/orb";
import type { DealershipProfile } from "@/lib/domain/types";
import { saveProfile } from "@/lib/profile-store";
import { AgentPreview } from "./agent-preview";
import {
  EASE,
  buildGreeting,
  clearDraft,
  demoProfileFor,
  emptyProfile,
  initialConnections,
  initialGoLive,
  lineNumber,
  loadDraft,
  nameFromUrl,
  normalizeProfile,
  normalizeUrl,
  parseStep,
  saveDraft,
  syncGreeting,
  templateProfile,
  type Connections,
  type Draft,
  type GoLive,
  type ProfileSource,
  type StartInput,
  type StepId,
  type UpdateProfile,
} from "./lib";
import { StepSkeleton } from "./skeleton";
import { StepAgent } from "./step-agent";
import { StepAnalyze } from "./step-analyze";
import { StepConnect } from "./step-connect";
import { StepDealership } from "./step-dealership";
import { StepGoLive } from "./step-golive";
import { StepReview } from "./step-review";
import { MobileProgress, Stepper } from "./stepper";
import { TopBar } from "./top-bar";
import { useAnalyze } from "./use-analyze";
import { useSpeech } from "./use-speech";

const AUTO_ADVANCE_MS = 1300;
const EMPTY_INPUT: StartInput = { url: "", name: "", sites: null };

const stepHref = (n: StepId) => `/onboarding?step=${n}`;

const panel: Variants = {
  enter: (d: number) => ({ opacity: 0, x: d * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -20 }),
};

/**
 * Self-serve onboarding: URL → streamed site analysis → review → persona →
 * connections → test & go live. The whole dealership lives in one
 * `DealershipProfile` state object; the wizard state is mirrored to
 * localStorage so "Enregistrer et quitter" and the demo round-trip resume.
 */
export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStep = parseStep(searchParams.get("step"));

  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<StepId>(1);
  const [dir, setDir] = useState(1);
  const [maxStep, setMaxStep] = useState<StepId>(1);
  const [profile, setProfile] = useState<DealershipProfile>(() => emptyProfile());
  const [ready, setReady] = useState(false);
  const [source, setSource] = useState<ProfileSource | null>(null);
  const [edited, setEdited] = useState<string[]>([]);
  const [input, setInput] = useState<StartInput>(EMPTY_INPUT);
  const [connections, setConnections] = useState<Connections>(initialConnections);
  const [golive, setGolive] = useState<GoLive>(initialGoLive);
  const [resume, setResume] = useState<Draft | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(false);

  const analysis = useAnalyze();
  const speech = useSpeech();
  const appliedRun = useRef(0);

  /* ---------------------------------------------------------------- */
  /* Navigation                                                        */
  /* ---------------------------------------------------------------- */

  const goTo = (n: StepId, opts: { resetMax?: boolean } = {}) => {
    setDir(n >= step ? 1 : -1);
    setStep(n);
    setMaxStep((m) => (opts.resetMax ? n : (Math.max(m, n) as StepId)));
    if (n === step) window.history.replaceState(null, "", stepHref(n));
    else window.history.pushState(null, "", stepHref(n));
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restore = (d: Draft) => {
    setProfile(d.profile);
    setReady(d.ready);
    setSource(d.source);
    setEdited(d.edited ?? []);
    setInput(d.input ?? EMPTY_INPUT);
    setConnections(d.connections);
    setGolive(d.golive);
    setMaxStep(d.maxStep);
  };

  // Hydrate from the saved draft (resume after "Enregistrer et quitter" or a round-trip to /demo).
  useEffect(() => {
    const d = loadDraft();
    const at = parseStep(new URLSearchParams(window.location.search).get("step"));
    if (d?.ready && !d.golive.live) {
      if (at > 1) {
        const target = Math.min(at, d.maxStep) as StepId;
        restore(d);
        setStep(target);
        if (target !== at) window.history.replaceState(null, "", stepHref(target));
      } else if (d.maxStep > 1) {
        setResume(d);
      }
    } else {
      if (d && !d.ready && d.input?.url) setInput(d.input);
      if (at > 1) window.history.replaceState(null, "", stepHref(1));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Browser back / forward.
  useEffect(() => {
    if (!hydrated) return;
    const target = Math.min(urlStep, maxStep) as StepId;
    if (target !== step) {
      setDir(target > step ? 1 : -1);
      setStep(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlStep, hydrated]);

  /* ---------------------------------------------------------------- */
  /* Profile                                                           */
  /* ---------------------------------------------------------------- */

  const updateProfile: UpdateProfile = useCallback((recipe) => {
    setProfile((prev) => {
      const next = structuredClone(prev);
      recipe(next);
      syncGreeting(prev, next);
      return next;
    });
  }, []);

  const markEdited = useCallback((path: string) => setEdited((e) => (e.includes(path) ? e : [...e, path])), []);
  const aiFilled = source === "ai" || source === "simulated";
  const isAi = useCallback((path: string) => aiFilled && !edited.includes(path), [aiFilled, edited]);

  const resetSession = () => {
    setEdited([]);
    setConnections(initialConnections);
    setGolive(initialGoLive);
    setResume(null);
  };

  const startAnalysis = (next: StartInput & { url: string }) => {
    setInput(next);
    resetSession();
    setProfile(emptyProfile(next.name.trim(), next.url));
    setReady(false);
    setSource(null);
    goTo(2, { resetMax: true });
    void analysis.start(next.url, next.name.trim() || undefined);
  };

  const retry = () => {
    const url = normalizeUrl(input.url);
    if (url) void analysis.start(url, input.name.trim() || undefined);
  };

  const editUrl = () => {
    if (analysis.state.status === "running") analysis.cancel();
    goTo(1);
  };

  const continueWithDemo = () => {
    setProfile(demoProfileFor(normalizeUrl(input.url) ?? input.url, input.name));
    setReady(true);
    setSource("demo");
    setEdited([]);
    goTo(3);
  };

  const skipToManual = () => {
    analysis.cancel();
    resetSession();
    setProfile(templateProfile(input.name.trim()));
    setReady(true);
    setSource("template");
    goTo(3, { resetMax: true });
  };

  const resumeDraft = () => {
    if (!resume) return;
    const target = (resume.step > 1 ? resume.step : resume.maxStep) as StepId;
    restore(resume);
    setResume(null);
    goTo(target);
  };

  const restart = () => {
    analysis.cancel();
    clearDraft();
    setProfile(emptyProfile());
    setReady(false);
    setSource(null);
    setInput(EMPTY_INPUT);
    resetSession();
    goTo(1, { resetMax: true });
  };

  // Apply the streamed profile as soon as it arrives (the preview fills in live).
  useEffect(() => {
    const a = analysis.state;
    if (a.status !== "done" || !a.profile || appliedRun.current === a.runId) return;
    appliedRun.current = a.runId;
    const base = normalizeProfile(a.profile, a.url);
    const typed = input.name.trim();
    let p = base;
    if (typed && typed !== base.name) {
      p = structuredClone(base);
      p.name = typed;
      syncGreeting(base, p);
    }
    setProfile(p);
    setReady(true);
    setSource(a.mode ?? "simulated");
    setEdited([]);
    setMaxStep((m) => Math.max(m, 3) as StepId);
  }, [analysis.state, input.name]);

  // Auto-advance to the review shortly after a fresh analysis completes.
  useEffect(() => {
    const a = analysis.state;
    if (step !== 2 || a.status !== "done" || !ready || !a.doneAt || Date.now() - a.doneAt > 4000) {
      setAutoAdvance(false);
      return;
    }
    setAutoAdvance(true);
    const t = setTimeout(() => {
      setAutoAdvance(false);
      goTo(3);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, analysis.state.status, analysis.state.doneAt, ready]);

  /* ---------------------------------------------------------------- */
  /* Persistence                                                       */
  /* ---------------------------------------------------------------- */

  const draftOf = (over: Partial<Draft> = {}): Draft => ({
    v: 1,
    step,
    maxStep,
    profile,
    ready,
    source,
    edited,
    input,
    connections,
    golive,
    savedAt: Date.now(),
    ...over,
  });

  useEffect(() => {
    if (!hydrated || golive.live) return;
    if (!ready && step === 1) return;
    saveDraft(draftOf());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, step, maxStep, profile, ready, source, edited, input, connections, golive]);

  // Entering "Test & mise en ligne" saves the profile for /demo and /app.
  useEffect(() => {
    if (hydrated && step === 6 && ready) saveProfile(profile);
  }, [hydrated, step, ready, profile]);

  // Stop any voice preview when leaving a step.
  useEffect(() => {
    speech.stop();
  }, [step, speech.stop]);

  const saveAndQuit = () => {
    if (ready) saveProfile(profile);
    if (!golive.live && (ready || step > 1)) saveDraft(draftOf());
    router.push("/app");
  };

  const markTested = () => {
    const g = { ...golive, tested: true };
    setGolive(g);
    if (ready) saveProfile(profile);
    saveDraft(draftOf({ golive: g }));
  };

  const goLive = () => {
    saveProfile(profile);
    setGolive((g) => ({ ...g, live: true }));
    setMaxStep(6);
    clearDraft();
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  const normalizedUrl = normalizeUrl(input.url);
  const displayName = ready ? profile.name : input.name.trim() || (normalizedUrl ? nameFromUrl(normalizedUrl) : "");
  const previewGreeting = ready ? profile.agent.greeting : buildGreeting(displayName, profile.agent.name, profile.agent.voiceId);
  const previewProfile = ready ? profile : { ...profile, website: normalizedUrl ?? profile.website };
  const orbState: OrbState = speech.speakingId
    ? "speaking"
    : analysis.state.status === "running"
      ? "thinking"
      : golive.live
        ? "listening"
        : "idle";
  // A profile is required past the analysis; fall back to the first step otherwise.
  const shown: StepId = !ready && step > 2 ? 1 : step;

  const renderStep = () => {
    switch (shown) {
      case 1:
        return (
          <StepDealership
            input={input}
            onInputChange={setInput}
            onStart={startAnalysis}
            onSkip={skipToManual}
            resume={resume}
            onResume={resumeDraft}
            onDismissResume={() => setResume(null)}
          />
        );
      case 2:
        return (
          <StepAnalyze
            analysis={analysis.state}
            url={input.url}
            ready={ready}
            profile={profile}
            source={source}
            autoAdvanceMs={autoAdvance ? AUTO_ADVANCE_MS : null}
            onContinue={() => goTo(3)}
            onRetry={retry}
            onUseDemo={continueWithDemo}
            onEditUrl={editUrl}
          />
        );
      case 3:
        return (
          <StepReview
            profile={profile}
            update={updateProfile}
            source={source}
            isAi={isAi}
            markEdited={markEdited}
            sitesBucket={input.sites}
            onBack={() => goTo(source === "template" ? 1 : 2)}
            onNext={() => goTo(4)}
          />
        );
      case 4:
        return <StepAgent profile={profile} update={updateProfile} speech={speech} onBack={() => goTo(3)} onNext={() => goTo(5)} />;
      case 5:
        return (
          <StepConnect
            profile={profile}
            update={updateProfile}
            connections={connections}
            onConnectionsChange={setConnections}
            onBack={() => goTo(4)}
            onNext={() => goTo(6)}
          />
        );
      case 6:
        return (
          <StepGoLive
            profile={profile}
            golive={golive}
            onGoliveChange={setGolive}
            onTest={markTested}
            onGoLive={goLive}
            onRestart={restart}
            onBack={() => goTo(5)}
          />
        );
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-dvh bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-grid opacity-40"
          style={{ maskImage: "radial-gradient(ellipse 70% 100% at 50% 0%, #000 0%, transparent 70%)" }}
        />
        <TopBar step={step} live={golive.live} onSaveQuit={saveAndQuit} />
        <MobileProgress step={step} live={golive.live} />

        <div className="relative mx-auto grid w-full max-w-[1400px] gap-10 px-4 pt-8 pb-24 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:pt-14 xl:grid-cols-[208px_minmax(0,1fr)_296px] xl:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-[88px]">
              <Stepper
                step={step}
                maxStep={maxStep}
                skippedAnalysis={source === "template"}
                live={golive.live}
                onSelect={(n) => goTo(n)}
              />
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mx-auto w-full max-w-[720px]">
              {hydrated ? (
                <AnimatePresence mode="wait" initial={false} custom={dir}>
                  <motion.div
                    key={shown}
                    custom={dir}
                    variants={panel}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.28, ease: EASE }}
                  >
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <StepSkeleton />
              )}
            </div>
          </main>

          <aside className="hidden xl:block" aria-label="Aperçu de l'agent">
            <div className="sticky top-[88px]">
              <AgentPreview
                profile={previewProfile}
                displayName={displayName}
                greeting={previewGreeting}
                ready={ready}
                analyzing={analysis.state.status === "running"}
                orbState={orbState}
                live={golive.live}
                line={step === 6 || golive.live ? lineNumber(golive) : undefined}
              />
            </div>
          </aside>
        </div>
      </div>
    </MotionConfig>
  );
}
