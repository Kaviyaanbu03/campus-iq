/**
 * CampusIQ X - Top Navigation Bar
 * --------------------------------------
 * Displays the current page context, a global student selector
 * (drives Student Analysis, AI Chat, Study Planner, Resume Review,
 * Career Roadmap, Placement Readiness, Interview Coach), and a
 * light/dark theme toggle.
 */

import { MdLightMode, MdDarkMode, MdPerson } from "react-icons/md";
import { useAppContext } from "../context/AppContext";

export default function TopNav({ title, subtitle }) {
  const { students, selectedStudentId, setSelectedStudentId, themeMode, toggleTheme } =
    useAppContext();

  return (
    <header
      style={{
        height: "var(--ciq-topnav-height)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        borderBottom: "1px solid var(--ciq-border)",
        background: "var(--ciq-surface)",
        backdropFilter: "blur(18px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12, color: "var(--ciq-text-secondary)" }}>{subtitle}</div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          className="ciq-glass-card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            fontSize: 13,
          }}
        >
          <MdPerson size={16} />
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ciq-text-primary)",
              maxWidth: 160,
            }}
          >
            {students.length === 0 && <option>{selectedStudentId}</option>}
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.name} ({s.student_id})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="ciq-glass-card"
          style={{
            width: 38,
            height: 38,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ciq-text-primary)",
          }}
        >
          {themeMode === "light" ? <MdDarkMode size={18} /> : <MdLightMode size={18} />}
        </button>
      </div>
    </header>
  );
}
