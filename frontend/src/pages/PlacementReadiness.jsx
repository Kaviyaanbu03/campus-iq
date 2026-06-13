/**
 * CampusIQ X - Placement Readiness Page
 * -------------------------------------------------
 * CareerAgent output focused on placement: overall placement score,
 * eligibility breakdown vs typical company benchmarks, and progress
 * indicators across CGPA, skills, certifications, and interview
 * readiness.
 */

import { motion } from "framer-motion";
import { MdWorkOutline, MdCheckCircle, MdCancel } from "react-icons/md";
import MainLayout from "../layouts/MainLayout";
import ConfidenceRing from "../components/ConfidenceRing";
import { CardSkeleton } from "../components/Common";
import { useFetch } from "../hooks/useFetch";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";

const ELIGIBILITY_BENCHMARKS = [
  { label: "Minimum CGPA (6.5+)", check: (s) => s.cgpa >= 6.5, detail: (s) => `Your CGPA: ${s.cgpa}` },
  { label: "Attendance (75%+)", check: (s) => s.attendance_percent >= 75, detail: (s) => `Your attendance: ${s.attendance_percent}%` },
  { label: "No active backlogs (weak subjects)", check: (s) => s.weak_subjects.length === 0, detail: (s) => `Weak subjects: ${s.weak_subjects.length}` },
  { label: "At least 1 certification", check: (s) => s.certifications.length >= 1, detail: (s) => `Certifications: ${s.certifications.length}` },
  { label: "Interview readiness (60%+)", check: (s) => s.interview_readiness >= 60, detail: (s) => `Your score: ${s.interview_readiness}%` },
];

export default function PlacementReadiness() {
  const { selectedStudentId } = useAppContext();

  const { data: student, loading: studentLoading } = useFetch(
    () => api.getStudent(selectedStudentId),
    [selectedStudentId]
  );
  const { data: career, loading: careerLoading } = useFetch(
    () => api.predictPlacement(selectedStudentId),
    [selectedStudentId]
  );

  const loading = studentLoading || careerLoading;

  return (
    <MainLayout title="Placement Readiness" subtitle="CareerAgent · Placement Score & Company Eligibility">
      <div className="ciq-page-header">
        <div>
          <h1 className="ciq-page-title">Placement Readiness</h1>
          <p className="ciq-page-subtitle">
            See how your profile stacks up against typical campus placement eligibility criteria.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="ciq-grid ciq-grid-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} rows={3} />)}
        </div>
      ) : (
        <div className="ciq-grid ciq-grid-3">
          <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center" }}>
            <h3 style={{ marginTop: 0 }}>
              <MdWorkOutline style={{ verticalAlign: "middle", marginRight: 6 }} />
              Placement Score
            </h3>
            <ConfidenceRing value={career?.data?.placement_score ?? 0} size={120} strokeWidth={10} color="#2563eb" />
            <div style={{ fontSize: 12.5, color: "var(--ciq-text-secondary)", marginTop: 10 }}>
              AI Confidence: {career?.confidence_score}%
            </div>
          </motion.div>

          <motion.div className="ciq-glass-card ciq-card-pad" style={{ gridColumn: "span 2" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h3 style={{ marginTop: 0 }}>Eligibility Checklist</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ELIGIBILITY_BENCHMARKS.map((item) => {
                const passed = student ? item.check(student) : false;
                return (
                  <div key={item.label} className="ciq-flex-between" style={{ fontSize: 13.5, padding: "8px 0", borderBottom: "1px solid var(--ciq-border)" }}>
                    <div>
                      <div>{item.label}</div>
                      <div style={{ fontSize: 12, color: "var(--ciq-text-secondary)" }}>{student && item.detail(student)}</div>
                    </div>
                    {passed ? (
                      <MdCheckCircle size={20} color="var(--ciq-success)" />
                    ) : (
                      <MdCancel size={20} color="var(--ciq-danger)" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div className="ciq-glass-card ciq-card-pad" style={{ gridColumn: "span 3" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 style={{ marginTop: 0 }}>Top Career Fit & Salary Outlook</h3>
            <div className="ciq-grid ciq-grid-3">
              <div>
                <div className="ciq-text-secondary" style={{ fontSize: 12.5 }}>Best-fit Role</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{career?.data?.career_path?.[0]}</div>
              </div>
              <div>
                <div className="ciq-text-secondary" style={{ fontSize: 12.5 }}>Predicted Salary Range</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{career?.data?.salary_prediction}</div>
              </div>
              <div>
                <div className="ciq-text-secondary" style={{ fontSize: 12.5 }}>Current Placement Status</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{student?.placement_status}</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
}
