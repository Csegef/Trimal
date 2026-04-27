// ==========================================
// Fájl: Dungeon Állomás (Dungeon Station)
// Cél: A kifejezetten erős, nagy kihívást nyújtó labirintusok kezelése.
//
// Ehhez általában külön engedély vagy 'Dungeon Script' tárgy szükséges.
// ==========================================
import React, { useState, useEffect } from 'react';
import GameLayout from '../layouts/GameLayout';
import { useNavigate } from 'react-router-dom';

const DUNGEON_DESCRIPTIONS = [
  "Carved into red rock, a cluster of primitive dwellings clings to the cliffside. Narrow openings and elevated positions suggest defense rather than comfort. Smoke stains and worn paths hint at constant use. This is no abandoned shelter—it is a stronghold. Anyone approaching would be exposed long before getting close, watched by eyes adapted to both stone and shadow.",
  "A circle of massive standing stones rises from an open plain, weathered but deliberately placed. Some are capped, forming crude gateways or markers, suggesting a structure older than memory. The silence feels intentional—like a boundary. To a wandering hunter, this is not just a place of ritual, but a warning: others have claimed this ground, and they understood stone in ways he does not.",
  "A still body of water reflects dense greenery and the remains of a low, overgrown wall. The structure is partially reclaimed by nature, yet its straight lines reveal careful construction. It could serve as a hidden outpost or a guarded settlement. The calm surface hides movement beneath—tracks, signs, and the quiet presence of a group that knows how to stay unseen."
];

const DUNGEONS = [
  {
    id: 1,
    name: "Squab other me Valley",
    bg: "/src/assets/design/backgrounds/dungeon/dungeon_level1.png",
    minLevel: 5,
    enemyName: "Squab Warrior",
    enemyPrefix: "n",
    description: DUNGEON_DESCRIPTIONS[0],
    staminaCost: 40,
    difficulty: "Medium",
  },
  {
    id: 2,
    name: "Standing Stone Circle",
    bg: "/src/assets/design/backgrounds/dungeon/dungeon_level2.png",
    minLevel: 15,
    enemyName: "Lean Scout",
    enemyPrefix: "hs",
    description: DUNGEON_DESCRIPTIONS[1],
    staminaCost: 40,
    difficulty: "Hard",
  },
  {
    id: 3,
    name: "The Hidden Lagoon",
    bg: "/src/assets/design/backgrounds/dungeon/dungeon_level3.png",
    minLevel: 30,
    enemyName: "Tiny Stalker",
    enemyPrefix: "f",
    description: DUNGEON_DESCRIPTIONS[2],
    staminaCost: 40,
    difficulty: "Legendary",
  },
];

const DIFF_COLORS = {
  Medium: 'text-amber-400 border-amber-700/60',
  Hard: 'text-red-400 border-red-800/60',
  Legendary: 'text-purple-400 border-purple-800/60',
};

