import AnimatedCard from "../animations/AnimatedCard";
import SectionHeader from "../SectionHeader";

export default function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <AnimatedCard as="section" className={`overflow-hidden rounded-2xl border border-warm-300/80 bg-white/90 p-6 shadow-warm backdrop-blur transition-colors duration-200 dark:border-warm-800/80 dark:bg-warm-900/88 dark:shadow-black/20 ${className}`}>
      <SectionHeader title={title} description={subtitle} />
      {children}
    </AnimatedCard>
  );
}
