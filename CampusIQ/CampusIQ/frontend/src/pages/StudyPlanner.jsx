/**
 * CampusIQ X - Study Planner Page
 * -----------------------------------------
 * StudyPlanAgent output: weekly planner grid, today's daily tasks,
 * and a progress tracker with toggleable completion state.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { MdCheckBox, MdCheckBoxOutlineBlank, MdAutoAwesome } from "react-icons/md";
import MainLayout from "../layouts/MainLayout";
import { CardSkeleton } from "../components/Common";
import { useFetch } from "../hooks/useFetch";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function StudyPlanner() {
  const { selectedStudentId } = useAppContext();
  const { data, loading, error } = useFetch(() => api.generateStudyPlan(selectedStudentId), [selectedStudentId]);
  const [completedTasks, setCompletedTasks] = useState({});

  const toggleTask = (key) => {
    setCompletedTasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const weeklyPlan = data?.data?.weekly_plan || {};
  const dailyTasks = data?.data?.daily_tasks || [];

  return (
    <MainLayout title="Study Planner" subtitle="StudyPlanAgent · Personalized Weekly Plan & Revision Schedule">
      <div className="ciq-page-header">
        <div>
          <h1 className="ciq-page-title">Your Personalized Study Plan</h1>
          <p className="ciq-page-subtitle">
            AI-generated weekly schedule, prioritizing weak subjects with extra revision sessions.
          </p>
        </div>
        {data && <span className="ciq-gradient-pill"><MdAutoAwesome /> Confidence {data.confidence_score}%</span>}
      </div>

      {error && (
        <div className="ciq-glass-card ciq-card-pad" style={{ color: "var(--ciq-danger)" }}>
          Failed to generate study plan: {error.message}
        </div>
      )}

      {loading ? (
        <div className="ciq-grid ciq-grid-4">
          {Array.from({ length: 7 }).map((_, i) => <CardSkeleton key={i} rows={3} />)}
        </div>
      ) : (
        <>
          {/* Today's tasks */}
          <motion.div
            className="ciq-glass-card ciq-card-pad"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 style={{ marginTop: 0 }}>Today's Tasks</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dailyTasks.map((task, idx) => {
                const key = `today-${idx}`;
                const done = completedTasks[key];
                return (
                  <div
                    key={key}
                    onClick={() => toggleTask(key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: "var(--ciq-radius-sm)",
                      border: "1px solid var(--ciq-border)",
                      cursor: "pointer",
                      textDecoration: done ? "line-through" : "none",
                      color: done ? "var(--ciq-text-secondary)" : "var(--ciq-text-primary)",
                      fontSize: 13.5,
                    }}
                  >
                    {done ? <MdCheckBox color="var(--ciq-success)" /> : <MdCheckBoxOutlineBlank />}
                    {task}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Weekly planner grid */}
          <div className="ciq-grid ciq-grid-4 ciq-mt-24">
            {DAYS.map((day, i) => (
              <motion.div
                key={day}
                className="ciq-glass-card ciq-card-pad"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="ciq-flex-between" style={{ marginBottom: 10 }}>
                  <strong style={{ fontSize: 14 }}>{day}</strong>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "var(--ciq-gradient-soft)",
                      color: "var(--ciq-accent-blue)",
                    }}
                  >
                    {(weeklyPlan[day] || []).length} tasks
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(weeklyPlan[day] || []).map((task, idx) => {
                    const key = `${day}-${idx}`;
                    const done = completedTasks[key];
                    return (
                      <div
                        key={key}
                        onClick={() => toggleTask(key)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          fontSize: 12.5,
                          cursor: "pointer",
                          textDecoration: done ? "line-through" : "none",
                          color: done ? "var(--ciq-text-secondary)" : "var(--ciq-text-primary)",
                        }}
                      >
                        {done ? (
                          <MdCheckBox color="var(--ciq-success)" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                        ) : (
                          <MdCheckBoxOutlineBlank size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                        )}
                        {task}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </MainLayout>
  );
}
