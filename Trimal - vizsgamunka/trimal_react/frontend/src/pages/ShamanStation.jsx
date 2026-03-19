import React, { useState, useEffect } from 'react';
import GameLayout from '../layouts/GameLayout';
import { useNavigate } from 'react-router-dom';

const generateQuest = (level, difficultyIndex, idSuffix) => {
  const baseReward = 10 * level;
  
  const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomVariance = (val, pct) => Math.max(0, Math.floor(val * (1 + (Math.random() * pct * 2 - pct))));

  if (difficultyIndex === 0) {
    const easyNames = ["Gathering Herbs", "Scouting the Woods", "Fetching River Water", "Finding Lost Trinket"];
    return {
      id: Date.now() + idSuffix,
      name: randomPick(easyNames),
      difficulty: "Easy",
      staminaCost: 15,
      durationLabel: "5m", 
      durationStr: "5m 0s", 
      description: "A simple task around the village outskirts.",
      rewardNormal: randomVariance(Math.floor(baseReward * 1.5), 0.2),
      rewardSpec: 0
    };
  } else if (difficultyIndex === 1) {
    const mediumNames = ["Beast Subjugation", "Clearing the Path", "Hunting the Boar", "Night Watch"];
    return {
      id: Date.now() + idSuffix,
      name: randomPick(mediumNames),
      difficulty: "Medium",
      staminaCost: 30,
      durationLabel: "15m",
      durationStr: "15m 0s",
      description: "A more dangerous task beyond the safe zone.",
      rewardNormal: randomVariance(Math.floor(baseReward * 3), 0.2),
      rewardSpec: Math.random() > 0.5 ? randomVariance(Math.floor(level * 0.5) || 1, 0.2) : 0
    };
  } else {
    const hardNames = ["Ancient Ritual Help", "Slaying the Terror", "Exploring Deep Caverns", "Purifying the Shrine"];
    return {
      id: Date.now() + idSuffix,
      name: randomPick(hardNames),
      difficulty: "Hard",
      staminaCost: 50,
      durationLabel: "45m",
      durationStr: "45m 0s",
      description: "A task that requires immense effort and bravery.",
      rewardNormal: randomVariance(Math.floor(baseReward * 8), 0.2),
      rewardSpec: randomVariance(level + 2, 0.2)
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
          } catch(e) {}
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
          rewardSpec: quest.rewardSpec
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
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center justify-start pt-4 pb-8 h-[85vh]">
        
        {/* Main Split Container */}
        <div className="w-full h-full flex flex-col md:flex-row rounded-3xl border-4 border-stone-800 shadow-2xl overflow-hidden bg-black">
          
          {/* Left Side: Shaman Background */}
          <div className="relative flex-1 bg-cover bg-center min-h-[300px]" style={{ backgroundImage: "url('/src/assets/design/backgrounds/station_background/trimal_shaman_station_background.png')" }}>
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/80 pointer-events-none" />
            
            <div className="absolute top-6 left-6 md:top-8 md:left-10">
              <h1 className="text-4xl md:text-5xl font-black text-amber-500 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
                Shaman's Hut
              </h1>
              <p className="text-stone-300 mt-2 font-bold tracking-wider text-sm md:text-base drop-shadow-[0_0_10px_rgba(0,0,0,1)] max-w-md hidden md:block">
                Seek the wisdom of the spirits and undertake dangerous quests for great rewards.
              </p>
            </div>

            {/* Stamina Display specifically for Shaman */}
            {stamina && (
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-10 flex flex-col items-start gap-4">
                <div className="bg-stone-900/90 p-5 rounded-2xl border-2 border-teal-900/80 backdrop-blur-md min-w-[220px] shadow-[0_0_30px_rgba(20,184,166,0.15)]">
                   <span className="text-teal-400 font-black text-sm uppercase tracking-widest drop-shadow-md block mb-3 border-b border-stone-700 pb-2">Shamanic Energy (Stamina)</span>
                   <div className="w-full bg-stone-950 rounded-full h-5 border-2 border-stone-700 overflow-hidden relative shadow-inner">
                     <div 
                       className="bg-gradient-to-r from-teal-700 to-teal-400 h-full transition-all shadow-[0_0_10px_rgba(45,212,191,0.5)]" 
                       style={{ width: `${(stamina.current / stamina.max) * 100}%` }} 
                     />
                   </div>
                   <div className="flex justify-between items-center mt-2">
                     <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">Resets daily</span>
                     <span className="text-stone-300 text-sm font-black tabular-nums">{stamina.current} / {stamina.max}</span>
                   </div>
                </div>
                
                <button 
                  onClick={handleRestoreStamina}
                  className="px-4 py-2 bg-purple-900/40 border border-purple-500/50 hover:bg-purple-900/80 transition-all text-purple-300 rounded-lg text-xs font-bold tracking-widest uppercase shadow-md"
                >
                  [DEV] Restore Stamina
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Quest Carousel Panel */}
          <div className="relative w-full md:w-[450px] lg:w-[500px] bg-stone-950/95 backdrop-blur-3xl border-l-[3px] border-amber-900/30 p-8 flex flex-col shrink-0">
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
                      <div className="flex justify-between items-start">
                        <span className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-[0.2em] shadow-md
                          ${currentQuest.difficulty === 'Easy' ? 'bg-green-950/80 text-green-400 border border-green-800' : 
                            currentQuest.difficulty === 'Medium' ? 'bg-amber-950/80 text-amber-400 border border-amber-800' : 
                            'bg-red-950/80 text-red-400 border border-red-800'}`}
                        >
                          {currentQuest.difficulty} rating
                        </span>
                      </div>
                      <h3 className="text-2xl font-black tracking-wide text-amber-100 uppercase mt-2">{currentQuest.name}</h3>
                    </div>
                    
                    <p className="text-sm text-stone-400 relative z-10 leading-relaxed font-medium">
                      {currentQuest.description}
                    </p>
                    
                    <div className="flex flex-col gap-4 relative z-10 mt-auto bg-black/40 p-5 rounded-2xl border border-stone-800">
                      <div className="flex justify-between items-center text-sm font-bold border-b border-stone-800 pb-3">
                         <div className="flex items-center gap-2 text-teal-400">
                           <span title="Stamina Cost">⚡ Stamina: {currentQuest.staminaCost}</span>
                         </div>
                         <div className="flex items-center gap-2 text-stone-300">
                           <span title="Duration">⏳ {currentQuest.durationLabel}</span>
                         </div>
                      </div>

                      <div className="flex justify-between items-center text-sm font-bold pt-1">
                        <span className="text-stone-500 uppercase tracking-widest text-[10px]">Rewards</span>
                        <div className="flex gap-4 items-center">
                           <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1.5 rounded-lg border border-stone-700">
                             <img src="/src/assets/design/currency/currency-normal.png" alt="Gold" className="w-4 h-4" />
                             <span className="text-amber-300 font-black">{currentQuest.rewardNormal}</span>
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
    </GameLayout>
  );
};

export default ShamanStation;
