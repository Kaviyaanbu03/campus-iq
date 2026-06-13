/**
 * CampusIQ X - Student Analysis Page
 * -------------------------------------------
 * Shows the selected student's profile, AnalysisAgent results
 * (academic score, risk level, weak subjects, recommendations),
 * and marks breakdown charts.
 */

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { MdSchool, MdEventAvailable, MdWarningAmber, MdCheckCircle } from "react-icons/md";
import MainLayout from "../layouts/MainLayout";
import ConfidenceRing from "../components/ConfidenceRing";
import { CardSkeleton, StatusBadge } from "../components/Common";
import { useFetch } from "../hooks/useFetch";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";

export default function StudentAnalysis() {
  const { selectedStudentId } = useAppContext();

  const { data: student, loading: studentLoading } = useFetch(
    () => api.getStudent(selectedStudentId),
    [selectedStudentId]
  );

  const { data: analysis, loading: analysisLoading } = useFetch(
    () => api.sendChatMessage(selectedStudentId, "Analyze my attendance, marks, CGPA and risk level."),
    [selectedStudentId]
  );

  const analysisData = useMemo(() => {
    if (!analysis) return null;
    return analysis.reasoning_timeline.find((step) => step.agent_name === "AnalysisAgent");
  }, [analysis]);

  const marksChartData = useMemo(() => {
    if (!student) return [];
    return student.subjects.map((subject) => ({
      subject: subject.length > 14 ? subject.slice(0, 12) + "…" : subject,
      Internal: student.internal_marks[subject],
      External: student.external_marks[subject],
    }));
  }, [student]);

  const loading = studentLoading || analysisLoading;

  return (
    <MainLayout title="Student Analysis" subtitle="AnalysisAgent · Attendance, Marks, CGPA & Risk Prediction">
      {loading ? (
        <div className="ciq-grid ciq-grid-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} rows={3} />
          ))}
        </div>
      ) : (
        <>
          <div className="ciq-page-header">
            <div>
              <h1 className="ciq-page-title">{student?.name}</h1>
              <p className="ciq-page-subtitle">
                {student?.student_id} · {student?.department} · Semester {student?.semester}
              </p>
            </div>
            {analysisData && <StatusBadge level={analysisData.data?.risk_level} />}
          </div>

          <div className="ciq-grid ciq-grid-3">
            <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="ciq-flex-between">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ciq-text-secondary)" }}>
                    Academic Score
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
                    {analysisData?.data?.academic_score ?? "-"}
                    <span style={{ fontSize: 14, color: "var(--ciq-text-secondary)" }}> / 100</span>
                  </div>
                </div>
                <ConfidenceRing value={analysisData?.data?.academic_score ?? 0} color="#2563eb" />
              </div>
            </motion.div>

            <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ciq-text-secondary)" }}>
                <MdEventAvailable style={{ verticalAlign: "middle", marginRight: 6 }} />
                Attendance
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
                {student?.attendance_percent}%
              </div>
              <div style={{ fontSize: 12, color: "var(--ciq-text-secondary)", marginTop: 4 }}>
                {student?.attendance_percent >= 75 ? "Meets eligibility requirements" : "Below 75% threshold"}
              </div>
            </motion.div>

            <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ciq-text-secondary)" }}>
                <MdSchool style={{ verticalAlign: "middle", marginRight: 6 }} />
                CGPA
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
                {student?.cgpa} <span style={{ fontSize: 14, color: "var(--ciq-text-secondary)" }}>/ 10</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--ciq-text-secondary)", marginTop: 4 }}>
                AI Confidence: {analysisData?.confidence_score ?? "-"}%
              </div>
            </motion.div>
          </div>

          <div className="ciq-grid ciq-grid-2 ciq-mt-24">
            <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 style={{ marginTop: 0 }}>Marks Analysis (Internal vs External)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={marksChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ciq-border)" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Internal" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="External" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <h3 style={{ marginTop: 0 }}>
                <MdWarningAmber style={{ verticalAlign: "middle", marginRight: 6, color: "var(--ciq-warning)" }} />
                Weak Subjects & AI Recommendations
              </h3>

              {analysisData?.data?.weak_subjects?.length > 0 ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  {analysisData.data.weak_subjects.map((subject) => (
                    <span
                      key={subject}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 999,
                        fontSize: 12.5,
                        fontWeight: 600,
                        background: "rgba(220,38,38,0.1)",
                        color: "var(--ciq-danger)",
                      }}
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ marginBottom: 14, color: "var(--ciq-success)", fontSize: 13.5 }}>
                  <MdCheckCircle style={{ verticalAlign: "middle", marginRight: 6 }} />
                  No weak subjects detected
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(analysisData?.data?.recommendations || []).map((rec, idx) => (
                  <div key={idx} className="ciq-timeline-item" style={{ marginBottom: 0 }}>
                    <div className="ciq-timeline-icon">{idx + 1}</div>
                    <div className="ciq-timeline-body">
                      <div className="ciq-timeline-summary" style={{ marginTop: 0, color: "var(--ciq-text-primary)" }}>
                        {rec}
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
