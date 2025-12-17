// src/features/userManagement/pages/EducatorListPage.jsx
import React from "react";
import UserListScreen from "../components/UserListScreen";

const EducatorListPage = () => {
  return (
    <UserListScreen
      title="Educators"
      addLabel="Add Educator"
      role="educator"
    />
  );
};

export default EducatorListPage;
