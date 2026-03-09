// src/pages/CaveStation.jsx
import React, { useEffect, useState, useCallback } from "react";
import GameLayout from "../layouts/GameLayout";
import { useNavigate } from "react-router-dom";
import { RARITY_COLOR } from "../models/Item";

const CaveStation = () => {
  const [entities, setEntities] = useState({ enemies: [], weapons: [], armors: [], foods: [] });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("enemy"); // enemy, weapon, armor, food
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/entities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setEntities(data.data);
      }
    } catch (err) {
      console.error("Load error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCurrentList = () => {
    let list = [];
    if (category === "enemy") list = entities.enemies;
    else if (category === "weapon") list = entities.weapons;
    else if (category === "armor") list = entities.armors;
    else if (category === "food") list = entities.foods;

    // Sorting
    if (category === "enemy") {
      const order = { Light: 0, Medium: 1, Heavy: 2 };
      return [...list].sort((a, b) => order[a.category] - order[b.category]);
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
    const type = category === "enemy" ? "covers" : item.category?.toLowerCase() === "armor" ? "armor" : item.type || (category === "weapon" ? "weapon" : category === "food" ? "food" : "misc");
    // This is a simplified path resolver, matching how other components do it
    if (category === "enemy") return `/src/assets/design/covers/enemy_covers/final_imgs/${item.iconPath}`;
    if (category === "weapon") return `/src/assets/design/items/weapon/${item.rarity}/${item.iconPath}`;
    if (category === "armor") return `/src/assets/design/items/armor/${item.rarity}/${item.iconPath}`;
    if (category === "food") return `/src/assets/design/items/food/${item.category}/${item.iconPath}`;
    return "";
  };

  return (
    <GameLayout>
      {/* Background Book */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/backgrounds/trimal_cave_station_background.png')" }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
        {/* Navigation Tabs (Labels above the book) */}
        <div className="flex gap-4 mb-2">
          {["enemy", "weapon", "armor", "food"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setIndex(0);
              }}
              className={`px-6 py-2 rounded-t-xl font-bold uppercase tracking-widest text-sm transition-all shadow-lg border-2 border-b-0 ${category === cat
                ? "bg-amber-800 border-amber-600 text-amber-100 scale-110"
                : "bg-stone-900/80 border-stone-700 text-stone-500 hover:text-stone-300"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* The Book Content Container */}
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] flex items-center justify-center p-12">
          {loading ? (
            <div className="text-amber-600 animate-pulse tracking-widest text-2xl font-serif italic">Browsing the ancient records...</div>
          ) : currentEntity ? (
            <div className="flex w-full h-full gap-8">
              {/* Left Page: Illustration */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl border border-black/10 shadow-inner">
                <div className="relative group">
                  <img
                    src={resolvePath(currentEntity)}
                    alt={currentEntity.name}
                    className="w-64 h-64 object-contain filter sepia(0.6) contrast(1.2) drop-shadow-[0_0_15px_rgba(0,0,0,0.4)]"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                  {/* Hand-drawn effect overlay */}
                  <div className="absolute inset-0 border-2 border-black/5 rounded-lg pointer-events-none" />
                </div>
                <h3 className="mt-8 text-3xl font-serif font-black text-stone-800/80 tracking-tight uppercase border-b-2 border-stone-800/20 px-4">
                  {currentEntity.name}
                </h3>
              </div>

              {/* Right Page: Description and Stats */}
              <div className="flex-1 flex flex-col p-8 bg-black/5 rounded-3xl border border-black/5 font-serif text-stone-900/80">
                <div className="flex-grow">
                  <div className="flex justify-between items-baseline mb-4">
                    <span className="text-xl font-bold italic text-stone-700">
                      {category === "enemy" ? currentEntity.category : currentEntity.rarity}
                    </span>
                  </div>

                  <p className="text-lg leading-relaxed italic mb-8 first-letter:text-4xl first-letter:font-bold first-letter:mr-1 first-letter:float-left">
                    {currentEntity.description || (category === "enemy" ? `An ancient creature of the ${currentEntity.category} category. It is a ${currentEntity.type} type predator.` : "A rare item found in the depths of the prehistoric world.")}
                  </p>

                  {/* Stats List */}
                  <div className="grid grid-cols-2 gap-4 border-t border-stone-800/10 pt-6">
                    {category === "enemy" ? (
                      <>
                        <StatRow label="Health" value={currentEntity.base_health} />
                        <StatRow label="Strength" value={currentEntity.base_strength} />
                        <StatRow label="Agility" value={currentEntity.base_agility} />
                        <StatRow label="Luck" value={currentEntity.base_luck} />
                      </>
                    ) : (
                      <>
                        {currentEntity.base_damage && <StatRow label="Base Damage" value={currentEntity.base_damage} />}
                        {currentEntity.armor_point && <StatRow label="Armor Point" value={currentEntity.armor_point} />}
                        {currentEntity.inventory_size && <StatRow label="Weight" value={currentEntity.inventory_size} />}
                      </>
                    )}
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between mt-8">
                  <button onClick={handlePrev} className="p-2 hover:bg-stone-800/10 rounded-full transition-colors text-2xl">❮</button>
                  <span className="text-sm font-bold opacity-40 self-center">{index + 1} / {currentList.length}</span>
                  <button onClick={handleNext} className="p-2 hover:bg-stone-800/10 rounded-full transition-colors text-2xl">❯</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-stone-800/40 text-xl font-serif">No records found.</div>
          )}
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate("/maingame")}
          className="mt-8 px-10 py-3 bg-stone-900/90 border-2 border-amber-900/60 text-amber-500 font-bold rounded-xl hover:bg-stone-800 transition-all uppercase tracking-widest text-sm shadow-2xl"
        >
          Leave Cave
        </button>
      </div>

      <style>{`
        .mix-blend-multiply { mix-blend-mode: multiply; }
      `}</style>
    </GameLayout>
  );
};

const StatRow = ({ label, value }) => (
  <div className="flex justify-between border-b border-black/5 pb-1">
    <span className="font-bold text-xs uppercase opacity-60 tracking-widest">{label}</span>
    <span className="font-black text-stone-800">{value}</span>
  </div>
);

export default CaveStation;
