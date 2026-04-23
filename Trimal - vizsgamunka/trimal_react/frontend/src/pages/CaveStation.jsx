// src/pages/CaveStation.jsx
import React, { useEffect, useState, useCallback } from "react";
import GameLayout from "../layouts/GameLayout";
import { useNavigate } from "react-router-dom";
import { RARITY_COLOR } from "../models/Item";
import { motion, AnimatePresence } from "framer-motion";

const CaveStation = () => {
  const [entities, setEntities] = useState({ enemies: [], weapons: [], armors: [], foods: [] });
  const [currency, setCurrency] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    try {
      const [entRes, invRes] = await Promise.all([
        fetch("/api/entities", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/inventory", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      if (entRes.success) setEntities(entRes.data);
      if (invRes.success) {
        if (invRes.data?.currency) setCurrency(invRes.data.currency);
        if (invRes.data?.achievements) setAchievements(invRes.data.achievements);
      }
    } catch (err) {
      console.error("Load error:", err);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const getCurrentList = () => {
    if (!category) return [];
    let list = [];
    if (category === "enemy") list = entities.enemies;
    else if (category === "weapon") list = entities.weapons;
    else if (category === "armor") list = entities.armors;
    else if (category === "other stuff") list = entities.foods;

    if (category === "enemy") {
      const order = { Light: 0, Medium: 1, Heavy: 2 };
      return [...list].sort((a, b) => (order[a.category] || 0) - (order[b.category] || 0));
    } else if (category === "other stuff") {
      const statOrder = { agility: 0, strength: 1, health: 2, luck: 3, resistance: 4 };
      const sizeOrder = { s: 0, m: 1, l: 2 };
      const parse = (iconPath = "") => {
        const match = iconPath.toLowerCase().match(/^([a-z]+)-([sml])\.png$/);
        return match
          ? { stat: statOrder[match[1]] ?? 99, size: sizeOrder[match[2]] ?? 99 }
          : { stat: 99, size: 99 };
      };
      return [...list].sort((a, b) => {
        const pa = parse(a.iconPath), pb = parse(b.iconPath);
        return pa.stat !== pb.stat ? pa.stat - pb.stat : pa.size - pb.size;
      });
    } else {
      const order = { Common: 0, Rare: 1, Epic: 2, Legendary: 3, common: 0, rare: 1, epic: 2, legendary: 3 };
      return [...list].sort((a, b) => (order[a.rarity] || 0) - (order[b.rarity] || 0));
    }
  };

  const currentList = getCurrentList();
  const currentEntity = currentList[index];

  const handleNext = () => setIndex((i) => (i + 1) % currentList.length);
  const handlePrev = () => setIndex((i) => (i - 1 + currentList.length) % currentList.length);

  const resolvePath = (item) => {
    if (!item) return "";
    if (category === "enemy") return `/src/assets/design/covers/enemy_covers/final_imgs/${item.iconPath}`;
    if (category === "weapon") return `/src/assets/design/items/weapon/${item.rarity}/${item.iconPath}`;
    if (category === "armor") return `/src/assets/design/items/armor/${item.rarity}/${item.iconPath}`;
    if (category === "other stuff") return `/src/assets/design/items/food/${item.category}/${item.iconPath}`;
    return "";
  };

  const CATEGORIES = ["enemy", "weapon", "armor", "other stuff", "achievements"];

  const REWARDS = {
    1: { norm: 500, spec: 10 },
    2: { norm: 1000, spec: 20 },
    3: { norm: 1000, spec: 20 },
    4: { norm: 800, spec: 15 },
    5: { norm: 300, spec: 5 },
    6: { norm: 400, spec: 10 },
    7: { norm: 1000, spec: 10 },
    8: { norm: 200, spec: 2 },
    9: { norm: 600, spec: 15 },
    10: { norm: 500, spec: 5 }
  };

  const handleClaimReward = async (achId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("/api/inventory/achievements/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ achId })
      });
      const data = await res.json();
      if (data.success) {
        setCurrency(data.currency);
        setAchievements(prev => ({ ...prev, claimedRewards: data.claimedRewards }));
      } else {
        alert(data.message || 'Error claiming reward');
      }
    } catch (err) {
      console.error("Claim error:", err);
    }
  };

  const renderAchievements = () => {
    if (!achievements) return <div className="flex-[2] bg-black/60 border border-stone-700/50 rounded-2xl flex items-center justify-center text-stone-500 uppercase tracking-widest text-sm backdrop-blur-sm">No data available</div>;

    // Total numbers based on entities
    const totalEnemies = entities.enemies.length || 1;
    const totalWeapons = entities.weapons.length || 1;
    const totalArmors = entities.armors.length || 1;
    const totalFoods = entities.foods.length || 1;

    const achs = [
      { id: 1, title: 'Beastmaster', desc: 'Encounter all beasts', curr: achievements.enemiesEnc?.length || 0, max: totalEnemies },
      { id: 2, title: 'Armory Master', desc: 'Gain all weapons', curr: achievements.weaponsEnc?.length || 0, max: totalWeapons },
      { id: 3, title: 'Ironclad', desc: 'Gain all armors', curr: achievements.armorsEnc?.length || 0, max: totalArmors },
      { id: 4, title: 'Collector', desc: 'Gain all misc & foods', curr: achievements.foodsEnc?.length || 0, max: totalFoods },
      { id: 5, title: 'Eagle Eye', desc: 'Consecutive crits', curr: achievements.maxCrits || 0, max: 2 },
      { id: 6, title: 'Flawless Hunter', desc: 'Win without taking damage', curr: achievements.flawlessWins || 0, max: 10 },
      { id: 7, title: 'Big Spender', desc: 'Spend normal currency', curr: achievements.spentNormal || 0, max: 5000 },
      { id: 8, title: 'What Doesn\'t Kill You...', desc: 'Suffer defeat', curr: achievements.deaths || 0, max: 5 },
      { id: 9, title: 'Mythic Finder', desc: 'Find a Legendary item', curr: achievements.foundLegendary ? 1 : 0, max: 1 },
      { id: 10, title: 'Hoarder', desc: 'Fill inventory to maximum', curr: achievements.hoarderAchieved ? 1 : 0, max: 1 }
    ];

    return (
      <div className="flex-[2] bg-black/60 border border-stone-700/50 rounded-2xl flex flex-col backdrop-blur-sm shadow-2xl overflow-y-auto p-6 md:p-10 scrollbar-thin scrollbar-thumb-amber-900/50 relative" style={{ animation: 'caveCardIn 0.22s ease both' }}>
        <div className="flex flex-col gap-5">
          {achs.map(a => {
            const progress = Math.min(100, Math.round((a.curr / a.max) * 100));
            const isDone = a.curr >= a.max;
            const isClaimed = achievements.claimedRewards?.includes(a.id);
            const reward = REWARDS[a.id];

            return (
              <div key={a.title} className={`p-5 rounded-xl border ${isDone ? 'bg-amber-900/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-black/50 border-stone-800 hover:border-stone-700'} transition-colors`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className={`text-lg uppercase tracking-wider ${isDone ? 'text-amber-400' : 'text-stone-300'}`}>{a.title}</h3>
                    <p className="text-stone-500 text-[10px] sm:text-xs tracking-widest uppercase">{a.desc}</p>
                    <p className="text-amber-700 text-[10px] sm:text-xs tracking-widest uppercase mt-1">Reward: {reward.norm} pebbles, {reward.spec} Little clams</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`text-sm tabular-nums tracking-widest ${isDone ? 'text-amber-500' : 'text-stone-400'}`}>
                      {a.curr} / {a.max}
                    </div>
                    {isDone && !isClaimed && (
                      <button
                        onClick={() => handleClaimReward(a.id)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded transition-colors"
                      >
                        Claim
                      </button>
                    )}
                    {isClaimed && (
                      <span className="text-amber-700/60 text-[10px] font-black uppercase tracking-widest">
                        Claimed
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden border border-stone-700/30">
                  <div className={`h-full transition-all duration-1000 ${isDone ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-amber-700/50'}`} style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  return (
    <GameLayout
      currency={currency}
      customBg="/src/assets/design/backgrounds/station_background/trimal_cave_station_background.png"
      bgOpacity={category ? 20 : 0}
    >
      <div className="flex flex-col md:flex-row w-full h-[90vh] gap-6 p-4 md:p-8">

        {/* Left panel: Category selector + navigation */}
        <div className="w-full md:w-[300px] shrink-0 bg-black/60 border border-amber-900/40 rounded-2xl flex flex-col backdrop-blur-sm overflow-hidden shadow-2xl">
          <div className="bg-amber-900/60 p-3 shadow-md border-b border-amber-800 text-amber-100 tracking-widest uppercase text-sm font-black text-center flex justify-center items-center">
            <span>Ancient Book</span>
          </div>

          {/* Category buttons */}
          <div className="flex flex-col gap-1 p-3">
            {CATEGORIES.map((cat) => {
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setIndex(0); }}
                  className={`w-full px-4 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] text-left transition-all border ${isActive
                    ? 'bg-amber-800/60 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-black/40 border-stone-800 text-stone-500 hover:bg-amber-900/30 hover:border-amber-700'
                    }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Item navigation (only when category active and NOT achievements) */}
          {category && category !== "achievements" && currentList.length > 0 && (
            <div className="mt-auto p-3 border-t border-amber-900/40 bg-black/40">
              <div className="text-center text-stone-500 text-[10px] uppercase tracking-widest mb-2 font-bold">
                {index + 1} / {currentList.length}
              </div>
              {/* Progress dots */}
              <div className="flex gap-1 justify-center mb-3">
                {currentList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`rounded-full transition-all duration-300 ${i === index ? 'w-5 h-2 bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'w-2 h-2 bg-stone-700 hover:bg-amber-700'}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  className="flex-1 py-2 bg-black/50 hover:bg-amber-900/40 border border-stone-800 hover:border-amber-700 text-stone-400 hover:text-amber-400 rounded-lg text-lg font-black transition-all"
                >
                  ‹
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-2 bg-black/50 hover:bg-amber-900/40 border border-stone-800 hover:border-amber-700 text-stone-400 hover:text-amber-400 rounded-lg text-lg font-black transition-all"
                >
                  ›
                </button>
              </div>
            </div>
          )}

          {!category && (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-stone-600 text-xs text-center uppercase tracking-widest font-bold leading-relaxed">
                Select a category to explore
              </p>
            </div>
          )}
        </div>

        {/* Right panel: Item detail */}
        {category && currentEntity ? (
          <div
            key={category}
            className="flex-[2] bg-black/60 border border-stone-700/50 rounded-2xl flex flex-col md:flex-row items-center backdrop-blur-sm shadow-2xl overflow-hidden relative"
            style={{ animation: 'caveCardIn 0.22s ease both' }}
          >
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Image section */}
            <div className="flex-1 flex items-center justify-center p-8 min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentEntity.name + category}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-center"
                >
                  <img
                    src={resolvePath(currentEntity)}
                    alt={currentEntity.name}
                    className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
                    onError={(e) => { e.target.style.opacity = '0'; }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Detail section */}
            <div className="w-full md:w-[340px] shrink-0 p-6 md:p-8 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-stone-800/60">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentEntity.name + category + 'text'}
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-4 flex-1"
                >
                  <header className="flex flex-col gap-2">
                    <span
                      className="text-[9px] font-black uppercase tracking-[0.3em]"
                      style={{ color: RARITY_COLOR[(currentEntity.rarity || 'common').toLowerCase()] || '#a8a29e' }}
                    >
                      {currentEntity.rarity || currentEntity.category} • {category === 'other stuff'
                        ? ((currentEntity.iconPath || '').match(/^([a-z]+)-[sml]\.png$/i)?.[1] || 'item')
                        : (currentEntity.type || 'Historical')}
                    </span>
                    <h2 className="text-3xl text-stone-100 tracking-wider uppercase leading-none">
                      {currentEntity.name}
                    </h2>
                  </header>

                  <p className="text-stone-300 text-base leading-relaxed font-medium">
                    {currentEntity.description || (
                      category === 'enemy'
                        ? 'A formidable creature lurking in the deep-earth strata.'
                        : 'Analyzed material properties indicate high survival utility.'
                    )}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Rarity bar */}
              <div className="flex gap-1.5 h-1 rounded-full overflow-hidden bg-white/5">
                {currentList.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 transition-all duration-500 ${i === index ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-transparent'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : category === "achievements" ? (
          renderAchievements()
        ) : category && !currentEntity && category !== "achievements" ? (
          <div className="flex-[2] bg-black/40 border border-stone-800/40 rounded-2xl flex items-center justify-center text-stone-600 text-sm uppercase tracking-widest font-bold backdrop-blur-sm">
            No entries found
          </div>
        ) : (
          <div className="flex-[2] pointer-events-none" />
        )}

      </div>
      <style>{`
        @keyframes caveCardIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </GameLayout>
  );
};

export default CaveStation;

