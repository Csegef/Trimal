import React, { useEffect, useState } from "react";
import GameLayout from "../layouts/GameLayout";
import { useNavigate } from "react-router-dom";
import PlayerPortrait from "../components/PlayerPortrait";

const MainGame = () => {
  const [userData, setUserData] = useState(null);
  const [currency, setCurrency] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      setUserData(JSON.parse(storedData));
    }

    // Betöltjük a currency-t az inventory API-ból
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data?.currency) {
            setCurrency(res.data.currency);
          }
        })
        .catch(() => { });
    }
  }, []);

  const getPlayerImage = () => {
    if (!userData || !userData.character) return null;
    const { className, hairStyle, beardStyle } = userData.character;

    return (
      <PlayerPortrait
        className={className}
        hairStyle={hairStyle}
        beardStyle={beardStyle}
      />
    );
  };

  return (
    <GameLayout currency={currency}>
      {/* Player Image (Bottom Left) - Framed */}
      <div
        onClick={() => navigate("/inventory")}
        className="absolute bottom-4 left-4 w-40 h-40 md:w-48 md:h-48 z-20 bg-stone-900/70 rounded-xl border-4 hover:border-amber-600/60 transition-colors border-amber-900/60 shadow-2xl p-2 backdrop-blur-sm cursor-pointer"
      >
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
