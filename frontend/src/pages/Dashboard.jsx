import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { isAuthenticated, isCustodian } = useAuth();

  return (
    <div className="page">
      <section className="hero card">
        <h1>Welcome to GearLedger</h1>
        <p className="lead">
          Keep shared club or lab equipment visible: what you have, who has it, and when it is due
          back.
        </p>
        {!isAuthenticated ? (
          <div className="row gap">
            <Link to="/register" className="btn primary">
              Get started
            </Link>
            <Link to="/login" className="btn ghost">
              Log in
            </Link>
          </div>
        ) : (
          <div className="row gap wrap">
            <Link to="/equipment" className="btn primary">
              Browse equipment
            </Link>
            <Link to="/my-checkouts" className="btn secondary">
              My checkouts
            </Link>
            {isCustodian && (
              <Link to="/custodian" className="btn ghost">
                Manage inventory
              </Link>
            )}
          </div>
        )}
      </section>
      <section className="grid-2">
        <div className="card">
          <h2>Members</h2>
          <p className="muted">
            Sign up, browse the catalog, and check out gear with a due date. Mark items returned when
            you are done.
          </p>
        </div>
        <div className="card">
          <h2>Custodians</h2>
          <p className="muted">
            The first registered user is the custodian. Add and edit inventory, see all checkouts,
            and help close out returns.
          </p>
        </div>
      </section>
    </div>
  );
}
