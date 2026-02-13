import React from "react";
import { useNavigate } from "react-router-dom";

// TODO: BACKEND - This layout is specific for authenticated users.
const GameLayout = ({ children }) => {
  const navigate = useNavigate();

  // const handleLogout = () => {
  //   // TODO: BACKEND - Call logout API endpoint here in the future
  //   // await fetch('/api/auth/logout', { method: 'POST' });

  //   // Clear local storage (Mock Auth)
  //   localStorage.removeItem("authToken"); // If we use token
  //   // We might want to keep some userData or clear it all?
  //   // localStorage.removeItem("userData"); // Optional: clear user data on logout

  //   navigate("/"); // Redirect to Login page
  // };

   const handleLogout = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("authToken");
      
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
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("characterData");
      
      // Redirect to login page
      navigate("/");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans text-stone-100">
      {/* Background Image - Same as MainLayout but persistent for game */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/assets/backgrounds/site_background.png')",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Bar with Logo and Logout */}
        <header className="flex justify-between items-center p-4">
          {/* Logo - Smaller than MainLayout */}
          <img
            src="/src/assets/design/covers/logo/logo1.png"
            alt="Trimal RPG Logo"
            className="h-20 md:h-32 lg:h-40 object-contain drop-shadow-xl"
          />

          {/* TODO: BACKEND - Verify if this logout button placement is final for the game UI */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-800/80 hover:bg-red-700 text-stone-200 font-bold rounded border border-red-900 shadow-md transition-all uppercase text-sm tracking-wider"
          >
            Logout
          </button>
        </header>

        {/* Main Game Content */}
        <main className="grow flex flex-col items-center justify-center p-2 md:p-3">
          {children}
        </main>
      </div>
    </div>
  );
};

export default GameLayout;
