// src/features/userManagement/pages/SubOrgAdminsListPage.jsx
import React from "react";
import UserListScreen from "../components/UserListScreen";

const SubOrgAdminsListPage = () => {
  return (
    <UserListScreen
      title="Sub-Organization Admins"
      addLabel="Add Sub-Org Admin"
      role="subOrgAdmin"
    />
  );
};

export default SubOrgAdminsListPage;
