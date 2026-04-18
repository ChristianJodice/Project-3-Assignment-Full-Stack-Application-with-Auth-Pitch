import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function PrivateRoute({ children, custodianOnly = false }) {
  const { ready, isAuthenticated, isCustodian } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="card center">
        <p>Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (custodianOnly && !isCustodian) {
    return <Navigate to="/" replace />;
  }

  return children;
}
