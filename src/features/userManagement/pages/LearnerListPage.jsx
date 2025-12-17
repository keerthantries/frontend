// src/features/userManagement/pages/LearnerListPage.jsx
import React from "react";
import UserListScreen from "../components/UserListScreen";

const LearnerListPage = () => {
  return (
    <UserListScreen
      title="Learners"
      addLabel="Add Learner"
      role="learner"
    />
  );
};

export default LearnerListPage;
