import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();

  const token = localStorage.getItem("vp_token");
  const userJson = localStorage.getItem("vp_user");

  let user = null;
  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    user = null;
  }

  // 1) No token or no user → kick to login
  if (!token || !user) {
    return (
      <Navigate
        to="/login/admin"
        replace
        state={{ from: location }} // so we can come back after login
      />
    );
  }

  // 2) Role check (if you pass allowedRoles)
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // You can send them to a "403" page instead if you want
      return <Navigate to="/login/admin" replace />;
    }
  }

  // 3) All good → render nested routes
  return <Outlet />;
}

export default ProtectedRoute;
