/**
 * CampusIQ X - Analytics Page
 * -----------------------------------
 * Platform-wide analytics: attendance & CGPA trends across students,
 * risk distribution, placement probability distribution, and skill
 * distribution across the cohort.
 */

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import { CardSkeleton } from "../components/Common";
import { useFetch } from "../hooks/useFetch";
import { RISK_COLORS } from "../theme/fluentTheme";
import api from "../services/api";

export default function Analytics() {
  const { data, loading, error } = useFetch(() => api.getAnalytics(), []);

  const riskData = data
    ? Object.entries(data.risk_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const skillData = data
    ? Object.entries(data.skill_distribution).map(([skill, count]) => ({ skill, count }))
    : [];

  return (
    <MainLayout title="Analytics" subtitle="Platform-wide academic, risk, placement, and skill analytics">
      <div className="ciq-page-header">
        <div>
          <h1 className="ciq-page-title">Analytics</h1>
          <p className="ciq-page-subtitle">
            Cohort-wide trends derived from the AnalysisAgent, CareerAgent, and synthetic student dataset.
          </p>
        </div>
      </div>

      {error && (
        <div className="ciq-glass-card ciq-card-pad" style={{ color: "var(--ciq-danger)" }}>
          Failed to load analytics: {error.message}
        </div>
      )}

      {loading ? (
        <div className="ciq-grid ciq-grid-2">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} rows={5} />)}
        </div>
      ) : (
        <div className="ciq-grid ciq-grid-2">
          <ChartCard title="Attendance Trend" delay={0}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.attendance_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ciq-border)" />
                <XAxis dataKey="student_index" tick={{ fontSize: 11 }} label={{ value: "Student #", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="attendance" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="CGPA Trend" delay={0.05}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.cgpa_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ciq-border)" />
                <XAxis dataKey="student_index" tick={{ fontSize: 11 }} label={{ value: "Student #", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="cgpa" stroke="#7c3aed" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Risk Distribution" delay={0.1}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {riskData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] || "#64748b"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Placement Probability Distribution" delay={0.15}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.placement_probability_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ciq-border)" />
                <XAxis dataKey="student_index" tick={{ fontSize: 11 }} label={{ value: "Student #", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="placement_score" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top Skills Across Cohort" delay={0.2} span={2}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={skillData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ciq-border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="skill" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </MainLayout>
  );
}

function ChartCard({ title, delay, span, children }) {
  return (
    <motion.div
      className="ciq-glass-card ciq-card-pad"
      style={span ? { gridColumn: `span ${span}` } : undefined}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </motion.div>
  );
}
