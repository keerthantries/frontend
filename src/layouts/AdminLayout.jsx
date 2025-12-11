// src/layouts/AdminLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

function AdminLayout() {
  // This state is mainly for MOBILE sidebar open/close
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="nk-main">
      {/* Sidebar - template CSS handles desktop layout */}
      <Sidebar isOpen={isSidebarOpen} onToggleMenu={handleToggleSidebar} />

      {/* Mobile overlay (click to close sidebar) */}
      {isSidebarOpen && (
        <div
          className="nk-sidebar-overlay d-xl-none"
          onClick={handleToggleSidebar}
        />
      )}

      {/* Main content area */}
      <main className="nk-wrap">
        {/* Topbar */}
        <Header onToggleMenu={handleToggleSidebar} />

        {/* Nested route content */}
        <div className="nk-content">
          <div className="container-fluid">
            <div className="nk-content-inner">
              <div className="nk-content-body">
                <Outlet />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="nk-footer">
          <div className="container-fluid">
            <div className="nk-footer-wrap">
              <div className="nk-footer-copyright">
                © 2025 Vidhyapat. designed by{" "}
                <a
                  href="https://vsaastechnologies.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  VSAAS Technologies
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
