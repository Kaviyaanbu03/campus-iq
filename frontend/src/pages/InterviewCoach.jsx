/**
 * CampusIQ X - Interview Coach Page
 * -----------------------------------------
 * InterviewPrepAgent output: interview readiness score, technical &
 * HR question banks (role/difficulty selectable), and improvement
 * areas with STAR method guidance.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { MdRecordVoiceOver, MdCode, MdGroups, MdLightbulb, MdRefresh } from "react-icons/md";
import MainLayout from "../layouts/MainLayout";
import ConfidenceRing from "../components/ConfidenceRing";
import { CardSkeleton, useToast } from "../components/Common";
import { useFetch } from "../hooks/useFetch";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";

const ROLES = ["Software Engineer", "Data Scientist", "Cloud Engineer", "Full Stack Developer"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export default function InterviewCoach() {
  const { selectedStudentId } = useAppContext();
  const { showToast } = useToast();
  const [role, setRole] = useState(ROLES[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: initialData, loading: initialLoading } = useFetch(
    () => api.getInterviewQuestions(selectedStudentId, role, difficulty),
    [selectedStudentId]
  );

  const active = result || initialData;
  const isLoading = loading || (initialLoading && !result);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await api.getInterviewQuestions(selectedStudentId, role, difficulty);
      setResult(response);
      showToast("New interview questions generated.", "success");
    } catch (err) {
      showToast(`Failed to generate questions: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Interview Coach" subtitle="InterviewPrepAgent · Mock Interview Questions & STAR Guidance">
      <div className="ciq-page-header">
        <div>
          <h1 className="ciq-page-title">Interview Coach</h1>
          <p className="ciq-page-subtitle">
            Practice with AI-generated technical and HR questions tailored to your profile.
          </p>
        </div>
      </div>

      <div className="ciq-glass-card ciq-card-pad ciq-flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Selector label="Target Role" value={role} options={ROLES} onChange={setRole} />
          <Selector label="Difficulty" value={difficulty} options={DIFFICULTIES} onChange={setDifficulty} />
        </div>
        <motion.button
          onClick={handleGenerate}
          whileTap={{ scale: 0.96 }}
          disabled={isLoading}
          style={{
            border: "none", borderRadius: "var(--ciq-radius-sm)", background: "var(--ciq-gradient-primary)",
            color: "#fff", padding: "10px 18px", display: "flex", alignItems: "center", gap: 6,
            cursor: isLoading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13.5, opacity: isLoading ? 0.7 : 1,
          }}
        >
          <MdRefresh size={16} /> Generate Questions
        </motion.button>
      </div>

      {isLoading ? (
        <div className="ciq-grid ciq-grid-3 ciq-mt-24">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} rows={4} />)}
        </div>
      ) : (
        <div className="ciq-grid ciq-grid-3 ciq-mt-24">
          <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center" }}>
            <h3 style={{ marginTop: 0 }}>
              <MdRecordVoiceOver style={{ verticalAlign: "middle", marginRight: 6 }} />
              Interview Readiness
            </h3>
            <ConfidenceRing value={active?.data?.interview_score ?? 0} size={110} strokeWidth={9} color="#db2777" />
            <div className="ciq-text-secondary" style={{ fontSize: 12.5, marginTop: 10 }}>
              AI Confidence: {active?.confidence_score}%
            </div>
          </motion.div>

          <motion.div className="ciq-glass-card ciq-card-pad" style={{ gridColumn: "span 2" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h3 style={{ marginTop: 0 }}>
              <MdLightbulb style={{ verticalAlign: "middle", marginRight: 6, color: "var(--ciq-warning)" }} />
              Improvement Areas
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(active?.data?.improvement_areas || []).map((area, idx) => (
                <div key={idx} className="ciq-timeline-item" style={{ marginBottom: 0 }}>
                  <div className="ciq-timeline-icon">{idx + 1}</div>
                  <div className="ciq-timeline-body">
                    <div className="ciq-timeline-summary" style={{ marginTop: 0, color: "var(--ciq-text-primary)" }}>{area}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="ciq-glass-card ciq-card-pad" style={{ gridColumn: "span 3" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="ciq-grid ciq-grid-2">
              <div>
                <h3 style={{ marginTop: 0 }}>
                  <MdCode style={{ verticalAlign: "middle", marginRight: 6, color: "var(--ciq-accent-blue)" }} />
                  Technical Questions
                </h3>
                <ol style={{ paddingLeft: 20, fontSize: 13.5, lineHeight: 1.9 }}>
                  {(active?.data?.technical_questions || []).map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 style={{ marginTop: 0 }}>
                  <MdGroups style={{ verticalAlign: "middle", marginRight: 6, color: "var(--ciq-accent-purple)" }} />
                  HR Questions
                </h3>
                <ol style={{ paddingLeft: 20, fontSize: 13.5, lineHeight: 1.9 }}>
                  {(active?.data?.hr_questions || []).map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
}

function Selector({ label, value, options, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--ciq-text-secondary)", marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "8px 12px", borderRadius: "var(--ciq-radius-sm)", border: "1px solid var(--ciq-border)",
          background: "var(--ciq-surface-solid)", color: "var(--ciq-text-primary)", fontSize: 13, fontWeight: 600,
        }}
      >
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}