const DungeonStation = () => {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState(null);
  const [stamina, setStamina] = useState(null);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [hasScript, setHasScript] = useState(false);
  const [hasUnlocked, setHasUnlocked] = useState(null); // null = betöltés
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState(1); // 1 jobbra, -1 balra

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    const load = async () => {
      try {
        const invRes = await fetch('/api/inventory', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());

        if (invRes.success && invRes.data) {
          if (invRes.data.currency) setCurrency(invRes.data.currency);
          if (invRes.data.stamina) setStamina(invRes.data.stamina);

          // Keresd meg a dungeon scriptet a tárgyak között
          const items = invRes.data.items || [];
          const scriptFound = items.some(
            i => i.type === 'misc' && i.name && i.name.toLowerCase().includes('dungeon')
          );
          setHasScript(scriptFound);
          setHasUnlocked(invRes.data.dungeons_unlocked === true);

          if (invRes.data.active_quest) {
            navigate('/active-quest');
            return;
          }
        }

        const playerRes = await fetch('/api/inventory/player', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());

        if (playerRes.success && playerRes.data && playerRes.data.lvl) {
          setPlayerLevel(playerRes.data.lvl);
        } else {
          const storedData = localStorage.getItem('userData');
          if (storedData) {
            const ud = JSON.parse(storedData);
            if (ud.character && ud.character.lvl) setPlayerLevel(ud.character.lvl);
          }
        }
      } catch (err) {
        console.error(err);
        setHasUnlocked(false);
      }
      setLoading(false);
    };

    load();
  }, [navigate]);

  const changeDungeon = (dir) => {
    if (transitioning) return;
    setDirection(dir);
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIdx(prev => (prev + dir + DUNGEONS.length) % DUNGEONS.length);
      setTransitioning(false);
    }, 280);
  };

  const handleEnterDungeon = async () => {
    const dungeon = DUNGEONS[currentIdx];
    if (playerLevel < dungeon.minLevel) return;
    if (!stamina || stamina.current < dungeon.staminaCost) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setStarting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/inventory/dungeon/start', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dungeonId: dungeon.id })
      });
      const data = await res.json();

      if (data.success) {
        navigate('/fight');
      } else {
        setErrorMsg(data.message || 'Failed to enter dungeon.');
      }
    } catch (err) {
      setErrorMsg('Connection error. Please try again.');
    }
    setStarting(false);
  };

  // ─── Betöltés ────────────────────────────────────────────────────────────────
  if (loading || hasUnlocked === null) {
    return (
      <GameLayout>
        <div className="flex justify-center items-center h-[80vh] text-amber-500 font-bold text-2xl animate-pulse tracking-widest uppercase">
          Checking access...
        </div>
      </GameLayout>
    );
  }

  // ─── Nincs script ──────────────────────────────────────────────────────────────
  if (!hasUnlocked) {
    return (
      <GameLayout currency={currency}>
        <div className="flex flex-col items-center justify-center h-[80vh] gap-6 px-4 text-center max-w-lg mx-auto">
          <h1 className="text-3xl md:text-4xl text-red-400 uppercase tracking-widest  drop-shadow-lg">
            Access Denied
          </h1>
          <div className="w-16 h-0.5 bg-red-800/60 rounded-full" />
          <p className="text-stone-400 leading-relaxed text-base">
            The paths to those dungeons are remain sealed. You need a{' '}
            <span className="text-amber-400">Dungeon Script</span>{' '}
            in your possession to find those paths.
          </p>
          <p className="text-stone-500 text-sm">
            Seek out a Dungeon Script from merchants or as rare spoils of battle — only then will these ancient doors open for you.
          </p>
          <button
            onClick={() => navigate('/maingame')}
            className="mt-4 px-6 py-2.5 bg-stone-900/80 hover:bg-stone-800 border border-stone-700 hover:border-amber-700/50 text-stone-300 hover:text-amber-400 rounded-xl uppercase tracking-widest text-xs font-bold transition-all"
          >
            Return to tribe
          </button>
        </div>
      </GameLayout>
    );
  }

  // ─── Dungeon Carousel ────────────────────────────────────────────────────────
  const dungeon = DUNGEONS[currentIdx];
  const locked = playerLevel < dungeon.minLevel;
  const noStamina = stamina && stamina.current < dungeon.staminaCost;

  return (
    <GameLayout currency={currency} customBg={dungeon.bg} bgOpacity={0} fullBleed>
      {/* Full-bleed háttér gradiens átfedésekkel */}
      <div className="relative w-full h-full flex items-stretch overflow-hidden">

        {/* Dark gradiens – alul nehezebb a szöveg olvashatóságáért */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.2) 100%)' }}
        />
        {/* Oldalsó átfedések a nyíl kontrasztjához */}
        <div className="absolute inset-y-0 left-0 w-32 z-[1] pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.7), transparent)' }} />
        <div className="absolute inset-y-0 right-0 w-32 z-[1] pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.7), transparent)' }} />

        {/* ── BALRA NYÍL ── */}
        <button
          onClick={() => changeDungeon(-1)}
          disabled={transitioning}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 flex items-center justify-center rounded-full bg-black/40 border border-stone-700/50 hover:bg-amber-900/40 hover:border-amber-600/60 text-stone-300 hover:text-amber-400 text-4xl font-black transition-all backdrop-blur-sm shadow-xl active:scale-90 select-none"
          aria-label="Previous dungeon"
        >
          ‹
        </button>

        {/* ── JOBBRA NYÍL ── */}
        <button
          onClick={() => changeDungeon(1)}
          disabled={transitioning}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 flex items-center justify-center rounded-full bg-black/40 border border-stone-700/50 hover:bg-amber-900/40 hover:border-amber-600/60 text-stone-300 hover:text-amber-400 text-4xl font-black transition-all backdrop-blur-sm shadow-xl active:scale-90 select-none"
          aria-label="Next dungeon"
        >
          ›
        </button>

        {/* ── CÍM (bal-fölső) ── */}
        <div className="absolute top-4 left-6 z-10 pointer-events-none">
          <h1 className="text-3xl md:text-4xl lg:text-5xl text-amber-500 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
            Dungeons
          </h1>
        </div>

        {/* ── CAROUSEL pont indicatorok ── */}
        <div className="absolute top-6 right-8 z-10 flex gap-2 items-center">
          {DUNGEONS.map((_, i) => (
            <button
              key={i}
              onClick={() => changeDungeon(i - currentIdx)}
              className={`rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 h-2 bg-amber-500' : 'w-2 h-2 bg-stone-600 hover:bg-stone-400'}`}
            />
          ))}
        </div>

        {/* ── TARTALOM PANEL (alsó) ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center pb-8 pt-6 px-8"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? `translateX(${direction * 40}px)` : 'translateX(0)',
            transition: 'opacity 0.28s ease, transform 0.28s ease',
          }}
        >
          <div className="w-full max-w-2xl flex flex-col items-center gap-4">

            {/* Dungeon neve + nehézsége */}
            <div className="flex items-center gap-4">
              <h2 className="text-3xl md:text-4xl uppercase tracking-widest text-stone-100 drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                {dungeon.name}
              </h2>
            </div>

            {/* Szint követelmény */}
            <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${locked ? 'text-red-400' : 'text-green-400'}`}>
              {locked
                ? <> Requires Level {dungeon.minLevel} — You are Level {playerLevel}</>
                : <> Level {dungeon.minLevel}+ required — You are Level {playerLevel}</>
              }
            </div>

            {/* Leírás */}
            <p className="text-stone-300 text-sm md:text-base leading-relaxed text-center max-w-xl drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">
              {dungeon.description}
            </p>

            {/* Stamina info + ellenfél előnézet */}
            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-stone-400">
              <span>Enemy: <span className="text-stone-200">{dungeon.enemyName}</span></span>
              <span className="w-px h-4 bg-stone-700" />
              <span className={noStamina ? 'text-red-400' : ''}>
                Stamina cost: <span className={noStamina ? 'text-red-400 font-black' : 'text-stone-200'}>{dungeon.staminaCost}</span>
                {stamina && <span className="text-stone-600"> / {stamina.current} remaining</span>}
              </span>
            </div>

            {/* Hibaüzenet */}
            {errorMsg && (
              <div className="text-red-400 text-sm font-bold bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-2">
                {errorMsg}
              </div>
            )}

            {/* Fight gomb */}
            <button
              onClick={handleEnterDungeon}
              disabled={locked || noStamina || !hasScript || starting}
              className={`mt-2 px-16 py-4 rounded-2xl font-black tracking-[0.25em] uppercase text-lg border-2 transition-all shadow-2xl active:scale-95 ${locked || noStamina || !hasScript
                ? 'bg-stone-900/50 border-stone-700 text-stone-600 cursor-not-allowed'
                : starting
                  ? 'bg-amber-900/50 border-amber-700/40 text-amber-300 cursor-wait'
                  : 'bg-red-900/70 hover:bg-red-800/80 border-red-600/60 hover:border-red-400 text-red-100 shadow-[0_0_30px_rgba(185,28,28,0.5)] hover:shadow-[0_0_50px_rgba(220,38,38,0.7)]'
                }`}
            >
              {starting ? 'Entering...' : locked ? `Locked (Lvl ${dungeon.minLevel})` : !hasScript ? 'No Script' : noStamina ? 'No Stamina' : ' Fight'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </GameLayout>
  );
};

export default DungeonStation;
