/**
 * CampusIQ X - Career Roadmap Page
 * -------------------------------------------
 * CareerAgent output: career path recommendations, skill gap
 * analysis, certification suggestions, and salary prediction.
 */

import { motion } from "framer-motion";
import { MdTrendingUp, MdSchool, MdWorkspacePremium, MdAttachMoney } from "react-icons/md";
import MainLayout from "../layouts/MainLayout";
import { CardSkeleton } from "../components/Common";
import { useFetch } from "../hooks/useFetch";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";

export default function CareerRoadmap() {
  const { selectedStudentId } = useAppContext();
  const { data, loading, error } = useFetch(() => api.predictPlacement(selectedStudentId), [selectedStudentId]);

  const careerPath = data?.data?.career_path || [];

  return (
    <MainLayout title="Career Roadmap" subtitle="CareerAgent · Skill Gap Analysis & Career Path Recommendations">
      <div className="ciq-page-header">
        <div>
          <h1 className="ciq-page-title">Your Career Roadmap</h1>
          <p className="ciq-page-subtitle">
            AI-recommended career paths based on your current skills, certifications, and academic profile.
          </p>
        </div>
        {data && <span className="ciq-gradient-pill"><MdTrendingUp /> Confidence {data.confidence_score}%</span>}
      </div>

      {error && (
        <div className="ciq-glass-card ciq-card-pad" style={{ color: "var(--ciq-danger)" }}>
          Failed to generate career roadmap: {error.message}
        </div>
      )}

      {loading ? (
        <div className="ciq-grid ciq-grid-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} rows={2} />)}
        </div>
      ) : (
        <>
          {/* Roadmap timeline */}
          <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ marginTop: 0 }}>
              <MdTrendingUp style={{ verticalAlign: "middle", marginRight: 6 }} />
              Recommended Career Paths
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12 }}>
              {careerPath.map((role, idx) => (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08 }}
                  style={{
                    flex: "1 1 220px",
                    padding: "16px 18px",
                    borderRadius: "var(--ciq-radius-md)",
                    background: idx === 0 ? "var(--ciq-gradient-primary)" : "var(--ciq-surface-solid)",
                    color: idx === 0 ? "#fff" : "var(--ciq-text-primary)",
                    border: idx === 0 ? "none" : "1px solid var(--ciq-border)",
                    position: "relative",
                  }}
                >
                  {idx === 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, textTransform: "uppercase" }}>
                      Best Fit
                    </span>
                  )}
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: idx === 0 ? 4 : 0 }}>{role}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="ciq-grid ciq-grid-3 ciq-mt-24">
            <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <h3 style={{ marginTop: 0 }}>
                <MdAttachMoney style={{ verticalAlign: "middle", marginRight: 6, color: "var(--ciq-success)" }} />
                Salary Prediction
              </h3>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{data?.data?.salary_prediction}</div>
              <div style={{ fontSize: 12.5, color: "var(--ciq-text-secondary)", marginTop: 4 }}>
                Estimated annual package range (India)
              </div>
            </motion.div>

            <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 style={{ marginTop: 0 }}>
                <MdSchool style={{ verticalAlign: "middle", marginRight: 6, color: "var(--ciq-danger)" }} />
                Skill Gaps
              </h3>
              {data?.data?.skill_gaps?.length > 0 ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {data.data.skill_gaps.map((skill) => (
                    <span key={skill} style={{
                      padding: "4px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                      background: "rgba(220,38,38,0.1)", color: "var(--ciq-danger)",
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ color: "var(--ciq-success)", fontSize: 13.5 }}>No major skill gaps for your top role.</div>
              )}
            </motion.div>

            <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <h3 style={{ marginTop: 0 }}>
                <MdWorkspacePremium style={{ verticalAlign: "middle", marginRight: 6, color: "var(--ciq-accent-purple)" }} />
                Recommended Certifications
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(data?.data?.recommended_certifications || []).map((cert) => (
                  <div key={cert} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ciq-accent-purple)" }} />
                    {cert}
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
