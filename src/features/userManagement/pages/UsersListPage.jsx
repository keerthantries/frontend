// src/features/userManagement/pages/UsersListPage.jsx
import React from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import UserListScreen from "../components/UserListScreen";

const UsersListPage = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const subOrgIdFromState = location.state?.subOrgId || null;
  const subOrgNameFromState = location.state?.subOrgName || null;
  const subOrgIdFromQuery = searchParams.get("subOrgId");

  const subOrgId = subOrgIdFromState || subOrgIdFromQuery || undefined;

  const title = subOrgNameFromState
    ? `Users – ${subOrgNameFromState}`
    : "Users";

  return (
    <UserListScreen
      title={title}
      addLabel="Add User"
      role={undefined} // all roles
      subOrgId={subOrgId} // <-- let UserListScreen filter using this
    />
  );
};

export default UsersListPage;
