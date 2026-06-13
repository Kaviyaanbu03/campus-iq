/**
 * CampusIQ X - Settings Page
 * -----------------------------------
 * Theme toggle, active student profile selector, agent configuration
 * overview, and Azure AI Foundry connection status.
 */

import { motion } from "framer-motion";
import { MdLightMode, MdDarkMode, MdCloud, MdCloudOff } from "react-icons/md";
import MainLayout from "../layouts/MainLayout";
import { useAppContext } from "../context/AppContext";
import { useFetch } from "../hooks/useFetch";
import { AGENT_COLORS } from "../theme/fluentTheme";

async function getHealth() {
  const base = import.meta.env.VITE_API_BASE_URL || "/api";
  // The Vite dev proxy strips "/api" before forwarding to the FastAPI
  // backend, where the health route is mounted at "/health".
  const res = await fetch(`${base}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export default function Settings() {
  const { themeMode, toggleTheme, students, selectedStudentId, setSelectedStudentId } = useAppContext();
  const { data: health } = useFetch(() => getHealth().catch(() => null), []);

  return (
    <MainLayout title="Settings" subtitle="Appearance, active profile, and Azure AI Foundry connection status">
      <div className="ciq-page-header">
        <div>
          <h1 className="ciq-page-title">Settings</h1>
          <p className="ciq-page-subtitle">Customize your CampusIQ X experience.</p>
        </div>
      </div>

      <div className="ciq-grid ciq-grid-2">
        <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ marginTop: 0 }}>Appearance</h3>
          <div className="ciq-flex-between">
            <div>
              <div style={{ fontWeight: 600 }}>Theme Mode</div>
              <div className="ciq-text-secondary" style={{ fontSize: 12.5 }}>
                Switch between Light and Dark mode.
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="ciq-glass-card"
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
                border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
                color: "var(--ciq-text-primary)",
              }}
            >
              {themeMode === "light" ? <MdLightMode /> : <MdDarkMode />}
              {themeMode === "light" ? "Light" : "Dark"}
            </button>
          </div>
        </motion.div>

        <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 style={{ marginTop: 0 }}>Active Student Profile</h3>
          <div className="ciq-text-secondary" style={{ fontSize: 12.5, marginBottom: 10 }}>
            All pages (Analysis, AI Chat, Study Planner, etc.) reflect this profile.
          </div>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: "var(--ciq-radius-sm)",
              border: "1px solid var(--ciq-border)", background: "var(--ciq-surface-solid)",
              color: "var(--ciq-text-primary)", fontSize: 13.5, fontWeight: 600,
            }}
          >
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.name} ({s.student_id}) - {s.department}
              </option>
            ))}
          </select>
        </motion.div>

        <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ marginTop: 0 }}>Azure AI Foundry Connection</h3>
          <div className="ciq-flex-between">
            <div>
              <div style={{ fontWeight: 600 }}>Azure OpenAI (GPT-4o)</div>
              <div className="ciq-text-secondary" style={{ fontSize: 12.5 }}>
                {health?.azure_openai_live
                  ? "Connected - live reasoning enabled."
                  : "Not configured - using demo-safe rule-based fallback reasoning."}
              </div>
            </div>
            {health?.azure_openai_live ? (
              <MdCloud size={24} color="var(--ciq-success)" />
            ) : (
              <MdCloudOff size={24} color="var(--ciq-warning)" />
            )}
          </div>
          <div className="ciq-text-secondary ciq-mt-16" style={{ fontSize: 12 }}>
            Configure AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and
            AZURE_OPENAI_DEPLOYMENT in the backend environment to enable
            live GPT-4o reasoning.
          </div>
        </motion.div>

        <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 style={{ marginTop: 0 }}>Agent Registry</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(health?.agents || Object.keys(AGENT_COLORS)).map((agent) => (
              <div key={agent} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: AGENT_COLORS[agent] || "#2563eb" }} />
                {agent}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
