import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Button from "./Button";
import { modalContent, modalOverlay } from "../utils/motionVariants";

export default function ConfirmDialog({ open, title, message, confirmText = "Confirmar", cancelText = "Cancelar", variant = "danger", onConfirm, onCancel, loading = false }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4"
          initial={reduceMotion ? false : "hidden"}
          animate="show"
          exit="exit"
          variants={modalOverlay}
        >
          <motion.div
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900"
            initial={reduceMotion ? false : "hidden"}
            animate="show"
            exit="exit"
            variants={modalContent}
          >
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{message}</p>
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
