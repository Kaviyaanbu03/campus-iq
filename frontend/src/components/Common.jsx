/**
 * CampusIQ X - Shared UI primitives
 * -----------------------------------------
 * Skeleton: loading placeholder blocks.
 * StatusBadge: pill badge for risk levels / agent status.
 * ToastProvider/useToast: lightweight toast notification system
 * (no external dependency needed).
 */

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MdCheckCircle, MdError, MdInfo } from "react-icons/md";
import { RISK_COLORS } from "../theme/fluentTheme";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function Skeleton({ height = 16, width = "100%", style = {} }) {
  return (
    <div
      className="ciq-skeleton"
      style={{ height, width, ...style }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="ciq-glass-card ciq-card-pad">
      <Skeleton height={14} width="40%" style={{ marginBottom: 12 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={12} style={{ marginBottom: 8 }} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

export function StatusBadge({ level }) {
  const color = RISK_COLORS[level] || "#64748b";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color,
        background: `${color}1A`,
        border: `1px solid ${color}33`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {level}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Toast system
// ---------------------------------------------------------------------------

const ToastContext = createContext(null);

const ICONS = {
  success: MdCheckCircle,
  error: MdError,
  info: MdInfo,
};

const COLORS = {
  success: "#16a34a",
  error: "#dc2626",
  info: "#2563eb",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 1000,
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type] || MdInfo;
            const color = COLORS[toast.type] || COLORS.info;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="ciq-glass-card ciq-card-pad"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 240,
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <Icon size={20} color={color} />
                <span style={{ fontSize: 13.5 }}>{toast.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
