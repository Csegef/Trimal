// src/pages/CaveStation.jsx
import React, { useEffect, useState, useCallback } from "react";
import GameLayout from "../layouts/GameLayout";
import { useNavigate } from "react-router-dom";
import { RARITY_COLOR } from "../models/Item";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../api/inventoryApi";

const CaveStation = () => {
  const [entities, setEntities] = useState({ enemies: [], weapons: [], armors: [], foods: [] });
  const [currency, setCurrency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    try {
      const [entRes, invRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/entities`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/inventory`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      if (entRes.success) setEntities(entRes.data);
      if (invRes.success && invRes.data?.currency) setCurrency(invRes.data.currency);
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

  const CATEGORIES = ["enemy", "weapon", "armor", "other stuff"];

  return (
    <GameLayout
      currency={currency}
      customBg="/src/assets/design/backgrounds/station_background/trimal_cave_station_background.png"
      bgOpacity={category ? 20 : 0}
    >
      <div
        className={`relative z-10 w-full h-[85vh] flex flex-col overflow-hidden rounded-3xl transition-all duration-500 ${category ? 'border-2 border-stone-800/50 shadow-2xl backdrop-blur-sm' : ''}`}
        style={{ backgroundColor: category ? 'rgba(0,0,0,0.1)' : 'transparent' }}
      >

        {/* Main Viewer Area */}
        <div className="grow relative flex flex-col overflow-hidden">

          {category && (
            <div className="absolute top-6 right-6 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-stone-400 uppercase tracking-widest z-10">
              Viewing {category} {index + 1} / {currentList.length}
            </div>
          )}

          <div className="grow flex items-center justify-center p-8 relative">
            {!category ? null : loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                <span className="text-amber-500 font-black tracking-widest text-[10px] uppercase">Locating Signal...</span>
              </div>
            ) : currentEntity ? (
              <div className="w-full h-full flex flex-col md:flex-row items-center justify-around gap-8">

                {/* Hero Section: Item Display */}
                <div className="relative">
                  <button onClick={handlePrev} className="absolute -left-20 top-1/2 -translate-y-1/2 text-6xl text-white/40 hover:text-amber-500 transition-all font-light z-30">&lsaquo;</button>
                  <button onClick={handleNext} className="absolute -right-20 top-1/2 -translate-y-1/2 text-6xl text-white/40 hover:text-amber-500 transition-all font-light z-30">&rsaquo;</button>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentEntity.name + category}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <img
                        src={resolvePath(currentEntity)}
                        alt={currentEntity.name}
                        className="w-72 h-72 md:w-[28rem] md:h-[28rem] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                        onError={(e) => { e.target.style.opacity = "0"; }}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Detail Card */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="w-full max-w-md p-8 rounded-[2.5rem] bg-stone-950/40 border-t border-l border-white/5 shadow-[20px_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
                >
                  <header className="mb-6 flex flex-col gap-2">
                    <span
                      className="text-[9px] font-black uppercase tracking-[0.3em]"
                      style={{ color: RARITY_COLOR[(currentEntity.rarity || "common").toLowerCase()] || "#a8a29e" }}
                    >
                      {currentEntity.rarity || currentEntity.category} • {category === "other stuff" ? ((currentEntity.iconPath || "").match(/^([a-z]+)-[sml]\.png$/i)?.[1] || "item") : (currentEntity.type || "Historical")}
                    </span>
                    <h2 className="text-3xl font-black text-stone-100 tracking-wider uppercase leading-none">
                      {currentEntity.name}
                    </h2>
                  </header>

                  <p className="text-stone-300 text-sm leading-relaxed font-medium mb-8">
                    {currentEntity.description || (
                      category === "enemy"
                        ? "Fragmented biometric data suggests a formidable predator from the deep-earth strata."
                        : "Analyzed material properties indicate high survival utility in hostile environments."
                    )}
                  </p>

                  <div className="flex gap-2 h-1 overflow-hidden rounded-full bg-white/5">
                    {currentList.map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 transition-all duration-500 ${i === index ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-transparent'}`}
                      />
                    ))}
                  </div>
                </motion.div>

              </div>
            ) : null}
          </div>
        </div>

        {/* Floating Buttons — no background, no border, just the pills */}
        <div className="shrink-0 flex items-center justify-center gap-3 pb-5 pt-1">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            return (
              <motion.button
                key={cat}
                onClick={() => { setCategory(cat); setIndex(0); }}
                animate={isActive
                  ? { y: -4, backgroundColor: 'rgba(251,191,36,0.18)', color: '#FBBF24' }
                  : { y: 0, backgroundColor: 'rgba(0,0,0,0.35)', color: '#78716c' }
                }
                whileHover={!isActive ? { y: -2, backgroundColor: 'rgba(0,0,0,0.5)', color: '#d6d3d1' } : {}}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                style={{
                  boxShadow: isActive
                    ? '0 6px 20px rgba(251,191,36,0.2), 0 2px 6px rgba(0,0,0,0.5)'
                    : '0 2px 8px rgba(0,0,0,0.4)',
                  outline: 'none',
                  border: 'none',
                }}
                className="px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px]"
              >
                {cat}
              </motion.button>
            );
          })}
        </div>

      </div>
    </GameLayout>
  );
};

export default CaveStation;