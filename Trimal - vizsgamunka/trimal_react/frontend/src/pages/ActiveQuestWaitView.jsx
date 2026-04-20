import React, { useState, useEffect } from 'react';
import GameLayout from '../layouts/GameLayout';
import { useNavigate } from 'react-router-dom';

import bgForest from '../assets/design/backgrounds/quest_background/forest_backgroundFULLHD.jpg';
import bgIceland from '../assets/design/backgrounds/quest_background/iceland_backgroundFULLHD.jpg';
import bgJungle from '../assets/design/backgrounds/quest_background/jungle_backgroundFULLHD.jpg';
import bgMountain from '../assets/design/backgrounds/quest_background/mountain_backgroundFULLHD.png';
import bgSavannah from '../assets/design/backgrounds/quest_background/savannah_backgroundFULLHD.jpg';

const ActiveQuestWaitView = () => {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState(null);
  const [activeQuest, setActiveQuest] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(1);
  const [loading, setLoading] = useState(true);
  const [background, setBackground] = useState('');

  useEffect(() => {
    const bgList = [bgForest, bgIceland, bgJungle, bgMountain, bgSavannah];
    setBackground(bgList[Math.floor(Math.random() * bgList.length)]);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    const loadData = async () => {
      try {
        const invRes = await fetch('/api/inventory', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        if (invRes.success && invRes.data) {
          setCurrency(invRes.data.currency);
          if (invRes.data.active_quest) {
            const quest = invRes.data.active_quest;
            if (quest.isArena) {
              navigate('/fight');
              return;
            }
            setActiveQuest(quest);
            setMaxTime(quest.duration || 1);
            const now = Math.floor(Date.now() / 1000);
            setTimeLeft(Math.max(0, quest.start_time + quest.duration - now));
          } else {
            navigate('/shamans-hut');
          }
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    };

    loadData();
  }, [navigate]);

  useEffect(() => {
    if (!activeQuest) return;

    const computeTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, activeQuest.start_time + activeQuest.duration - now);
    };

    // Set initial value from clock
    setTimeLeft(computeTimeLeft());

    const timer = setInterval(() => {
      const remaining = computeTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuest]);

  const handleSkip = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/inventory/quest/skip', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        // Update activeQuest state so the timer effect re-computes with the new start_time
        // The server set start_time to now - duration - 10, so replicate that here
        setActiveQuest(prev => prev ? {
          ...prev,
          start_time: Math.floor(Date.now() / 1000) - (prev.duration || 0) - 10
        } : prev);
      }
    } catch (e) { console.error(e); }
  };

  const handleClaimAndFight = async () => {
    navigate('/fight');
  };

  if (loading) return (
    <GameLayout>
      <div className="flex items-center justify-center h-full text-amber-500 font-bold text-2xl animate-pulse uppercase tracking-widest">Loading...</div>
    </GameLayout>
  );

  const progressPct = Math.max(0, Math.min(100, ((maxTime - timeLeft) / maxTime) * 100));

  // Background: quest's own environment image, fallback to map gif
  const bgImage = activeQuest?.background || '/src/assets/design/backgrounds/map/map-gif.gif';

  return (
    <GameLayout currency={currency} customBg={bgImage} bgOpacity={0} fullBleed>
      <div className="relative w-full h-full flex items-stretch overflow-hidden">

        {/* Gradient overlays – like DungeonStation */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.15) 100%)' }}
        />
        <div className="absolute inset-y-0 left-0 w-24 z-[1] pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.6), transparent)' }} />
        <div className="absolute inset-y-0 right-0 w-24 z-[1] pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)' }} />

        {/* Content – pinned bottom like DungeonStation */}
        {activeQuest && (
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center pb-6 pt-4 px-8 gap-3">
            <div className="w-full max-w-2xl flex flex-col items-center gap-3">

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-black text-amber-500 tracking-[0.15em] uppercase drop-shadow-[0_0_15px_rgba(0,0,0,1)] leading-tight text-center">
                {activeQuest.name}
              </h1>
              <p className="text-stone-400 text-xs font-bold tracking-widest uppercase">
                Difficulty:{' '}
                <span className={
                  activeQuest.difficulty === 'Easy' ? 'text-green-400' :
                    activeQuest.difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400'
                }>{activeQuest.difficulty}</span>
              </p>

              {/* Description */}
              {activeQuest.description && (
                <p className="text-stone-300 text-xs italic opacity-90 text-center max-w-xl leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">
                  "{activeQuest.description}"
                </p>
              )}
              {activeQuest.original_duration && activeQuest.duration < activeQuest.original_duration && (
                <div className="flex items-center text-[10px] text-green-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-green-900/30 border border-green-500/30">
                  You found a shorter path, reducing your travel time.
                </div>
              )}

              {/* "You've arrived" overlay text */}
              {timeLeft === 0 && (
                <span className="text-green-400 font-black text-xl tracking-widest uppercase animate-pulse drop-shadow-[0_0_10px_rgba(0,0,0,1)]">
                  You've arrived!
                </span>
              )}

              {/* Progress bar */}
              <div className="w-full flex flex-col gap-0.5">
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-amber-500 font-bold uppercase tracking-widest text-[10px]">Quest Progress</span>
                  <span className="text-stone-300 font-black tabular-nums text-xs">
                    {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                    <span className="text-[10px] text-stone-500 ml-1">remaining</span>
                  </span>
                </div>
                <div className="w-full h-4 bg-stone-900/80 rounded-full border border-stone-800 overflow-hidden shadow-inner">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear ${timeLeft === 0
                      ? 'bg-gradient-to-r from-green-700 to-green-400'
                      : 'bg-gradient-to-r from-amber-700 to-amber-400'
                      }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Rewards + buttons row */}
              <div className="w-full flex justify-between items-center">
                <div className="bg-stone-900/80 px-3 py-1.5 rounded-lg border border-stone-700">
                  <span className="text-stone-500 text-[9px] font-black uppercase tracking-widest block mb-0.5">Expected Rewards</span>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1">
                      <img src="/src/assets/design/currency/currency-normal.png" alt="Gold" className="w-4 h-4" />
                      <span className="text-amber-300 font-black text-xs">{activeQuest.reward_normal}</span>
                    </div>
                    {activeQuest.reward_spec > 0 && (
                      <div className="flex items-center gap-1">
                        <img src="/src/assets/design/currency/currency-spec.png" alt="Gem" className="w-4 h-4" />
                        <span className="text-purple-300 font-black text-xs">{activeQuest.reward_spec}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  {timeLeft > 0 && (
                    <button
                      onClick={handleSkip}
                      className="px-3 py-1.5 bg-purple-900/20 border border-purple-500/30 hover:border-purple-500 text-purple-300 rounded-lg hover:bg-purple-900/60 transition-all text-[10px] font-bold tracking-widest uppercase"
                    >
                      [DEV] Skip
                    </button>
                  )}
                  {timeLeft === 0 && (
                    <button
                      onClick={handleClaimAndFight}
                      className="px-7 py-2 bg-red-950/80 hover:bg-red-800 border-2 border-red-500 rounded-xl text-red-100 font-black tracking-[0.2em] text-xs uppercase transition-all shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] hover:scale-105 active:scale-95"
                    >
                      Enter Fight
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
};

export default ActiveQuestWaitView;