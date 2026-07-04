import AnimatedCard from "../animations/AnimatedCard";
import SectionHeader from "../SectionHeader";

export default function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <AnimatedCard as="section" className={`overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 p-6 shadow-soft shadow-slate-900/5 transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-black/10 ${className}`}>
      <SectionHeader title={title} description={subtitle} />
      {children}
    </AnimatedCard>
  );
}
