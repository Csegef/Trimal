import React, { useEffect, useState } from "react";
import GameLayout from "../layouts/GameLayout";

const MainGame = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Felhasználói adatok betöltése localStorage-ból
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      setUserData(JSON.parse(storedData));
    }
  }, []);

  const getPlayerImage = () => {
    if (!userData || !userData.character) return null;
    const { className, hairStyle, beardStyle } = userData.character;

    // Map className to prefix (e.g., Neanderthal -> n, Sapiens -> s, Floresiensis -> f)
    let prefix = 'n';
    if (className === 'Sapiens') prefix = 's';
    if (className === 'Floresiensis') prefix = 'f';

    return (
      <div className="relative w-full h-full">
        <img
          src={`/src/assets/design/character/base_character/${prefix}_base.png`}
          alt="Base Character"
          className="absolute z-0 h-full w-auto object-contain bottom-0 left-0"
        />
        {hairStyle > 0 && (
          <img
            src={`/src/assets/design/character/hair/${prefix}-hair-${hairStyle}.png`}
            alt="Hair"
            className="absolute z-10 h-full w-auto object-contain bottom-0 left-0"
          />
        )}
        {beardStyle > 0 && (
          <img
            src={`/src/assets/design/character/beard/${prefix}-beard-${beardStyle}.png`}
            alt="Beard"
            className="absolute z-20 h-full w-auto object-contain bottom-0 left-0"
          />
        )}
      </div>
    )
  }

  return (
    <GameLayout>
      {/* Player Image (Bottom Left) - Framed */}
      <div className="absolute bottom-4 left-4 w-40 h-40 md:w-48 md:h-48 z-20 bg-stone-900/70 rounded-xl border-4 border-amber-900/60 shadow-2xl p-2 backdrop-blur-sm">
        <div className="relative w-full h-full">
          {getPlayerImage()}
        </div>
      </div>

      {/* Map Container - Framed and Centered - LARGER */}
      <div className="relative w-full max-w-7xl h-[80vh] bg-stone-900/30 rounded-2xl border-4 border-stone-700/80 shadow-2xl overflow-hidden backdrop-blur-sm">
        {/* Map Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/src/assets/design/backgrounds/map/trimal_map.png')",
          }}
        />

        {/* Content Overlay - for future game elements */}
        <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
          {/* Future game content will go here */}
        </div>
      </div>
    </GameLayout>
  );
};

export default MainGame;