/**
 * CampusIQ X - Resume Review Page
 * -----------------------------------------
 * ResumeAgent output: upload a resume PDF (parsed via Azure Document
 * Intelligence), then view ATS score, extracted/missing skills, job
 * match percentage, and AI recommendations.
 */

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { MdUploadFile, MdCheckCircle, MdCancel, MdDescription } from "react-icons/md";
import MainLayout from "../layouts/MainLayout";
import ConfidenceRing from "../components/ConfidenceRing";
import { useToast } from "../components/Common";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";

export default function ResumeReview() {
  const { selectedStudentId } = useAppContext();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast("Please upload a PDF file.", "error");
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setResult(null);

    try {
      const response = await api.uploadResume(selectedStudentId, file);
      setResult(response);
      showToast("Resume analyzed successfully!", "success");
    } catch (err) {
      showToast(`Resume analysis failed: ${err.message}`, "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <MainLayout title="Resume Review" subtitle="ResumeAgent · ATS Score, Skill Gaps & Job Match (Azure Document Intelligence)">
      <div className="ciq-page-header">
        <div>
          <h1 className="ciq-page-title">Resume Analyzer</h1>
          <p className="ciq-page-subtitle">
            Upload your resume PDF for an instant ATS-style score, skill extraction, and personalized improvement tips.
          </p>
        </div>
      </div>

      <motion.div
        className="ciq-glass-card ciq-card-pad"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          textAlign: "center",
          padding: "48px 24px",
          border: "2px dashed var(--ciq-border)",
          cursor: "pointer",
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={handleFileChange} />
        <MdUploadFile size={42} style={{ color: "var(--ciq-accent-blue)" }} />
        <div style={{ marginTop: 10, fontWeight: 700 }}>
          {uploading ? "Analyzing resume…" : fileName ? fileName : "Click to upload your resume (PDF)"}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ciq-text-secondary)", marginTop: 4 }}>
          Parsed via Azure AI Document Intelligence
        </div>
      </motion.div>

      {result && (
        <div className="ciq-grid ciq-grid-3 ciq-mt-24">
          <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center" }}>
            <h3 style={{ marginTop: 0 }}>ATS Resume Score</h3>
            <ConfidenceRing value={result.data.resume_score} size={96} strokeWidth={8} color="#2563eb" />
          </motion.div>

          <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ textAlign: "center" }}>
            <h3 style={{ marginTop: 0 }}>Job Match</h3>
            <ConfidenceRing value={result.data.job_match_percent} size={96} strokeWidth={8} color="#7c3aed" />
          </motion.div>

          <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ textAlign: "center" }}>
            <h3 style={{ marginTop: 0 }}>AI Confidence</h3>
            <ConfidenceRing value={result.confidence_score} size={96} strokeWidth={8} color="#16a34a" />
          </motion.div>

          <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h3 style={{ marginTop: 0 }}>
              <MdCheckCircle style={{ verticalAlign: "middle", marginRight: 6, color: "var(--ciq-success)" }} />
              Skills Extracted
            </h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {result.data.skills_extracted.map((skill) => (
                <span key={skill} style={{
                  padding: "4px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                  background: "rgba(22,163,74,0.1)", color: "var(--ciq-success)",
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 style={{ marginTop: 0 }}>
              <MdCancel style={{ verticalAlign: "middle", marginRight: 6, color: "var(--ciq-danger)" }} />
              Missing Skills
            </h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {result.data.missing_skills.map((skill) => (
                <span key={skill} style={{
                  padding: "4px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                  background: "rgba(220,38,38,0.1)", color: "var(--ciq-danger)",
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div className="ciq-glass-card ciq-card-pad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ gridColumn: "span 3" }}>
            <h3 style={{ marginTop: 0 }}>
              <MdDescription style={{ verticalAlign: "middle", marginRight: 6 }} />
              AI Recommendations
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.data.recommendations.map((rec, idx) => (
                <div key={idx} className="ciq-timeline-item" style={{ marginBottom: 0 }}>
                  <div className="ciq-timeline-icon">{idx + 1}</div>
                  <div className="ciq-timeline-body">
                    <div className="ciq-timeline-summary" style={{ marginTop: 0, color: "var(--ciq-text-primary)" }}>{rec}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
}
