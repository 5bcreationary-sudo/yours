import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HandholdNav } from "@/components/landing/HandholdNav";
import { Sparkle, HandholdMark } from "@/components/landing/Sparkle";
import { DemoModal } from "@/components/landing/DemoModal";
import { HandholdFAQ } from "@/components/landing/HandholdFAQ";
import heroWave from "@/assets/hero-wave.jpg";
import mannequin from "@/assets/mannequin-demo.jpg";
import handsReach from "@/assets/hands-reach.jpg";
import gradientYB from "@/assets/gradient-yellow-blue.jpg";
import gradientGreen from "@/assets/gradient-green.jpg";

const LOGOS = ["aikido", "Parim", "LIVEFORCE", "finbite", "ParcelTracker"];

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-[15px] font-medium hover:scale-[1.02] hover:opacity-95 transition-all shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)] ${className}`}
    >
      <span className="h-5 w-5 rounded-full bg-white/15 flex items-center justify-center">
        <Sparkle className="h-3 w-3" />
      </span>
      {children}
    </button>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-foreground antialiased overflow-x-hidden">
      <HandholdNav />

      {/* HERO */}
      <section className="relative pt-36 md:pt-48 pb-0 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="font-semibold tracking-[-0.035em] leading-[1.02] text-foreground"
            style={{ fontSize: "clamp(2.5rem, 7vw, 4.75rem)" }}
          >
            A dedicated guide for
            <br className="hidden sm:block" /> every buyer
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="mt-6 text-[17px] md:text-[18px] text-muted-foreground"
          >
            AI agents running tailored demos &amp; onboarding 24/7
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex justify-center"
          >
            <PrimaryButton onClick={() => setDemoOpen(true)}>See AI demo</PrimaryButton>
          </motion.div>
        </div>

        {/* Wave graphic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.4, ease: "easeOut" }}
          className="relative mt-16 md:mt-24 -mx-6"
        >
          <img
            src={heroWave}
            alt=""
            width={1920}
            height={640}
            className="w-full h-[220px] sm:h-[320px] md:h-[440px] object-cover object-center select-none pointer-events-none"
          />
        </motion.div>

        {/* Logos */}
        <div className="max-w-[1280px] mx-auto mt-16 md:mt-20 pb-24">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-16 opacity-80">
            {LOGOS.map((logo) => (
              <span
                key={logo}
                className="text-[18px] md:text-[22px] font-semibold tracking-tight text-foreground/85"
                style={{ fontFamily: logo === "LIVEFORCE" ? "Georgia, serif" : undefined }}
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS + TESTIMONIAL */}
      <section className="px-6 py-20 md:py-28 bg-[#fafafa]">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            <div>
              <div className="text-[56px] md:text-[64px] font-medium leading-none tracking-[-0.02em]">60%</div>
              <p className="mt-3 text-[15px] text-muted-foreground max-w-[200px]">
                reduction in bad fit sales calls
              </p>
            </div>
            <div>
              <div className="text-[56px] md:text-[64px] font-medium leading-none tracking-[-0.02em]">20%</div>
              <p className="mt-3 text-[15px] text-muted-foreground max-w-[220px]">
                month-on-month increase in total SQLs
              </p>
            </div>
            <div className="md:pl-4">
              <p className="text-[15px] md:text-[16px] italic text-foreground leading-relaxed">
                &ldquo;Our sales reps are less occupied with bad fit leads, creating extra capacity for outbound, and Handhold&rsquo;s agent has been super useful for coverage outside of regular business hours.&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(210,80%,75%)] to-[hsl(210,60%,55%)]" />
                <div>
                  <div className="text-[14px] font-semibold">Alasdair Reynolds</div>
                  <div className="text-[13px] text-muted-foreground">Head of Growth at Parim</div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo teaser card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="mt-16 md:mt-20 relative rounded-[32px] overflow-hidden bg-[#f5f1ea] aspect-[16/10] md:aspect-[16/9]"
          >
            <img
              src={mannequin}
              alt=""
              width={1536}
              height={896}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 md:pb-20 px-6 text-center">
              <span className="text-[14px] text-foreground/70 mb-2">AI Demo</span>
              <h2
                className="font-semibold tracking-[-0.025em] text-foreground"
                style={{ fontSize: "clamp(1.75rem, 4.2vw, 3.25rem)" }}
              >
                See Handhold in action
              </h2>
              <p className="mt-3 text-[15px] md:text-[16px] text-muted-foreground">
                Let our agent walk you through our product
              </p>
              <div className="mt-7">
                <PrimaryButton onClick={() => setDemoOpen(true)}>Start demo</PrimaryButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DEPLOY AGENTS */}
      <section className="px-6 py-24 md:py-36 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="max-w-2xl">
            <h2
              className="font-semibold tracking-[-0.03em] leading-[1.05]"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              Deploy agents across your customer journey
            </h2>
            <p className="mt-6 text-[17px] text-muted-foreground leading-relaxed max-w-xl">
              Most buyer journeys are full of hurdles, each contributing to drop-off. Let our agents handhold your prospects from intent to activation.
            </p>
          </div>

          {/* Inbound Q&A */}
          <div className="mt-20 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <span className="inline-block px-3 py-1.5 rounded-full bg-black/5 text-[13px] font-medium">
                Inbound Q&amp;A agent
              </span>
              <h3
                className="mt-5 font-semibold tracking-[-0.02em] leading-[1.1]"
                style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
              >
                Help leads validate with AI chat
              </h3>
              <ul className="mt-10 space-y-0">
                <li className="border-t border-black/10 py-5 text-[16px] font-medium">
                  Engages visitors and answers their questions
                </li>
                <li className="border-t border-b border-black/10 py-5 text-[16px] font-medium">
                  Qualifies leads and nudges them towards next steps
                </li>
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="relative rounded-[28px] overflow-hidden aspect-[5/4] p-6 md:p-10 flex flex-col justify-end"
              style={{ backgroundImage: `url(${gradientYB})`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              <div className="space-y-2 ml-auto max-w-[320px]">
                <div className="bg-white/95 backdrop-blur rounded-2xl rounded-tr-md px-4 py-2.5 text-[14px] font-medium text-foreground ml-auto w-fit shadow-sm">
                  Can I sync data with my CRM?
                </div>
                <div className="bg-white/95 backdrop-blur rounded-2xl rounded-tl-md px-4 py-2.5 text-[14px] text-foreground w-fit shadow-sm">
                  Yes, we support integration with most
                  <br /> of the popular CRM systems
                </div>
                <div className="bg-white/95 backdrop-blur rounded-2xl rounded-tl-md px-4 py-2.5 text-[14px] text-foreground w-fit shadow-sm">
                  Want me to show how it
                  <br /> works in a demo?
                </div>
                <div className="bg-white rounded-full p-1 flex items-center gap-1 w-fit shadow-sm mt-3">
                  <span className="h-7 w-7 rounded-full bg-foreground flex items-center justify-center text-[hsl(48,95%,65%)]">
                    <Sparkle className="h-3 w-3" />
                  </span>
                  <button className="rounded-full bg-[hsl(218,90%,60%)] text-white px-4 py-1.5 text-[13px] font-medium">
                    See demo
                  </button>
                  <button className="px-4 py-1.5 text-[13px] font-medium text-foreground">Skip</button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Demo agent (reversed) */}
          <div className="mt-24 md:mt-32 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="relative rounded-[28px] overflow-hidden aspect-[5/4] p-6 md:p-10 flex flex-col justify-center order-2 md:order-1"
              style={{ backgroundImage: `url(${gradientGreen})`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              <div className="space-y-2 max-w-[280px]">
                <p className="text-[13px] text-foreground/70 mb-1">Holly:</p>
                <div className="bg-white/40 backdrop-blur rounded-2xl rounded-tl-md px-4 py-2.5 text-[14px] text-foreground w-fit">
                  Yes, you can sign up and start with
                  <br /> our free plan right now.
                </div>
                <div className="bg-white/40 backdrop-blur rounded-2xl rounded-tl-md px-4 py-2.5 text-[14px] text-foreground w-fit">
                  Let&rsquo;s set up your account to
                  <br /> get you going!
                </div>
                <div className="bg-white rounded-full pl-1 pr-4 py-1 flex items-center gap-2 w-fit shadow-sm mt-3">
                  <span className="h-7 w-7 rounded-full bg-foreground flex items-center justify-center text-[hsl(48,95%,65%)]">
                    <Sparkle className="h-3 w-3" />
                  </span>
                  <span className="text-[13px] font-medium text-foreground">Preparing your account...</span>
                </div>
              </div>
            </motion.div>

            <div className="order-1 md:order-2">
              <span className="inline-block px-3 py-1.5 rounded-full bg-black/5 text-[13px] font-medium">
                Demo agent
              </span>
              <h3
                className="mt-5 font-semibold tracking-[-0.02em] leading-[1.1]"
                style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
              >
                Give 1:1 demos at scale with an AI expert
              </h3>
              <ul className="mt-10 space-y-0">
                <li className="border-t border-black/10 py-5 text-[16px] font-medium">
                  Runs deep-dive demo sessions
                </li>
                <li className="border-t border-black/10 py-5 text-[16px] font-medium">
                  Gathers insights from conversations
                </li>
                <li className="border-t border-b border-black/10 py-5">
                  <div className="text-[16px] font-medium">Turns visitors into customers</div>
                  <p className="mt-2 text-[14px] text-muted-foreground max-w-md">
                    Equips prospects with the knowledge they need to become buyers and gets them started.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24 md:py-32 bg-[#fafafa]">
        <div className="max-w-[1280px] mx-auto">
          <p className="text-[14px] text-muted-foreground mb-10">Frequently Asked Questions</p>
          <HandholdFAQ />
        </div>
      </section>

      {/* CTA with hands */}
      <section className="relative px-6 pt-20 pb-32 md:pt-32 md:pb-44 bg-white overflow-hidden">
        <img
          src={handsReach}
          alt=""
          width={1920}
          height={768}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 pointer-events-none"
        />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2
            className="font-semibold tracking-[-0.025em] leading-[1.1]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            Give a white glove experience to every prospect
          </h2>
          <div className="mt-8">
            <PrimaryButton onClick={() => navigate("/signup")}>Let&rsquo;s talk</PrimaryButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 px-6 py-10 bg-white">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <HandholdMark className="h-3 w-6 text-foreground" />
            <span className="lowercase font-semibold text-foreground">handhold</span>
          </div>
          <span>© 2026 Handhold. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>

      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
