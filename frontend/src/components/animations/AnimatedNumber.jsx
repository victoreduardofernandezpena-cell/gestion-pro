import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AnimatedNumber({ value, formatter = (next) => next }) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(motionValue, Number(value || 0), {
      duration: 0.35,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest)
    });
    return () => controls.stop();
  }, [value, reduceMotion, motionValue]);

  return formatter(display);
}
