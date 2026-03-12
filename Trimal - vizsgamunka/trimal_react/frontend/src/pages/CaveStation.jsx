// src/pages/CaveStation.jsx
import React, { useEffect, useState, useCallback } from "react";
import GameLayout from "../layouts/GameLayout";
import { useNavigate } from "react-router-dom";
import { RARITY_COLOR } from "../models/Item";

const CaveStation = () => {
  const [entities, setEntities] = useState({ enemies: [], weapons: [], armors: [], foods: [] });
  const [currency, setCurrency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("enemy");
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
      if (invRes.success && invRes.data?.currency) setCurrency(invRes.data.currency);
    } catch (err) {
      console.error("Load error:", err);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const getCurrentList = () => {
    let list = [];
    if (category === "enemy") list = entities.enemies;
    else if (category === "weapon") list = entities.weapons;
    else if (category === "armor") list = entities.armors;
    else if (category === "other stuff") list = entities.foods.filter(f => f.rarity?.toLowerCase() !== 'common');

    if (category === "enemy") {
      const order = { Light: 0, Medium: 1, Heavy: 2 };
      return [...list].sort((a, b) => (order[a.category] || 0) - (order[b.category] || 0));
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
    <GameLayout currency={currency}>
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">

        {/* Header */}
        <div className="border-b border-stone-800/70 pb-3">
          <h1 className="text-3xl font-bold tracking-widest text-[#FBBF24] uppercase drop-shadow-md">
            Mysterious Cave
          </h1>
          <p className="text-stone-400 text-sm mt-1">Ancient records of beasts and artifacts.</p>
        </div>

        {/* Main layout: tabs left | map-like cave frame right */}
        <div className="flex gap-4 items-stretch" style={{ height: "75vh" }}>

          {/* Left: Category Tabs */}
          <div
            className="flex flex-col gap-2 p-3 rounded-2xl border border-stone-700/60 shadow-2xl flex-none"
            style={{ background: "rgba(8,4,1,0.80)", backdropFilter: "blur(8px)" }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setIndex(0); }}
                className={`w-36 px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all border-2 ${category === cat
                    ? "bg-amber-800 border-amber-600 text-amber-100"
                    : "bg-stone-900/50 border-stone-700/60 text-stone-500 hover:text-stone-300 hover:border-stone-600"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Right: Map-like cave frame — cave bg fills this, content overlaid */}
          <div
            className="relative flex-1 rounded-2xl border-4 border-stone-700/80 shadow-2xl overflow-hidden"
            style={{
              backgroundImage: "url('/backgrounds/trimal_cave_station_background.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="px-8 py-4 rounded-2xl text-amber-600/90 animate-pulse tracking-widest text-xl font-bold"
                  style={{ background: "rgba(8,4,1,0.75)", backdropFilter: "blur(6px)" }}
                >
                  Browsing the ancient records...
                </div>
              </div>
            ) : currentEntity ? (
              /* Entity content — semi-transparent panel overlaid on the cave bg */
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div
                  className="w-full max-w-3xl rounded-2xl border border-stone-600/40 shadow-2xl overflow-hidden flex"
                  style={{ background: "rgba(8,4,1,0.72)", backdropFilter: "blur(6px)", minHeight: "320px" }}
                >
                  {/* Left: Image + pagination */}
                  <div className="flex-none w-64 flex flex-col items-center justify-center p-6 border-r border-stone-700/40">
                    <img
                      src={resolvePath(currentEntity)}
                      alt={currentEntity.name}
                      className="w-48 h-48 object-contain"
                      style={{ filter: "drop-shadow(0 0 16px rgba(180,120,40,0.3))" }}
                      onError={(e) => { e.target.style.opacity = "0"; }}
                    />
                    <div className="flex items-center gap-4 mt-5">
                      <button onClick={handlePrev} className="p-2 rounded-full hover:bg-stone-700/40 transition-colors text-xl text-amber-600 hover:text-amber-400">❮</button>
                      <span className="text-stone-400 text-sm font-bold tabular-nums">{index + 1} / {currentList.length}</span>
                      <button onClick={handleNext} className="p-2 rounded-full hover:bg-stone-700/40 transition-colors text-xl text-amber-600 hover:text-amber-400">❯</button>
                    </div>
                  </div>

                  {/* Right: Name + Rarity/Category + Description */}
                  <div className="flex-1 flex flex-col p-8 gap-4">
                    <h2 className="text-2xl font-black tracking-widest text-amber-300 uppercase border-b border-stone-700/40 pb-3">
                      {currentEntity.name}
                    </h2>

                    {category === "enemy" ? (
                      <span className="self-start px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-stone-800/60 text-stone-300 border border-stone-700/60">
                        {currentEntity.category} — {currentEntity.type}
                      </span>
                    ) : (
                      <span
                        className="self-start px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border"
                        style={{
                          color: RARITY_COLOR[(currentEntity.rarity || "common").toLowerCase()] || "#a8a29e",
                          borderColor: (RARITY_COLOR[(currentEntity.rarity || "common").toLowerCase()] || "#a8a29e") + "55",
                          background: (RARITY_COLOR[(currentEntity.rarity || "common").toLowerCase()] || "#a8a29e") + "18",
                        }}
                      >
                        {currentEntity.rarity}
                      </span>
                    )}

                    <p className="text-stone-300 text-sm leading-relaxed">
                      {currentEntity.description || (
                        category === "enemy"
                          ? `An ancient ${currentEntity.category?.toLowerCase()} creature of the prehistoric world.`
                          : "A rare artifact found in the depths of the ancient world."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="px-8 py-4 rounded-2xl text-stone-500 text-lg italic"
                  style={{ background: "rgba(8,4,1,0.72)", backdropFilter: "blur(6px)" }}
                >
                  No records found.
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </GameLayout>
  );
};

export default CaveStation;
