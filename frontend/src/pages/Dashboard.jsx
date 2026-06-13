/**
 * CampusIQ X - Dashboard Page
 * -----------------------------------
 * Enterprise overview: total students, placement readiness, academic
 * risk, average CGPA/attendance, resume/placement/interview scores,
 * AI recommendations, agent health, and recent activity feed.
 */

import {
  MdGroups,
  MdWorkOutline,
  MdWarningAmber,
  MdSchool,
  MdEventAvailable,
  MdDescription,
  MdTrendingUp,
  MdRecordVoiceOver,
} from "react-icons/md";
import { motion } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import StatCard from "../components/StatCard";
import { CardSkeleton } from "../components/Common";
import { useFetch } from "../hooks/useFetch";
import api from "../services/api";

export default function Dashboard() {
  const { data, loading, error } = useFetch(() => api.getDashboard(), []);

  return (
    <MainLayout
      title="Dashboard"
      subtitle="CampusIQ X - AI Powered Academic Intelligence Platform overview"
    >
      <div className="ciq-page-header">
        <div>
          <h1 className="ciq-page-title">
            Welcome back to <span className="ciq-gradient-text">CampusIQ X</span>
          </h1>
          <p className="ciq-page-subtitle">
            Multi-agent reasoning powered by Microsoft Azure AI Foundry
          </p>
        </div>
        <span className="ciq-gradient-pill">● All Agents Operational</span>
      </div>

      {error && (
        <div className="ciq-glass-card ciq-card-pad" style={{ marginBottom: 20, color: "var(--ciq-danger)" }}>
          Failed to load dashboard data: {error.message}. Make sure the FastAPI backend is running on
          http://localhost:8000.
        </div>
      )}

      {loading ? (
        <div className="ciq-grid ciq-grid-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} rows={1} />
          ))}
        </div>
      ) : (
        <>
          <div className="ciq-grid ciq-grid-4">
            <StatCard icon={MdGroups} label="Total Students" value={data?.total_students ?? "-"} accent="blue" />
            <StatCard icon={MdWorkOutline} label="Placement Ready" value={data?.placement_ready ?? "-"} accent="green" />
            <StatCard icon={MdWarningAmber} label="Academic Risk (High)" value={data?.academic_risk_high ?? "-"} accent="red" />
            <StatCard icon={MdSchool} label="Average CGPA" value={data?.average_cgpa ?? "-"} suffix="/ 10" accent="purple" />
            <StatCard icon={MdEventAvailable} label="Attendance" value={data?.average_attendance ?? "-"} suffix="%" accent="teal" />
            <StatCard icon={MdDescription} label="Avg Resume Score" value={data?.average_resume_score ?? "-"} suffix="/ 100" accent="orange" />
            <StatCard icon={MdTrendingUp} label="Avg Placement Score" value={data?.average_placement_score ?? "-"} suffix="/ 100" accent="blue" />
            <StatCard icon={MdRecordVoiceOver} label="Avg Interview Score" value={data?.average_interview_score ?? "-"} suffix="/ 100" accent="purple" />
          </div>

          <div className="ciq-grid ciq-grid-2 ciq-mt-24">
            {/* Agent Health */}
            <motion.div
              className="ciq-glass-card ciq-card-pad"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <h3 style={{ marginTop: 0 }}>Agent Health</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(data?.agent_health || {}).map(([agent, status]) => (
                  <div key={agent} className="ciq-flex-between" style={{ fontSize: 13.5 }}>
                    <span>{agent}</span>
                    <span
                      style={{
                        color: status === "Healthy" ? "var(--ciq-success)" : "var(--ciq-danger)",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: status === "Healthy" ? "var(--ciq-success)" : "var(--ciq-danger)",
                        }}
                      />
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              className="ciq-glass-card ciq-card-pad"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <h3 style={{ marginTop: 0 }}>Recent AI Activity</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(data?.recent_activities || []).map((activity, idx) => (
                  <div key={idx} className="ciq-timeline-item">
                    <div className="ciq-timeline-icon">
                      <MdTrendingUp size={18} />
                    </div>
                    <div className="ciq-timeline-body">
                      <div className="ciq-timeline-summary" style={{ marginTop: 0 }}>
                        {activity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </MainLayout>
  );
}
