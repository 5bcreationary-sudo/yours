import { motion } from "framer-motion";
import { YoursLogo } from "@/components/YoursLogo";

export function LandingFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-t border-border py-8 px-8 max-w-[1200px] mx-auto"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <YoursLogo size={36} />
          <span className="text-sm text-muted-foreground">© 2026 Yours</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/privacy" className="text-xs text-muted-foreground hover:text-primary-app transition-colors">Privacy</a>
          <a href="/terms" className="text-xs text-muted-foreground hover:text-primary-app transition-colors">Terms</a>
          <a href="mailto:hello@yours.fm" className="text-xs text-muted-foreground hover:text-primary-app transition-colors">Contact</a>
        </div>
      </div>
    </motion.footer>
  );
}
