import React from "react";
import { useNavigate } from "react-router-dom";

// TODO: BACKEND - This layout is specific for authenticated users.
const GameLayout = ({ children }) => {
  const navigate = useNavigate();


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
      navigate("/");
    }
  };



  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans text-stone-100">
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
      <div className="relative z-10 flex flex-col min-h-screen">

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
                <span className="text-amber-300 font-bold text-sm drop-shadow-md">0</span> {/* TODO: Connect to User Data */}
              </div>
              <div className="flex items-center gap-2" title="Special Currency">
                <img src="/src/assets/design/currency/currency-spec.png" alt="Gem" className="w-5 h-5 drop-shadow" />
                <span className="text-purple-300 font-bold text-sm drop-shadow-md">0</span> {/* TODO: Connect to User Data */}
              </div>
            </div>
          </div>

          {/* Center: Navigation Links (Stations) */}
          <nav className="hidden md:flex items-center gap-6">
            {['Inventory', 'Tinkerer', 'Herbalists', "Shaman's hut", 'Mysterious cave'].map((station) => (
              <button
                key={station}
                className="text-stone-300 hover:text-amber-400 font-bold uppercase tracking-wider text-sm transition-colors relative group"
              >
                {station}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full"></span>
              </button>
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
        <main className="grow flex relative items-center justify-center p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default GameLayout;
