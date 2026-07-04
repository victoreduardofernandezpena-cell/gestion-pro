export const duration = 0.2;

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration, ease: "easeOut" } }
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration, ease: "easeOut" } }
};

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.02
    }
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: { duration, ease: "easeOut" } }
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration, ease: "easeOut" } }
};

export const modalOverlay = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }
};

export const modalContent = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.98, y: 8, transition: { duration: 0.15, ease: "easeIn" } }
};
