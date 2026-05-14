import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { logout } from '../api/auth';

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: '▪' },
  { to: '/dashboard/availability', label: 'Availability', icon: '◷' },
  { to: '/dashboard/bookings', label: 'Bookings', icon: '◉' },
];

export default function DashboardLayout() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Sidebar */}
      <aside className="hidden w-52 bg-[#0f1219] border-r border-border-light md:flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-border-light">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-white text-xs font-mono font-bold">S</div>
          <span className="font-sans font-medium text-text-primary text-sm">BookMySlot</span>
        </div>

        <nav className="flex-1 py-3">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'text-[#c8baff] bg-[#1a1f30] border-r-2 border-accent'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary'
                }`
              }
            >
              <span className="text-xs opacity-60">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border-light p-3">
          {user && (
            <div className="flex items-center gap-2 mb-3 px-1">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs text-white font-medium">
                  {user.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-secondary truncate font-medium">{user.name}</p>
                <p className="text-[11px] text-text-faint truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs text-text-faint hover:text-danger hover:bg-bg-secondary rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-20 md:pb-0">
        <header className="flex items-center justify-between bg-[#0f1219] border-b border-border-light px-4 py-3 md:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-white text-xs font-mono font-bold shrink-0">S</div>
            <span className="font-sans font-medium text-text-primary text-sm truncate">BookMySlot</span>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            {user && (
              <>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs text-white font-medium shrink-0">
                    {user.name[0]}
                  </div>
                )}
              </>
            )}
            <button
              onClick={handleLogout}
              className="text-[11px] bg-bg-secondary border border-border-light rounded-lg px-2.5 py-1.5 text-text-faint hover:text-danger transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-border-light bg-[#0f1219] md:hidden">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[10px] transition-colors ${
                isActive ? 'text-[#c8baff]' : 'text-text-faint'
              }`
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
