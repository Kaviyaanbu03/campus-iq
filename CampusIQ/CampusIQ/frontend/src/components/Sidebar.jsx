/**
 * CampusIQ X - Sidebar Navigation
 * --------------------------------------
 * Fixed left sidebar with branding and primary navigation links for
 * all 10 pages defined in the CampusIQ X specification.
 */

import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MdDashboard,
  MdInsights,
  MdChatBubbleOutline,
  MdEventNote,
  MdDescription,
  MdTrendingUp,
  MdWorkOutline,
  MdRecordVoiceOver,
  MdBarChart,
  MdSettings,
} from "react-icons/md";
import { RiBrainLine } from "react-icons/ri";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: MdDashboard },
  { to: "/student-analysis", label: "Student Analysis", icon: MdInsights },
  { to: "/ai-chat", label: "AI Chat", icon: MdChatBubbleOutline },
  { to: "/study-planner", label: "Study Planner", icon: MdEventNote },
  { to: "/resume-review", label: "Resume Review", icon: MdDescription },
  { to: "/career-roadmap", label: "Career Roadmap", icon: MdTrendingUp },
  { to: "/placement-readiness", label: "Placement Readiness", icon: MdWorkOutline },
  { to: "/interview-coach", label: "Interview Coach", icon: MdRecordVoiceOver },
  { to: "/analytics", label: "Analytics", icon: MdBarChart },
  { to: "/settings", label: "Settings", icon: MdSettings },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: "var(--ciq-sidebar-width)",
        background: "var(--ciq-surface-solid)",
        borderRight: "1px solid var(--ciq-border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        overflowY: "auto",
      }}
      className="ciq-scrollbar"
    >
      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "22px 22px 18px",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "var(--ciq-gradient-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          <RiBrainLine />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.1 }}>
            CampusIQ <span className="ciq-gradient-text">X</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--ciq-text-secondary)" }}>
            Academic Intelligence Platform
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: "var(--ciq-radius-sm)",
              fontSize: 14,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "#fff" : "var(--ciq-text-primary)",
              background: isActive ? "var(--ciq-gradient-primary)" : "transparent",
              boxShadow: isActive ? "0 6px 18px rgba(37,99,235,0.35)" : "none",
              transition: "all 0.18s ease",
            })}
          >
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: isActive ? 0 : 3 }}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}
              >
                <Icon size={18} />
                <span>{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: "auto", padding: 18 }}>
        <div className="ciq-glass-card ciq-card-pad" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
          <strong>Microsoft Agents League 2026</strong>
          <div className="ciq-text-secondary" style={{ marginTop: 4 }}>
            Reasoning Agents Track · Built on Azure AI Foundry
          </div>
        </div>
      </div>
    </aside>
  );
}
