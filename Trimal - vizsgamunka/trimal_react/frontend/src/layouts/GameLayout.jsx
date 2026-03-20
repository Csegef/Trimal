import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

// TODO: BACKEND - This layout is specific for authenticated users.
const GameLayout = ({ children, currency }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeQuest, setActiveQuest] = React.useState(null);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            setActiveQuest(res.data.active_quest);
          }
        })
        .catch(() => { });
    }
  }, []);
  const handleLogout = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");

      if (token) {
        // Call logout API endpoint
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('Logout API error:', await response.text());
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("characterData");
      localStorage.removeItem("lastLogin");

      // Redirect to login page
      navigate("/", { replace: true });
    }
  };



  return (
    <div className="relative min-h-screen h-screen w-full overflow-hidden font-sans text-stone-100">
      {/* Main Background - Site Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/backgrounds/site_background.png')",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Navbar */}
        <header className="flex justify-between items-center p-2 bg-black/60 backdrop-blur-md border-b-2 border-amber-900/50 shadow-lg">
          {/* Left: Logo & Currency */}
          <div className="flex items-center gap-4 md:gap-8">
            {/* Logo */}
            <img
              src="/src/assets/design/covers/logo/logo1.png"
              alt="Trimal RPG Logo"
              className="h-12 md:h-16 object-contain drop-shadow-md hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate('/maingame')}
            />

            {/* Currency */}
            <div className="flex flex-col gap-1 bg-stone-900/40 p-1.5 rounded-lg border border-stone-700/50">
              <div className="flex items-center gap-2" title="Normal Currency">
                <img src="/src/assets/design/currency/currency-normal.png" alt="Gold" className="w-5 h-5 drop-shadow" />
                <span className="text-amber-300 font-bold text-sm drop-shadow-md">{currency?.normal ?? 0}</span>
              </div>
              <div className="flex items-center gap-2" title="Special Currency">
                <img src="/src/assets/design/currency/currency-spec.png" alt="Gem" className="w-5 h-5 drop-shadow" />
                <span className="text-purple-300 font-bold text-sm drop-shadow-md">{currency?.spec ?? 0}</span>
              </div>
            </div>

          </div>

          {/* Center: Navigation Links (Stations) */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              { name: 'Inventory', path: '/inventory' },
              { name: 'Tinkerer', path: '/shop/tinkerer' },
              { name: 'Herbalist', path: '/shop/herbalist' },
              { name: "Shaman's hut", path: '/shamans-hut' },
              { name: 'Mysterious cave', path: '/mysterious-cave' }
            ].map((station) => (
              <Link
                key={station.name}
                to={station.path}
                className="text-stone-300 hover:text-amber-400 font-bold uppercase tracking-wider text-sm transition-colors relative group"
              >
                {station.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Right: Logout */}
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 bg-red-900/20 hover:bg-red-900/60 text-red-200 border border-red-900/50 hover:border-red-500 rounded transition-all text-xs uppercase font-bold tracking-widest"
          >
            Logout
          </button>
        </header>

        {/* Main Game Content */}
        <main className="grow flex relative items-center justify-center p-4 min-h-0 overflow-visible">
          {children}

          {/* Active Quest Interaction Blocker */}
          {activeQuest && location.pathname !== '/active-quest' && (
            <div className="absolute inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex flex-col items-center justify-start pt-10" style={{ pointerEvents: 'auto' }} onClickCapture={(e) => { e.stopPropagation(); navigate('/active-quest'); }}>
              {/* Click capture stops all interaction inside main, forces active-quest redirect on click */}
              <div className="bg-red-900/90 border-2 border-red-500 text-red-100 px-6 py-3 rounded-xl shadow-2xl animate-pulse cursor-pointer flex flex-col items-center">
                <span className="font-bold tracking-widest uppercase text-sm">Active Quest in Progress</span>
                <span className="text-xs text-red-300 mt-1">Click here to view</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GameLayout;
