import { motion } from "framer-motion";
import { ArrowRight, Headphones } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { PressBar } from "@/components/landing/PressBar";
import { ScrollChatDemo } from "@/components/landing/ScrollChatDemo";
import { FeaturesAndStats } from "@/components/landing/FeaturesAndStats";
import { PricingSection } from "@/components/landing/PricingSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Landing({ onStartTrial }: { onStartTrial?: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <LandingNav />
      <HeroSection onStartTrial={onStartTrial} />
      <PressBar />
      <ScrollChatDemo />
      <FeaturesAndStats />
      <PricingSection onStartTrial={onStartTrial} />

      {/* CTA */}
      <section className="max-w-[800px] mx-auto px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-[-0.02em] text-primary-app mb-4">
            Your morning deserves better.
          </h2>
          <p className="text-base text-muted-foreground mb-10 max-w-[420px] mx-auto leading-relaxed">
            Replace morning scrolling with a personalized audio briefing. Free to start, no app required.
          </p>
          <motion.button
            onClick={() => navigate("/signup")}
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
