/**
 * CampusIQ X - AI Chat Page
 * ---------------------------------
 * The centerpiece of CampusIQ X: students chat with CampusCopilotAgent,
 * which orchestrates sub-agents. Displays the reasoning timeline
 * (agent execution animation), per-agent confidence scores, and the
 * final synthesized AI response.
 */

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdSend,
  MdAutoAwesome,
  MdCheckCircle,
  MdPerson,
} from "react-icons/md";
import { RiBrainLine } from "react-icons/ri";
import MainLayout from "../layouts/MainLayout";
import { useAppContext } from "../context/AppContext";
import { useToast } from "../components/Common";
import { AGENT_COLORS } from "../theme/fluentTheme";
import api from "../services/api";

const SUGGESTED_PROMPTS = [
  "How am I doing overall this semester?",
  "Am I at risk of failing any subjects?",
  "Create a study plan for my upcoming exams.",
  "What career path suits my current skills?",
  "Review my placement readiness.",
  "Give me technical interview questions.",
];

export default function AIChat() {
  const { selectedStudentId } = useAppContext();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const handleSend = async (text) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.sendChatMessage(selectedStudentId, query);
      setMessages((prev) => [...prev, { role: "assistant", response }]);
    } catch (err) {
      showToast(`AI Chat failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <MainLayout title="AI Chat" subtitle="CampusCopilotAgent · Multi-Agent Reasoning Orchestration">
      <div className="ciq-page-header">
        <div>
          <h1 className="ciq-page-title">Ask CampusCopilot</h1>
          <p className="ciq-page-subtitle">
            Your query is routed through specialized AI agents, each contributing
            reasoning to a verified, unified response.
          </p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="ciq-grid ciq-grid-3 ciq-mt-16">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <motion.button
              key={prompt}
              onClick={() => handleSend(prompt)}
              whileHover={{ y: -3 }}
              className="ciq-glass-card ciq-card-pad"
              style={{
                textAlign: "left",
                border: "none",
                cursor: "pointer",
                fontSize: 13.5,
                fontFamily: "inherit",
                color: "var(--ciq-text-primary)",
              }}
            >
              <MdAutoAwesome style={{ color: "var(--ciq-accent-purple)", marginBottom: 8 }} size={18} />
              <div>{prompt}</div>
            </motion.button>
          ))}
        </div>
      )}

      <div
        ref={scrollRef}
        className="ciq-scrollbar"
        style={{
          marginTop: 20,
          maxHeight: "55vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          paddingRight: 4,
        }}
      >
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {msg.role === "user" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div
                    className="ciq-glass-card ciq-card-pad"
                    style={{
                      background: "var(--ciq-gradient-primary)",
                      color: "#fff",
                      maxWidth: "75%",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 12, opacity: 0.85 }}>
                      <MdPerson /> You
                    </div>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <ReasoningResponse response={msg.response} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ciq-glass-card ciq-card-pad">
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
              <RiBrainLine className="ciq-spin" size={20} style={{ color: "var(--ciq-accent-purple)" }} />
              CampusCopilotAgent is orchestrating agents and reasoning over your query…
            </div>
          </motion.div>
        )}
      </div>

      {/* Input bar */}
      <div className="ciq-glass-card ciq-card-pad ciq-mt-24" style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about your attendance, study plan, career, resume, or interview prep…"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
            color: "var(--ciq-text-primary)",
          }}
        />
        <motion.button
          onClick={() => handleSend()}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          style={{
            border: "none",
            borderRadius: "var(--ciq-radius-sm)",
            background: "var(--ciq-gradient-primary)",
            color: "#fff",
            padding: "8px 18px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 13.5,
            opacity: loading ? 0.7 : 1,
          }}
        >
          <MdSend size={16} /> Send
        </motion.button>
      </div>
    </MainLayout>
  );
}

// ---------------------------------------------------------------------------
// Reasoning timeline + final response renderer
// ---------------------------------------------------------------------------

function ReasoningResponse({ response }) {
  if (!response) return null;

  return (
    <div className="ciq-glass-card ciq-card-pad">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 13, fontWeight: 700 }}>
        <RiBrainLine size={18} style={{ color: "var(--ciq-accent-blue)" }} />
        Reasoning Timeline
        <span className="ciq-gradient-pill" style={{ marginLeft: "auto" }}>
          Overall Confidence {response.overall_confidence}%
        </span>
      </div>

      <div>
        {response.reasoning_timeline.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="ciq-timeline-item"
          >
            <div
              className="ciq-timeline-icon"
              style={{
                color: AGENT_COLORS[step.agent_name] || "var(--ciq-accent-blue)",
                background: `${AGENT_COLORS[step.agent_name] || "#2563eb"}1A`,
              }}
            >
              <MdCheckCircle size={18} />
            </div>
            <div className="ciq-timeline-body">
              <div className="ciq-timeline-name">{step.agent_name}</div>
              <div className="ciq-timeline-summary">{step.summary}</div>
            </div>
            <div className="ciq-timeline-confidence">{step.confidence_score}%</div>
          </motion.div>
        ))}
      </div>

      <div
        className="ciq-mt-16"
        style={{
          padding: "14px 16px",
          borderRadius: "var(--ciq-radius-sm)",
          background: "var(--ciq-gradient-soft)",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        <strong>CampusIQ X says:</strong> {response.final_response}
      </div>
    </div>
  );
}
