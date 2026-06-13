/**
 * CampusIQ X - App Root
 * -----------------------------
 * Sets up Fluent UI theming, global app context (selected student,
 * theme mode), toast notifications, and React Router routes for all
 * 10 pages.
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FluentProvider } from "@fluentui/react-components";
import { AppProvider, useAppContext } from "./context/AppContext";
import { ToastProvider } from "./components/Common";
import { campusIQLightTheme, campusIQDarkTheme } from "./theme/fluentTheme";

import Dashboard from "./pages/Dashboard";
import StudentAnalysis from "./pages/StudentAnalysis";
import AIChat from "./pages/AIChat";
import StudyPlanner from "./pages/StudyPlanner";
import ResumeReview from "./pages/ResumeReview";
import CareerRoadmap from "./pages/CareerRoadmap";
import PlacementReadiness from "./pages/PlacementReadiness";
import InterviewCoach from "./pages/InterviewCoach";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

function ThemedApp() {
  const { themeMode } = useAppContext();
  const fluentTheme = themeMode === "dark" ? campusIQDarkTheme : campusIQLightTheme;

  return (
    <FluentProvider theme={fluentTheme}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/student-analysis" element={<StudentAnalysis />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/study-planner" element={<StudyPlanner />} />
            <Route path="/resume-review" element={<ResumeReview />} />
            <Route path="/career-roadmap" element={<CareerRoadmap />} />
            <Route path="/placement-readiness" element={<PlacementReadiness />} />
            <Route path="/interview-coach" element={<InterviewCoach />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </FluentProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ThemedApp />
    </AppProvider>
  );
}
