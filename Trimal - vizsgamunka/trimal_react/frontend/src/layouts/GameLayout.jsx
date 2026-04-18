import React, { useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

// TODO: BACKEND - This layout is specific for authenticated users.
const GameLayout = ({ children, currency, customBg, bgOpacity, contentAlign = 'center', fullBleed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeQuest, setActiveQuest] = React.useState(null);
  const [shamanOpen, setShamanOpen] = React.useState(false);
  const shamanRef = useRef(null);

  React.useEffect(() => {
    const handleClick = (e) => {
      if (shamanRef.current && !shamanRef.current.contains(e.target)) {
        setShamanOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
    <div className="relative min-h-screen h-screen w-full overflow-hidden text-stone-100">
      {/* Main Background - Site Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: customBg ? `url('${customBg}')` : "url('/assets/backgrounds/site_background.png')",
        }}
      >
        <div className="absolute inset-0 transition-all duration-500" style={{ backgroundColor: `rgba(0,0,0,${(bgOpacity ?? (customBg ? 20 : 40)) / 100})` }} />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Navbar */}
        <header className="relative z-50 flex justify-between items-center p-2 bg-black/60 backdrop-blur-md border-b-2 border-amber-900/50">
          {/* Left: Logo & Currency */}
          <div className="flex items-center gap-4 md:gap-8">
            {/* Logo */}
            <img
              src="/src/assets/design/covers/logo/logo1.png"
              alt="Trimal RPG Logo"
              className={`h-12 md:h-16 object-contain transition-transform ${location.pathname === '/fight' ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
              onClick={() => location.pathname !== '/fight' && navigate('/maingame')}
            />

            {/* Currency */}
            <div className="flex flex-col gap-1 bg-stone-900/40 p-1.5 rounded-lg border border-stone-700/50">
              <div className="flex items-center gap-2" title="Normal Currency">
                <img src="/src/assets/design/currency/currency-normal.png" alt="Gold" className="w-5 h-5" />
                <span className="text-amber-300 font-bold text-sm">{currency?.normal ?? 0}</span>
              </div>
              <div className="flex items-center gap-2" title="Special Currency">
                <img src="/src/assets/design/currency/currency-spec.png" alt="Gem" className="w-5 h-5" />
                <span className="text-purple-300 font-bold text-sm">{currency?.spec ?? 0}</span>
              </div>
            </div>

          </div>

          {/* Center: Navigation Links (Stations) */}
          <nav className="hidden md:flex items-center gap-6">
            {location.pathname === '/fight' ? (
              /* Combat lock — disable all nav during fight */
              <span className="text-red-400/70 font-bold uppercase tracking-widest text-xs animate-pulse select-none">
                In Combat — Navigation Locked
              </span>
            ) : (
              [
                { name: 'Inventory', path: '/inventory' },
                { name: 'Tinkerer', path: '/shop/tinkerer' },
                { name: 'Herbalist', path: '/shop/herbalist' },
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
              )).concat(
                /* Shaman dropdown */
                <div key="shaman-dropdown" className="relative" ref={shamanRef}>
                  <button
                    onClick={() => setShamanOpen(o => !o)}
                    className="text-stone-300 hover:text-amber-400 font-bold uppercase tracking-wider text-sm transition-colors relative group flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                  >
                    Shaman&#39;s hut
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${shamanOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full"></span>
                  </button>

                  {shamanOpen && (
                    <div className="absolute top-full left-0 mt-2 w-40 bg-stone-950/95 border border-amber-900/40 rounded-xl shadow-2xl backdrop-blur-md z-50 overflow-hidden">
                      <Link
                        to="/shamans-hut"
                        onClick={() => setShamanOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-stone-300 hover:text-amber-400 hover:bg-amber-900/20 text-xs font-bold uppercase tracking-widest transition-all"
                      >
                        <span className="text-amber-600"></span> Quests
                      </Link>
                      <div className="border-t border-stone-800/60" />
                      <Link
                        to="/dungeons"
                        onClick={() => setShamanOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-stone-300 hover:text-amber-400 hover:bg-amber-900/20 text-xs font-bold uppercase tracking-widest transition-all"
                      >
                        <span className="text-red-500"></span> Dungeons
                      </Link>
                    </div>
                  )}
                </div>
              )
            )}
          </nav>

          {/* Right: Logout */}
          <button
            onClick={location.pathname !== '/fight' ? handleLogout : undefined}
            disabled={location.pathname === '/fight'}
            className={`px-4 py-1.5 border rounded transition-all text-xs uppercase font-bold tracking-widest ${location.pathname === '/fight'
                ? 'bg-stone-900/20 text-stone-600 border-stone-800 cursor-not-allowed opacity-40'
                : 'bg-red-900/20 hover:bg-red-900/60 text-red-200 border-red-900/50 hover:border-red-500'
              }`}
          >
            Logout
          </button>
        </header>

        {/* Main Game Content */}
        <main className={`grow flex relative min-h-0 overflow-y-auto scrollbar-hide ${fullBleed ? 'w-full p-0' : `justify-center p-4 ${contentAlign === 'start' ? 'items-start' : 'items-center'}`}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}

          {/* Active Quest Interaction Blocker */}
          {activeQuest && location.pathname !== '/active-quest' && location.pathname !== '/fight' && (
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
