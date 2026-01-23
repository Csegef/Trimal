import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";

const MainGame = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Felhasználói adatok betöltése localStorage-ból
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      setUserData(JSON.parse(storedData));
    }
  }, []);

  return (
    <MainLayout>
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="backdrop-blur-sm p-8 rounded-2xl border-4 shadow-2xl bg-stone-900/50 border-stone-700">
          
          {/* Üdvözlő fejléc */}
          <h1 className="text-4xl md:text-5xl font-black text-amber-400 uppercase text-center mb-8 tracking-wider">
            🎮 Welcome to the Game! 🎮
          </h1>

          {/* Felhasználó adatok */}
          {userData && (
            <div className="bg-stone-800/70 rounded-xl p-6 mb-6 border-2 border-stone-600">
              <h2 className="text-2xl font-bold text-amber-300 mb-4 uppercase">
                Character Info
              </h2>
              <div className="space-y-3 text-stone-200">
                <p className="text-lg">
                  <span className="font-bold text-amber-400">Username:</span>{" "}
                  {userData.username}
                </p>
                <p className="text-lg">
                  <span className="font-bold text-amber-400">Email:</span>{" "}
                  {userData.email}
                </p>
                <p className="text-lg">
                  <span className="font-bold text-amber-400">Species:</span>{" "}
                  {userData.character.className}
                </p>
                <p className="text-lg">
                  <span className="font-bold text-amber-400">Hair Style:</span>{" "}
                  {userData.character.hairStyle === 0 ? "Bald" : `Style ${userData.character.hairStyle}`}
                </p>
                <p className="text-lg">
                  <span className="font-bold text-amber-400">Beard Style:</span>{" "}
                  {userData.character.beardStyle === 0 ? "Shaved" : `Style ${userData.character.beardStyle}`}
                </p>
              </div>
            </div>
          )}

          {/* Placeholder üzenet */}
          <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 rounded-xl p-6 border-2 border-amber-600">
            <p className="text-xl text-center text-amber-100 font-semibold">
              🚧 Game features coming soon! 🚧
            </p>
            <p className="text-center text-stone-300 mt-3">
              The adventure will begin here...
            </p>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default MainGame;