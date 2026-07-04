import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp } from "../../utils/motionVariants";

export default function PageTransition({ children }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <motion.div initial="hidden" animate="show" variants={fadeInUp}>
      {children}
    </motion.div>
  );
}
