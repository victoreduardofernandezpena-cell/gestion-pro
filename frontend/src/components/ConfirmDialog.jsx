import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Button from "./Button";
import { modalContent, modalOverlay } from "../utils/motionVariants";

export default function ConfirmDialog({ open, title, message, confirmText = "Confirmar", cancelText = "Cancelar", variant = "danger", onConfirm, onCancel, loading = false }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-warm-950/50 px-4 backdrop-blur-sm"
          initial={reduceMotion ? false : "hidden"}
          animate="show"
          exit="exit"
          variants={modalOverlay}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-warm-400 bg-warm-50 p-6 shadow-warm transition-colors duration-200 dark:border-warm-800 dark:bg-warm-900"
            initial={reduceMotion ? false : "hidden"}
            animate="show"
            exit="exit"
            variants={modalContent}
          >
            <h2 className="text-lg font-semibold text-ink dark:text-warm-100">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-warm-700 dark:text-warm-600">{message}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onCancel} disabled={loading}>{cancelText}</Button>
              <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
