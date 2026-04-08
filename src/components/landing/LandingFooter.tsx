import { motion } from "framer-motion";
import { HugoMark } from "@/components/HugoMark";

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
          <HugoMark size={16} />
          <span className="text-sm text-muted-foreground">© 2026 Hugo</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-xs text-muted-foreground hover:text-primary-app transition-colors">Privacy</a>
          <a href="#" className="text-xs text-muted-foreground hover:text-primary-app transition-colors">Terms</a>
          <a href="#" className="text-xs text-muted-foreground hover:text-primary-app transition-colors">Contact</a>
        </div>
      </div>
    </motion.footer>
  );
}
