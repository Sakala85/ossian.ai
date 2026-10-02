import { Faq } from "@/components/marketing/faq";
import { Features } from "@/components/marketing/features";
import { FinalCta } from "@/components/marketing/final-cta";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Integrations } from "@/components/marketing/integrations";
import { MotionProvider } from "@/components/marketing/motion-provider";
import { MarketingNav } from "@/components/marketing/nav";
import { Pricing } from "@/components/marketing/pricing";
import { Roi } from "@/components/marketing/roi";
import { Security } from "@/components/marketing/security";
import { Showcase } from "@/components/marketing/showcase";
import { Stakes } from "@/components/marketing/stakes";

/** Marketing landing — always dark, whatever the app theme. */
export default function HomePage() {
  return (
    <div className="dark isolate min-h-dvh overflow-x-clip bg-background text-foreground [color-scheme:dark]">
      <MotionProvider>
        <MarketingNav />
        <main>
          <Hero />
          <Stakes />
          <HowItWorks />
          <Features />
          <Showcase />
          <Integrations />
          <Roi />
          <Pricing />
          <Security />
          <Faq />
          <FinalCta />
        </main>
        <Footer />
      </MotionProvider>
    </div>
  );
}
