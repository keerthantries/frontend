import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminLoginPage from "./features/auth/pages/AdminLoginPage.jsx";
import AdminDashboardPage from "./features/dashboard/pages/AdminDashboardPage.jsx";

import SubOrgListPage from "./features/subOrgManagement/pages/SubOrgListPage.jsx";
import SubOrgUpsertPage from "./features/subOrgManagement/pages/SubOrgUpsertPage.jsx";
import SubOrgWithAdminPage from "./features/subOrgManagement/pages/SubOrgWithAdminPage.jsx";

import UserTransferPage from "./features/userManagement/pages/UserTransferPage.jsx";


import UsersListPage from "./features/userManagement/pages/UsersListPage.jsx";
import EducatorsListPage from "./features/userManagement/pages/EducatorListPage.jsx";
import LearnersListPage from "./features/userManagement/pages/LearnerListPage.jsx";
import SubOrgAdminsListPage from "./features/userManagement/pages/SubOrgAdminsListPage.jsx";

import CoursesList from "./features/Courses/CoursesList.jsx";
import AddCoursePage from "./features/Courses/AddCoursePage.jsx";
import CourseCurriculumPage from "./features/Courses/CourseCurriculumPage.jsx";
import CoursePreviewPage from "./features/Courses/CoursePreviewPage.jsx";
import CourseCategoriesPage from "./features/Courses/CourseCategoriesPage.jsx";

import UserDetailsPage from "./features/userManagement/pages/UserDetailsPage.jsx";
import UserUpsertPage from "./features/userManagement/pages/UserUpsertPage.jsx";
import EducatorVerificationPage from "./features/userManagement/pages/EducatorVerificationPage.jsx";

import BatchesListPage from "./features/batches/pages/BatchesListPage.jsx";
import AddBatchPage from "./features/batches/pages/AddBatchPage.jsx";
import BatchDetailPage from "./features/batches/pages/BatchDetailsPage.jsx";
import BatchEnrollmentsPage from "./features/enrollments/pages/BatchEnrollmentsPage.jsx";

import BatchAttendancePage from "./features/attendance/pages/BatchAttendancePage.jsx";
import SessionAttendancePage from "./features/attendance/pages/SessionAttendancePage.jsx";

import EnrollmentsListPage from "./features/enrollments/pages/EnrollmentsListPage.jsx";
import EnrollLearnerPage from "./features/enrollments/pages/EnrollLearnerPage.jsx";

import ProtectedRoute from "./features/auth/components/ProtectedRoute.jsx";

function App() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login/admin" replace />} />

      {/* Login */}
      <Route path="/login/admin" element={<AdminLoginPage />} />

      {/* Protected Admin Area */}
      <Route
        element={<ProtectedRoute allowedRoles={["admin", "subOrgAdmin"]} />}
      >
        <Route path="/admin" element={<AdminLayout />}>
          {/* /admin -> /admin/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<AdminDashboardPage />} />

          {/* Courses */}
          <Route path="courses" element={<CoursesList />} />
          <Route path="courses/add" element={<AddCoursePage />} />
          <Route path="courses/:courseId/curriculum" element={<CourseCurriculumPage />} />
          <Route path="courses/:courseId/preview" element={<CoursePreviewPage />} />
          <Route path="categories" element={<CourseCategoriesPage />} />

          {/* User Management */}
          <Route path="users" element={<UsersListPage />} />
          <Route path="users/new" element={<UserUpsertPage />} />
          <Route path="users/:id" element={<UserDetailsPage />} />
          <Route path="users/:id/edit" element={<UserUpsertPage />} />
          <Route path="users/:userId/transfer" element={<UserTransferPage />} />

          {/* Educators & Learners */}
          <Route path="educators" element={<EducatorsListPage />} />
          <Route path="educators/:id/verify" element={<EducatorVerificationPage />} />
          <Route path="learners" element={<LearnersListPage />} />

          {/* 🌟 NEW: Sub-Org Admins list */}
          <Route path="suborg-admins" element={<SubOrgAdminsListPage />} />

          {/* Sub Orgs */}
          <Route path="suborgs" element={<SubOrgListPage />} />
          <Route path="suborgs/create" element={<SubOrgUpsertPage />} />
          <Route path="suborgs/create-with-admin" element={<SubOrgWithAdminPage />} />
          <Route path="suborgs/:subOrgId" element={<SubOrgUpsertPage />} />
          <Route path="suborgs/:subOrgId/edit" element={<SubOrgUpsertPage />} />

          {/* Batches Module */}
          <Route path="batches" element={<BatchesListPage />} />
          <Route path="batches/add" element={<AddBatchPage />} />
          <Route path="batches/:id" element={<BatchDetailPage />} />
          <Route path="batches/:batchId/enrollments" element={<BatchEnrollmentsPage />}/>
          <Route path="/admin/batches/:id/edit" element={<AddBatchPage />} />
          <Route path="batches/:batchId/attendance" element={<BatchAttendancePage />} />
          <Route path="attendance/sessions/:sessionId" element={<SessionAttendancePage />} />

          <Route path="enrolments" element={<EnrollmentsListPage />} />
          <Route path="enrolments/new" element={<EnrollLearnerPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<div>404 - Page not found</div>} />
    </Routes>
  );
}

export default App;
