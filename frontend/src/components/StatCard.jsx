/**
 * CampusIQ X - StatCard
 * -----------------------------
 * Animated metric card used across Dashboard and other pages to
 * display KPIs (e.g., Total Students, Average CGPA, Placement Score).
 */

import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, suffix = "", accent = "blue", trend }) {
  const accentColors = {
    blue: "#2563eb",
    purple: "#7c3aed",
    green: "#16a34a",
    orange: "#d97706",
    red: "#dc2626",
    teal: "#0d9488",
  };

  const color = accentColors[accent] || accentColors.blue;

  return (
    <motion.div
      className="ciq-glass-card ciq-card-pad"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4 }}
    >
      <div className="ciq-flex-between">
        <div style={{ fontSize: 13, color: "var(--ciq-text-secondary)", fontWeight: 600 }}>
          {label}
        </div>
        {Icon && (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: `${color}1A`,
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 800 }}>{value}</span>
        {suffix && (
          <span style={{ fontSize: 14, color: "var(--ciq-text-secondary)", fontWeight: 600 }}>
            {suffix}
          </span>
        )}
      </div>

      {trend && (
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--ciq-text-secondary)" }}>
          {trend}
        </div>
      )}
    </motion.div>
  );
}
