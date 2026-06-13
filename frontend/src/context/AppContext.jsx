/**
 * CampusIQ X - Global App Context
 * --------------------------------------
 * Provides:
 *  - The currently selected student (used across Student Analysis,
 *    AI Chat, Study Planner, Resume Review, Career Roadmap,
 *    Placement Readiness, and Interview Coach pages).
 *  - Light / Dark theme mode toggle.
 */

import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(
    () => localStorage.getItem("ciq_selected_student") || "CIQ0001"
  );
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem("ciq_theme") || "light"
  );

  useEffect(() => {
    api
      .getStudents()
      .then((data) => setStudents(data))
      .catch(() => setStudents([]));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    localStorage.setItem("ciq_theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem("ciq_selected_student", selectedStudentId);
  }, [selectedStudentId]);

  const toggleTheme = () =>
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));

  const value = {
    students,
    selectedStudentId,
    setSelectedStudentId,
    themeMode,
    toggleTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return ctx;
}
