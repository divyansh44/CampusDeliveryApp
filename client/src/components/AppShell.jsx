import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 font-medium transition duration-300 rounded-lg ${
      isActive
        ? "text-primary-600 bg-primary-50 shadow-sm"
        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          
          <Link to="/" className="flex flex-col items-start gap-1 group">
            <span className="text-[10px] font-bold tracking-widest uppercase text-primary-500">Campus Cart</span>
            <strong className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight group-hover:text-primary-600 transition-colors">
              Food Delivery
            </strong>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={navLinkClass}>Home</NavLink>
            {user?.role === "student" && <NavLink to="/student" className={navLinkClass}>Student Dashboard</NavLink>}
            {user?.role === "student" && (
              <NavLink to="/cart" className={navLinkClass}>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  Cart
                </span>
              </NavLink>
            )}
            {user?.role === "vendor" && <NavLink to="/vendor" className={navLinkClass}>Vendor Dashboard</NavLink>}
            {user?.role === "delivery" && <NavLink to="/delivery" className={navLinkClass}>Driver Dashboard</NavLink>}
            {user?.role === "admin" && <NavLink to="/admin" className={navLinkClass}>Admin Panel</NavLink>}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex flex-col items-end pr-4 border-r border-slate-200">
                  <span className="text-sm font-bold text-slate-700">{user.name}</span>
                  <span className="text-xs font-semibold text-slate-400 capitalize">
                    {user.role} 
                    {user.role === "delivery" && (
                      <span className={`ml-1 ${user.is_available || user.isAvailable ? "text-green-500" : "text-slate-400"}`}>
                        • {user.is_available || user.isAvailable ? "Online" : "Offline"}
                      </span>
                    )}
                  </span>
                </div>
                <button className="btn-secondary text-sm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <Link className="btn-primary text-sm shadow-md" to="/auth">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {children}
      </main>
      
      <footer className="w-full py-8 text-center border-t border-slate-200 bg-white">
        <p className="text-slate-400 text-sm font-medium">© 2026 Campus Food Delivery. All rights reserved.</p>
      </footer>
    </div>
  );
}
