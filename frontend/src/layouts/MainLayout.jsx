/**
 * CampusIQ X - Main Layout
 * --------------------------------
 * Wraps every page with the sidebar, top navigation bar, and animated
 * page transitions (Framer Motion) for a polished enterprise feel.
 */

import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";

export default function MainLayout({ title, subtitle, children }) {
  return (
    <div className="ciq-app-shell">
      <Sidebar />
      <div className="ciq-main-area">
        <TopNav title={title} subtitle={subtitle} />
        <motion.main
          className="ciq-page-content"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
