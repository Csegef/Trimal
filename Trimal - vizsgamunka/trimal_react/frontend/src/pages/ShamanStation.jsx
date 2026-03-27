import React, { useState, useEffect } from 'react';
import GameLayout from '../layouts/GameLayout';
import { useNavigate } from 'react-router-dom';

const generateQuest = (level, difficultyIndex, idSuffix) => {
  const baseReward = 10 * level;

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

  if (difficultyIndex === 0) {
    const easyNames = ["Gathering Herbs", "Scouting the Woods", "Fetching River Water", "Finding Lost Trinket"];
    return {
      id: Date.now() + idSuffix,
      name: randomPick(easyNames),
      difficulty: "Easy",
      staminaCost: 10, // Reduced from 15
      durationLabel: "5m",
      durationStr: "5m 0s",
      description: "A simple task around the village outskirts.",
      rewardNormal: randomVariance(Math.floor(baseReward * 1.5), 0.2),
      rewardSpec: 0,
      rewardXP: Math.max(5, Math.floor(15 / (1 + (level - 1) * 0.05))),
      background
    };
  } else if (difficultyIndex === 1) {
    const mediumNames = ["Beast Subjugation", "Clearing the Path", "Hunting the Boar", "Night Watch"];
    return {
      id: Date.now() + idSuffix,
      name: randomPick(mediumNames),
      difficulty: "Medium",
      staminaCost: 20, // Reduced from 30
      durationLabel: "15m",
      durationStr: "15m 0s",
      description: "A more dangerous task beyond the safe zone.",
      rewardNormal: randomVariance(Math.floor(baseReward * 3), 0.2),
      rewardSpec: Math.random() > 0.5 ? randomVariance(Math.floor(level * 0.5) || 1, 0.2) : 0,
      rewardXP: Math.max(8, Math.floor(25 / (1 + (level - 1) * 0.05))),
      background
    };
  } else {
    const hardNames = ["Ancient Ritual Help", "Slaying the Terror", "Exploring Deep Caverns", "Purifying the Shrine"];
    return {
      id: Date.now() + idSuffix,
      name: randomPick(hardNames),
      difficulty: "Hard",
      staminaCost: 35, // Reduced from 50
      durationLabel: "45m",
      durationStr: "45m 0s",
      description: "A task that requires immense effort and bravery.",
      rewardNormal: randomVariance(Math.floor(baseReward * 8), 0.2),
      rewardSpec: randomVariance(level + 2, 0.2),
      rewardXP: Math.max(12, Math.floor(45 / (1 + (level - 1) * 0.05))),
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
        let loadedQuests = [];
        if (savedQstr) {
          try {
            loadedQuests = JSON.parse(savedQstr);
          } catch (e) { }
        }

        if (!loadedQuests || loadedQuests.length !== 3) {
          loadedQuests = [
            generateQuest(level, 0, 1),
            generateQuest(level, 1, 2),
            generateQuest(level, 2, 3)
          ];
          localStorage.setItem('shamanQuests', JSON.stringify(loadedQuests));
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
    <GameLayout currency={currency}>
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center justify-start pt-4 pb-8 h-[90vh] md:h-full lg:h-[90vh]">

        {/* Main Split Container */}
        <div className="w-full h-full flex flex-col md:flex-row rounded-3xl border-4 border-stone-800 shadow-2xl overflow-hidden bg-black relative">

          {/* Full-width Shaman Background to avoid heavy horizontal cropping */}
          <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/src/assets/design/backgrounds/station_background/trimal_shaman_station_background.png')" }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Left Side: Title and Stamina Overlay */}
          <div className="relative z-10 flex-1 flex flex-col p-6 md:p-10 justify-between min-h-[250px] md:min-h-0 pointer-events-none">
            <div className="pointer-events-auto">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-amber-500 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
                Shaman's Hut
              </h1>
              <p className="text-stone-300 mt-2 font-bold tracking-wider text-xs md:text-sm drop-shadow-[0_0_10px_rgba(0,0,0,1)] max-w-md hidden md:block">
                Seek the wisdom of the spirits and undertake dangerous quests for great rewards.
              </p>
            </div>

            {/* Stamina Display specifically for Shaman */}
            {stamina && (
              <div className="w-full max-w-sm pointer-events-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-400 text-[11px] font-bold uppercase tracking-widest">Stamina</span>
                  <span className="text-stone-500 text-[11px] font-bold tabular-nums">{stamina.current} / {stamina.max}</span>
                </div>

                <div className="relative h-2 bg-black/60 rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all duration-300"
                    style={{
                      width: `${(stamina.current / stamina.max) * 100}%`,
                      background: stamina.current / stamina.max > 0.5 ? '#16a34a'
                        : stamina.current / stamina.max > 0.25 ? '#ca8a04'
                          : '#dc2626'
                    }}
                  />
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 w-px bg-black/45" style={{ left: `${(i + 1) * 10}%` }} />
                  ))}
                </div>
                <button
                  onClick={handleRestoreStamina}
                  className="mt-3 px-4 py-2 bg-purple-900/40 border border-purple-500/50 hover:bg-purple-900/80 transition-all text-purple-300 rounded-lg text-xs font-bold tracking-widest uppercase shadow-md"
                >
                  [DEV] Restore Stamina
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Quest Carousel Panel */}
          <div className="relative z-10 w-full md:w-[400px] lg:w-[450px] bg-stone-950/80 backdrop-blur-xl border-l-[3px] border-amber-900/30 p-6 md:p-8 flex flex-col shrink-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-amber-900/50">
            <h2 className="text-2xl font-black text-stone-200 tracking-widest uppercase mb-8 text-center border-b-[2px] border-stone-800 pb-4 shrink-0">
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
                    <h3 className={`text-2xl font-black tracking-wide uppercase
                      ${currentQuest.difficulty === 'Easy' ? 'text-green-600' :
                        currentQuest.difficulty === 'Medium' ? 'text-amber-400' :
                          'text-red-500'}`}
                    >
                      {currentQuest.name}
                    </h3>
                  </div>

                  <p className="text-sm text-stone-400 relative z-10 leading-relaxed font-medium">
                    {currentQuest.description}
                  </p>

                  <div className="flex flex-col gap-4 relative z-10 mt-auto bg-black/40 p-5 rounded-2xl border border-stone-800">
                    <div className="flex justify-between items-center text-sm font-bold border-b border-stone-800 pb-3">
                      <div className="flex items-center gap-2 text-green-500">
                        <span title="Stamina Cost">Stamina: {currentQuest.staminaCost}</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-300">
                        <span title="Duration">{currentQuest.durationLabel}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold pt-1">
                      <span className="text-stone-500 uppercase tracking-widest text-[10px]">Rewards</span>
                      <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1.5 rounded-lg border border-stone-700">
                          <img src="/src/assets/design/currency/currency-normal.png" alt="Gold" className="w-4 h-4" />
                          <span className="text-amber-300 font-black">{currentQuest.rewardNormal}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1.5 rounded-lg border border-stone-700" title="Experience Points">
                          <span className="text-blue-300 font-black text-xs">XP</span>
                          <span className="text-blue-300 font-black">{currentQuest.rewardXP}</span>
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
      </div>
    </GameLayout >
  );
};

export default ShamanStation;
