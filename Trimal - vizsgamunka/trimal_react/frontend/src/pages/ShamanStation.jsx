import React, { useState, useEffect } from 'react';
import GameLayout from '../layouts/GameLayout';
import { useNavigate } from 'react-router-dom';

/** Compute quest duration in seconds based on player level and difficulty.
 *  Lower level = shorter quests, higher level = longer quests.
 *  Easy:   base 60s  (1m)  → grows to max 600s  (10m)
 *  Medium: base 180s (3m)  → grows to max 1800s (30m)
 *  Hard:   base 600s (10m) → grows to max 3600s (60m)
 */
const getQuestDurationSeconds = (level, difficultyIndex) => {
  const configs = [
    { base: 60, max: 600, perLevel: 30 },  // Easy
    { base: 180, max: 1800, perLevel: 90 },  // Medium
    { base: 600, max: 3600, perLevel: 180 },  // Hard
  ];
  const cfg = configs[difficultyIndex] || configs[0];
  return Math.min(cfg.max, cfg.base + (level - 1) * cfg.perLevel);
};

const formatDuration = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return {
    label: s > 0 ? `${m}m ${s}s` : `${m}m`,
    str: `${m}m ${s}s`
  };
};

const generateQuest = (level, difficultyIndex, idSuffix) => {
  const baseReward = 5 * level;

  const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomVariance = (val, pct) => Math.max(0, Math.floor(val * (1 + (Math.random() * pct * 2 - pct))));

  const backgrounds = [
    '/src/assets/design/backgrounds/quest_background/forest_backgroundFULLHD.jpg',
    '/src/assets/design/backgrounds/quest_background/iceland_backgroundFULLHD.jpg',
    '/src/assets/design/backgrounds/quest_background/jungle_backgroundFULLHD.jpg',
    '/src/assets/design/backgrounds/quest_background/mountain_backgroundFULLHD.png',
    '/src/assets/design/backgrounds/quest_background/savannah_backgroundFULLHD.jpg'
  ];
  const background = randomPick(backgrounds);

  const durationSec = getQuestDurationSeconds(level, difficultyIndex);
  const dur = formatDuration(durationSec);

  if (difficultyIndex === 0) {
    const easyNames = ["Gathering Herbs", "Scouting the Woods", "Fetching River Water", "Finding Lost Trinket"];
    return {
      id: Date.now() + idSuffix,
      name: randomPick(easyNames),
      difficulty: "Easy",
      staminaCost: 10,
      durationLabel: dur.label,
      durationStr: dur.str,
      description: "A simple task around the village outskirts.",
      rewardNormal: randomVariance(Math.floor(baseReward * 1.2), 0.2),
      rewardSpec: 0,
      rewardXP: Math.floor(12 + Math.pow(level, 0.6) * 5),
      background
    };
  } else if (difficultyIndex === 1) {
    const mediumNames = ["Beast Subjugation", "Clearing the Path", "Hunting the Boar", "Night Watch"];
    return {
      id: Date.now() + idSuffix,
      name: randomPick(mediumNames),
      difficulty: "Medium",
      staminaCost: 20,
      durationLabel: dur.label,
      durationStr: dur.str,
      description: "A more dangerous task beyond the safe zone.",
      rewardNormal: randomVariance(Math.floor(baseReward * 2.2), 0.2),
      rewardSpec: Math.random() > 0.5 ? randomVariance(Math.floor(level * 0.5) || 1, 0.2) : 0,
      rewardXP: Math.floor(20 + Math.pow(level, 0.6) * 8),
      background
    };
  } else {
    const hardNames = ["Ancient Ritual Help", "Slaying the Terror", "Exploring Deep Caverns", "Purifying the Shrine"];
    return {
      id: Date.now() + idSuffix,
      name: randomPick(hardNames),
      difficulty: "Hard",
      staminaCost: 35,
      durationLabel: dur.label,
      durationStr: dur.str,
      description: "A task that requires immense effort and bravery.",
      rewardNormal: randomVariance(Math.floor(baseReward * 4.0), 0.2),
      rewardSpec: randomVariance(level + 2, 0.2),
      rewardXP: Math.floor(35 + Math.pow(level, 0.6) * 15),
      background
    };
  }
};

