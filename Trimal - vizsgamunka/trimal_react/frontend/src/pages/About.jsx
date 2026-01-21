import React from "react";
import MainLayout from "../layouts/MainLayout";

const About = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
        <div className="backdrop-blur-sm bg-stone-900/50 border-4 border-stone-700 rounded-xl md:rounded-2xl shadow-xl p-5 md:p-8">
          <h1 className="text-2xl md:text-3xl font-black text-amber-400 uppercase text-center mb-6 border-b-2 border-stone-600 pb-4">
            About Our Game
          </h1>

          <div className="space-y-6 text-stone-300">
            <section className="space-y-4">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-amber-100 mb-3">
                    Welcome to the Adventure
                  </h2>
                  <p className="text-stone-300 leading-relaxed">
                    Embark on an epic journey through ancient lands. Choose your character specie, customize your appearance, and 
                    battle your way to glory in a world filled with challenges and treasures.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                Key Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-stone-800/30 p-4 rounded-lg border border-stone-700">
                  <h3 className="font-bold text-amber-200 mb-2">Character Customization</h3>
                  <p className="text-sm text-stone-300">
                    Create unique characters with different classes, hair styles, and beard options
                  </p>
                </div>
                <div className="bg-stone-800/30 p-4 rounded-lg border border-stone-700">
                  <h3 className="font-bold text-amber-200 mb-2">Strategic Gameplay</h3>
                  <p className="text-sm text-stone-300">
                    Engage in tactical battles
                  </p>
                </div>
                <div className="bg-stone-800/30 p-4 rounded-lg border border-stone-700">
                  <h3 className="font-bold text-amber-200 mb-2">Progression System</h3>
                  <p className="text-sm text-stone-300">
                    Level up your character and unlock powerful weapons
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                Development Team
              </h2>
              <p className="text-stone-300 leading-relaxed">
                Our passionate team of developers, artists, and designers have worked tirelessly 
                to create an immersive gaming experience. We're dedicated to providing regular 
                updates, new content, and maintaining a fair and enjoyable environment for all players.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                Community
              </h2>
              <p className="text-stone-300 leading-relaxed">
                Join our growing community of adventurers! Share thoughts, participate in events, 
                and help shape the future of the game through feedback and suggestions.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-stone-700 text-center">
              <p className="text-stone-300">
                Thank you for playing our game!
              </p>
              <p className="text-sm text-stone-400 mt-2">
                © {new Date().getFullYear()} Trimal RPG. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;