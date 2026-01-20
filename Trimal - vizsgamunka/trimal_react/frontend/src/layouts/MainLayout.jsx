import React from "react";

const MainLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans text-stone-100">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/assets/backgrounds/site_background.png')",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />{" "}
        {/* Overlay for readability */}
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header / Logo - kisebb */}
        <header className="flex justify-center py-3 md:py-4">
          <img 
            src="./src/assets/logo1.png" 
            alt="Trimal RPG Logo" 
            className="h-28 md:h-44 lg:h-52 object-contain drop-shadow-2xl"
          />
        </header>

        {/* Main Content Area - kisebb padding */}
        <main className="flex-grow flex flex-col items-center justify-center p-2 md:p-3">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;