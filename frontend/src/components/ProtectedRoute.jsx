import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Assuming AuthContext is in the context folder

function ProtectedRoute ({ children }) {
  const { isAuthenticated } = useContext(AuthContext);

  // Check if the user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If the user is authenticated, render the children (the protected page)
  return children;
};

export default ProtectedRoute;
