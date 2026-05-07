import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { PressBar } from "@/components/landing/PressBar";
import { ScrollBriefingDemo } from "@/components/landing/ScrollBriefingDemo";
import { FeaturesAndStats } from "@/components/landing/FeaturesAndStats";
import { PricingSection } from "@/components/landing/PricingSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getStartedHref = user
    ? user.onboarding_complete
      ? "/app"
      : "/onboarding"
    : "/signup";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <LandingNav getStartedHref={getStartedHref} />
      <HeroSection getStartedHref={getStartedHref} />
      <PressBar />
      <ScrollBriefingDemo />
      <FeaturesAndStats />
      <PricingSection onStartTrial={() => navigate(getStartedHref)} />

      {/* CTA */}
      <section className="max-w-[800px] mx-auto px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-[-0.02em] mb-4">
            Your best morning starts now.
          </h2>
          <p className="text-base text-muted-foreground mb-10 max-w-[420px] mx-auto leading-relaxed">
            Join early users replacing morning scrolling with a personal audio briefing.
          </p>
          <motion.button
            onClick={() => navigate(getStartedHref)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full bg-foreground text-background px-8 py-3 text-[15px] font-medium hover:opacity-85 transition-opacity inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </motion.button>
        </motion.div>
      </section>

      <LandingFooter />
    </div>
  );
}
