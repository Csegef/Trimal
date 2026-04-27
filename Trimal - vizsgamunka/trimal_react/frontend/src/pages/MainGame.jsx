// ==========================================
// Fájl: Fő Játék (Main Game) Oldal
// Cél: Ez az a központi "térkép", ahonnan mindenhova el lehet jutni.
//
// A játékos itt láthatja a karakterét, a menüket (állomásokat) és innét
// navigálhat a boltba, barlangba, vagy küldetésre.
// ==========================================
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
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const storedData = localStorage.getItem('userData');
    if (storedData) {
      setUserData(JSON.parse(storedData));
    }

    // Betöltjük a currency-t és player adatokat
    if (token) {
      // Alapos player info letöltése
      fetch('/api/inventory/player', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            setCurrency(res.data.stats ? { normal: res.data.currency?.normal || 0, spec: res.data.currency?.spec || 0 } : null);

            // Intro megjelenítés ha 2 percen belül lett létrehozva
            if (res.data.createdAt) {
              const createdDate = new Date(res.data.createdAt);
              const now = new Date();
              const diffMinutes = (now - createdDate) / (1000 * 60);

              // Ha 2 percen belül lett létrehozva és még nem lett lejátszva
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
      <GameLayout currency={currency} customBg="/src/assets/design/backgrounds/map/map-gif.gif" bgOpacity={0}>
        {/* Játékos portréja (bal oldalt alul) */}
        <div
          onClick={() => navigate("/inventory")}
          className="absolute bottom-4 left-4 w-40 h-40 md:w-48 md:h-48 z-20 bg-stone-900/70 rounded-xl border-4 hover:border-amber-600/60 transition-colors border-amber-900/60 shadow-2xl p-2 backdrop-blur-sm cursor-pointer"
        >
          <div className="relative w-full h-full">
            {getPlayerImage()}
          </div>
        </div>
      </GameLayout>
    </>
  );
};

export default MainGame;
