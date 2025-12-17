// src/features/userManagement/pages/UsersListPage.jsx
import React from "react";
import UserListScreen from "../components/UserListScreen";

const UsersListPage = () => {
  return (
    <UserListScreen
      title="All Users"
      addLabel="Add User"
      role={undefined} // all roles
    />
  );
};

export default UsersListPage;