const ShamanStation = () => {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState(null);
  const [stamina, setStamina] = useState(null);
  const [quests, setQuests] = useState([]);
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
  const [loading, setLoading] = useState(true); // Default to true initially
  const [playerLevel, setPlayerLevel] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        const invRes = await fetch('/api/inventory', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        if (invRes.success && invRes.data) {
          if (invRes.data.currency) setCurrency(invRes.data.currency);
          if (invRes.data.stamina) setStamina(invRes.data.stamina);

          if (invRes.data.active_quest) {
            // Already doing a quest? redirect
            navigate('/active-quest');
            return;
          }
        }

        // load user level
        const storedData = localStorage.getItem('userData');
        let level = 1;
        if (storedData) {
          const ud = JSON.parse(storedData);
          if (ud.character && ud.character.lvl) {
            level = ud.character.lvl;
          }
        }
        setPlayerLevel(level);

        // load generated quests from localStorage or create new
        const savedQstr = localStorage.getItem('shamanQuests');
        const savedLevel = parseInt(localStorage.getItem('shamanQuestsLevel'), 10) || 0;
        let loadedQuests = [];
        if (savedQstr) {
          try {
            loadedQuests = JSON.parse(savedQstr);
          } catch (e) { }
        }

        // Regenerate if no quests, wrong count, or level changed
        if (!loadedQuests || loadedQuests.length !== 3 || savedLevel !== level) {
          loadedQuests = [
            generateQuest(level, 0, 1),
            generateQuest(level, 1, 2),
            generateQuest(level, 2, 3)
          ];
          localStorage.setItem('shamanQuests', JSON.stringify(loadedQuests));
          localStorage.setItem('shamanQuestsLevel', String(level));
        }

        setQuests(loadedQuests);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    loadData();
  }, [navigate]);

  const handleStartQuest = async (quest, index) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch('/api/inventory/quest/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questName: quest.name,
          difficulty: quest.difficulty,
          staminaCost: quest.staminaCost,
          duration: quest.durationStr,
          description: quest.description,
          rewardNormal: quest.rewardNormal,
          rewardSpec: quest.rewardSpec,
          rewardXP: quest.rewardXP,
          background: quest.background
        })
      });

      const data = await res.json();
      if (data.success) {
        // Replace ONLY this specific quest with a new one
        const updatedQuests = [...quests];
        updatedQuests[index] = generateQuest(playerLevel, index, Date.now());
        localStorage.setItem('shamanQuests', JSON.stringify(updatedQuests));

        navigate('/active-quest');
      } else {
        alert(data.message || 'Failed to start quest');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleRestoreStamina = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/inventory/quest/restore-stamina', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.stamina) {
        setStamina(data.stamina);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const nextQuest = () => {
    setCurrentQuestIndex((prev) => (prev + 1) % quests.length);
  };

  const prevQuest = () => {
    setCurrentQuestIndex((prev) => (prev - 1 + quests.length) % quests.length);
  };

  const currentQuest = quests[currentQuestIndex];

  return (
    <GameLayout
      currency={currency}
      customBg="/src/assets/design/backgrounds/station_background/trimal_shaman_station_background.png"
      contentAlign="start"
      fullBleed={true}
    >
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-stretch justify-between overflow-hidden">
        <div className="absolute inset-0 bg-white/[0.04] pointer-events-none z-[5] mix-blend-screen" />

        {/* Left Side: Title and Stamina */}
        <div className="relative z-20 flex-1 p-4 md:p-6 flex flex-col justify-between pointer-events-none shrink-0 min-h-0">
          <div className="pointer-events-auto mb-4 md:mb-0 max-w-sm md:max-w-xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl text-amber-500 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
              Shaman's Hut
            </h1>
            <p className="text-stone-300 mt-2 tracking-wider text-sm md:text-base drop-shadow-[0_0_10px_rgba(0,0,0,1)] hidden md:block">
              Seek the wisdom of the spirits and undertake dangerous quests for great rewards.
            </p>
          </div>

        {/* Stamina Display specifically for Shaman - Wide Bottom Left */}
        {stamina && (
          <div className="pointer-events-auto w-full md:max-w-4xl md:pr-8 mt-auto md:mb-0 mb-4 flex-shrink-0">
            <div className="flex justify-between items-center mb-2 drop-shadow-[0_0_10px_rgba(0,0,0,1)]">
              <span className="text-stone-300 text-[11px] font-bold uppercase tracking-widest">Stamina</span>
              <span className="text-stone-400 text-[11px] font-bold tabular-nums">{stamina.current} / {stamina.max}</span>
            </div>

            <div className="relative h-4 bg-stone-950/80 rounded-lg overflow-hidden mb-3 border-[2px] border-stone-800 shadow-2xl">
              <div
                className="h-full rounded-sm transition-all duration-300 shadow-[0_0_10px_currentColor]"
                style={{
                  width: `${(stamina.current / stamina.max) * 100}%`,
                  background: stamina.current / stamina.max > 0.5 ? '#16a34a'
                    : stamina.current / stamina.max > 0.25 ? '#ca8a04'
                      : '#dc2626',
                  color: stamina.current / stamina.max > 0.5 ? '#16a34a'
                    : stamina.current / stamina.max > 0.25 ? '#ca8a04'
                      : '#dc2626'
                }}
              />
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="absolute top-0 bottom-0 w-px bg-stone-900/60" style={{ left: `${(i + 1) * 10}%` }} />
              ))}
            </div>
            <button
              onClick={handleRestoreStamina}
              className="w-full py-4 bg-stone-900/80 border-[2px] border-amber-900/30 hover:bg-stone-800 transition-all text-stone-400 hover:text-amber-500 rounded-xl text-sm font-black tracking-widest uppercase shadow-2xl"
            >
              [DEV] Restore Stamina
            </button>
          </div>
        )}
        </div>
        {/* Right Side: Quest Carousel Panel */}
        <div className="relative z-10 w-full md:w-[350px] lg:w-[400px] xl:w-[450px] bg-stone-950/80 backdrop-blur-xl border-l-[3px] border-amber-900/30 p-4 md:p-6 flex flex-col shrink-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-amber-900/50 ml-auto">
          <h2 className="text-2xl text-stone-200 tracking-widest uppercase mb-8 text-center border-b-[2px] border-stone-800 pb-4 shrink-0">
            Available Quests
          </h2>

          {quests.length > 0 && currentQuest && (
            <div className="flex-1 flex flex-col relative justify-center">

              {/* Navigation Arrows */}
              <button onClick={prevQuest} className="absolute left-[-20px] z-30 text-5xl text-amber-600/40 hover:text-amber-400 hover:scale-110 transition-all font-black">&lsaquo;</button>
              <button onClick={nextQuest} className="absolute right-[-20px] z-30 text-5xl text-amber-600/40 hover:text-amber-400 hover:scale-110 transition-all font-black">&rsaquo;</button>

              {/* Current Quest Card */}
              <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden mx-4 h-[420px]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col gap-2 relative z-10">
                  <h3 className={`text-3xl tracking-wide uppercase
                      ${currentQuest.difficulty === 'Easy' ? 'text-green-600' :
                      currentQuest.difficulty === 'Medium' ? 'text-amber-400' :
                        'text-red-500'}`}
                  >
                    {currentQuest.name}
                  </h3>
                </div>

                <p className="text-base text-stone-400 relative z-10 leading-relaxed font-medium">
                  {currentQuest.description}
                </p>

                <div className="flex flex-col gap-4 relative z-10 mt-auto bg-black/40 p-5 rounded-2xl border border-stone-800">
                  <div className="flex justify-between items-center text-m border-b border-stone-800 pb-3">
                    <div className="flex items-center gap-2 text-green-500">
                      <span title="Stamina Cost">Stamina: {currentQuest.staminaCost}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-300">
                      <span title="Duration">{currentQuest.durationLabel}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold pt-1">
                    <span className="text-stone-500 uppercase tracking-widest text-[12px]">Rewards</span>
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1.5 rounded-lg border border-stone-700">
                        <img src="/src/assets/design/currency/currency-normal.png" alt="Gold" className="w-4 h-4" />
                        <span className="text-amber-300">{currentQuest.rewardNormal}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1.5 rounded-lg border border-stone-700" title="Experience Points">
                        <span className="text-blue-300 text-xs">XP</span>
                        <span className="text-blue-300">{currentQuest.rewardXP}</span>
                      </div>
                      {currentQuest.rewardSpec > 0 && (
                        <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1.5 rounded-lg border border-stone-700">
                          <img src="/src/assets/design/currency/currency-spec.png" alt="Gem" className="w-4 h-4" />
                          <span className="text-purple-300 font-black">{currentQuest.rewardSpec}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartQuest(currentQuest, currentQuestIndex)}
                disabled={loading}
                className="w-full mt-6 py-4 bg-amber-700 hover:bg-amber-600 disabled:bg-stone-800 border-2 border-amber-500/50 disabled:border-stone-700 text-amber-100 disabled:text-stone-500 rounded-2xl font-black tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(180,83,9,0.4)] hover:shadow-[0_0_30px_rgba(217,119,6,0.6)] active:scale-95 mx-auto max-w-[90%]"
              >
                {loading ? 'Commencing...' : 'Accept Quest'}
              </button>

              <div className="flex justify-center gap-3 mt-6">
                {quests.map((_, i) => (
                  <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === currentQuestIndex ? 'w-10 bg-amber-500' : 'w-2 bg-stone-700'}`} />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </GameLayout >
  );
};

export default ShamanStation;
