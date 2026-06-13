/**
 * CampusIQ X - Fluent UI Theme
 * ---------------------------------
 * Custom light & dark themes layered on Fluent UI v9's webLightTheme /
 * webDarkTheme, tuned to the CampusIQ X Blue + White + Purple
 * gradient enterprise visual identity.
 */

import { webLightTheme, webDarkTheme } from "@fluentui/react-components";

export const campusIQLightTheme = {
  ...webLightTheme,
  colorBrandBackground: "#2563eb",
  colorBrandBackgroundHover: "#1d4ed8",
  colorBrandBackgroundPressed: "#1e40af",
  colorBrandForeground1: "#2563eb",
  colorBrandForeground2: "#7c3aed",
  colorNeutralBackground1: "#ffffff",
  colorNeutralBackground2: "#f3f6fc",
  borderRadiusMedium: "10px",
  borderRadiusLarge: "16px",
};

export const campusIQDarkTheme = {
  ...webDarkTheme,
  colorBrandBackground: "#3b82f6",
  colorBrandBackgroundHover: "#60a5fa",
  colorBrandBackgroundPressed: "#2563eb",
  colorBrandForeground1: "#60a5fa",
  colorBrandForeground2: "#a78bfa",
  colorNeutralBackground1: "#161c2e",
  colorNeutralBackground2: "#0b1120",
  borderRadiusMedium: "10px",
  borderRadiusLarge: "16px",
};

export const AGENT_COLORS = {
  CampusCopilotAgent: "#2563eb",
  AnalysisAgent: "#0ea5e9",
  StudyPlanAgent: "#7c3aed",
  CareerAgent: "#16a34a",
  ResumeAgent: "#d97706",
  InterviewPrepAgent: "#db2777",
  VerifierAgent: "#0f766e",
};

export const RISK_COLORS = {
  Low: "#16a34a",
  Medium: "#d97706",
  High: "#dc2626",
};
