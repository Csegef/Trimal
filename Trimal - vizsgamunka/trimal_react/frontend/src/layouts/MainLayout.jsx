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
        <main className="grow flex flex-col items-center justify-center p-2 md:p-3">
          {children}
        </main>

        {/* Footer */}
        <footer className="relative z-10 backdrop-blur-sm bg-stone-900/70 border-t-2 border-stone-700 mt-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
            {/* Footer Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center md:text-left">
              
              {/* Bal oszlop: Játék info */}
              <div className="space-y-2">
                <h3 className="text-amber-400 font-bold uppercase tracking-wider text-sm md:text-base">
                  Trimal RPG
                </h3>
                <p className="text-stone-300 text-xs md:text-sm leading-relaxed">
                An epic prehistoric adventure game where you conquer the local fauna. Choose your specie and defeat the known world!
                </p>
                <p className="text-stone-400 text-xs">
                  © 2025 Trimal RPG. Every rights reserved.
                </p>
              </div>

              {/* Középső oszlop: Linkek */}
              <div className="space-y-2">
                <h3 className="text-amber-400 font-bold uppercase tracking-wider text-sm md:text-base">
                  Links
                </h3>
                <ul className="space-y-1 text-xs md:text-sm">
                  <li>
                    <a href="/privacy" className="text-stone-300 hover:text-amber-400 transition-colors">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="/terms" className="text-stone-300 hover:text-amber-400 transition-colors">
                      Terms of use
                    </a>
                  </li>
                  <li>
                    <a href="/about" className="text-stone-300 hover:text-amber-400 transition-colors">
                      About us
                    </a>
                  </li>
                </ul>
              </div>

              {/* Jobb oszlop: Kapcsolat & Social */}
              <div className="space-y-2">
                <h3 className="text-amber-400 font-bold uppercase tracking-wider text-sm md:text-base">
                  Contacts
                </h3>
                <ul className="space-y-1 text-xs md:text-sm text-stone-300">
                  <li>
                    Email: <a href="mailto:info@trimalrpg.com" className="hover:text-amber-400 transition-colors">
                      info.trimal.rpg@gmail.com
                    </a>
                  </li>
                </ul>

                {/* Social Media Icons */}
                <div className="flex gap-3 justify-center md:justify-start pt-2">
                  <a 
                    href="https://youtube.com/@trimalrpg" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-stone-700 hover:bg-amber-600 rounded flex items-center justify-center transition-colors"
                    aria-label="YouTube"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-6 pt-4 border-t border-stone-700 text-center">
              <p className="text-stone-400 text-xs">
                Created by: <span className="text-amber-400 font-semibold">Veres Gabor Zalan and Fekete Csege</span> | 
                Version: <span className="text-amber-400">1.0.0</span> | 
                Build: <span className="text-stone-500">2025.01.21</span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;