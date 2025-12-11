import React from "react";
import UserListScreen from "../components/UserListScreen";

const LearnersListPage = () => {
  return (
    <UserListScreen
      title="Learners"
      addLabel="Add Learner"
      role="learner"
    />
  );
};

export default LearnersListPage;
