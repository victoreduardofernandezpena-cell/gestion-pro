import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp } from "../../utils/motionVariants";

export default function AnimatedCard({ children, className = "", as = "div", ...props }) {
  const reduceMotion = useReducedMotion();
  const Component = reduceMotion ? as : motion[as] || motion.div;

  if (reduceMotion) {
    const StaticComponent = as;
    return <StaticComponent className={className} {...props}>{children}</StaticComponent>;
  }

  return (
    <Component variants={fadeInUp} whileHover={{ y: -2 }} transition={{ duration: 0.16, ease: "easeOut" }} className={className} {...props}>
      {children}
    </Component>
  );
}
