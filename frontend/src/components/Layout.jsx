import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout() {
  const { user, logout, isAuthenticated, isCustodian } = useAuth();

  return (
    <div className="app-shell">
      <header className="top-nav">
        <Link to="/" className="brand">
          GearLedger
        </Link>
        <nav className="nav-links">
          {isAuthenticated ? (
            <>
              <NavLink to="/" end>
                Home
              </NavLink>
              <NavLink to="/equipment">Equipment</NavLink>
              <NavLink to="/my-checkouts">My checkouts</NavLink>
              {isCustodian && (
                <NavLink to="/custodian">Manage inventory</NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
        <div className="nav-user">
          {isAuthenticated ? (
            <>
              <span className="user-pill" title={user.email}>
                {user.email}
                {isCustodian && <span className="badge">Custodian</span>}
              </span>
              <button type="button" className="btn ghost" onClick={logout}>
                Log out
              </button>
            </>
          ) : null}
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>GearLedger — shared equipment checkout for small teams.</p>
      </footer>
    </div>
  );
}
