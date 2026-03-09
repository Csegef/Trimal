import React, { useEffect, useState } from "react";
import GameLayout from "../layouts/GameLayout";
import { useNavigate } from "react-router-dom";
import PlayerPortrait from "../components/PlayerPortrait";
import IntroOverlay from "../components/IntroOverlay";

const MainGame = () => {
  const [userData, setUserData] = useState(null);
  const [currency, setCurrency] = useState(null);
  const [showIntro, setShowIntro] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      setUserData(JSON.parse(storedData));
    }

    // Betöltjük a currency-t és player adatokat
    const token = localStorage.getItem('token');
    if (token) {
      // Get detailed player info including createdAt
      fetch('/api/inventory/player', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            setCurrency(res.data.stats ? { normal: res.data.currency?.normal || 0, spec: res.data.currency?.spec || 0 } : null);
            
            // Logic for intro: show if created within last 2 minutes
            if (res.data.createdAt) {
              const createdDate = new Date(res.data.createdAt);
              const now = new Date();
              const diffMinutes = (now - createdDate) / (1000 * 60);
              
              // If account was created less than 2 minutes ago AND we haven't shown intro this session
              const introShown = sessionStorage.getItem('introShown');
              if (diffMinutes < 2 && !introShown) {
                setShowIntro(true);
                sessionStorage.setItem('introShown', 'true');
              }
            }
          }
        })
        .catch(() => { });

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
    const char = userData?.character;
    const cls = char?.specie_name || char?.className || char?.class || "Neanderthal";
    const hairStyle = char?.hair_style ?? char?.hairStyle;
    const beardStyle = char?.beard_style ?? char?.beardStyle;

    return (
      <PlayerPortrait
        className={cls}
        hairStyle={hairStyle}
        beardStyle={beardStyle}
      />
    );
  };

  return (
    <>
      {showIntro && <IntroOverlay onComplete={() => setShowIntro(false)} />}
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
          className="absolute inset-0 bg-cover bg-center bg-no-repedat"
          style={{
            backgroundImage: "url('/src/assets/design/backgrounds/map/map-gif.gif')",
          }}
        />
      </div>
    </GameLayout>
    </>
  );
};

export default MainGame;
