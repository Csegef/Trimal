import React, { useState, useEffect } from 'react';
import GameLayout from '../layouts/GameLayout';
import PlayerPortrait from '../components/PlayerPortrait';
import { useNavigate } from 'react-router-dom';
import { resolveItemImagePath, getItemIcon, RARITY_COLOR, RARITY_GLOW } from '../models/Item';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/');

            try {
                const res = await fetch('/api/arena/leaderboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setPlayers(data.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [navigate]);

    const handleFight = async () => {
        if (!selectedPlayer) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/arena/fight', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ targetSpecieId: selectedPlayer.specieId })
            });
            const data = await res.json();
            if (data.success) {
                navigate('/fight');
            } else {
                alert(data.message || 'Hiba történt!');
            }
        } catch (e) {
            console.error(e);
            alert('Hiba történt a csata indításakor.');
        }
    };

    if (loading) {
        return (
            <GameLayout customBg="/src/assets/design/backgrounds/station_background/trimal_cave_station_leaderboard_background.png" fullBleed={true}>
                <div className="flex justify-center items-center h-[80vh] text-amber-500 font-bold text-2xl animate-pulse uppercase">
                    Loading Leaderboard...
                </div>
            </GameLayout>
        );
    }

    return (
        <GameLayout customBg="/src/assets/design/backgrounds/station_background/trimal_cave_station_leaderboard_background.png" fullBleed={true}>
            <div className="flex flex-col md:flex-row w-full h-[90vh] gap-6 p-4 md:p-8">

                {/* Left side: Players List */}
                <div className="w-full md:w-[300px] shrink-0 bg-black/60 border border-amber-900/40 rounded-2xl flex flex-col backdrop-blur-sm overflow-hidden shadow-2xl">
                    <div className="bg-amber-900/60 p-3 shadow-md border-b border-amber-800 flex justify-between items-center text-amber-100 tracking-widest uppercase">
                        <span>Rankings</span>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-hide py-2" style={{ scrollbarWidth: 'none' }}>
                        {players.map((p, idx) => (
                            <div
                                key={p.specieId}
                                onClick={() => setSelectedPlayer(p)}
                                className={`flex items-center gap-4 px-4 py-3 mx-2 my-1 rounded-xl cursor-pointer transition-all border ${selectedPlayer?.specieId === p.specieId
                                    ? 'bg-amber-800/60 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                    : 'bg-black/40 border-stone-800 hover:bg-amber-900/30 hover:border-amber-700'
                                    }`}
                            >
                                <div className="text-xl font-black text-stone-500 w-8 text-center">#{idx + 1}</div>
                                <div className="flex-1 flex flex-col">
                                    <div className="text-amber-400 tracking-wider text-[15px]">{p.name}</div>
                                    <div className="text-stone-400 text-[11px] uppercase mt-0.5">LvL {p.lvl} • {p.class}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side: Selected Player Details */}
                {selectedPlayer && (
                    <div className="flex-[2] md:w-2/3 bg-black/70 border border-stone-700/50 rounded-2xl flex flex-col backdrop-blur-md shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

                        <div className="p-6 md:p-8 flex-1 flex flex-col items-center">
                            <h2 className="text-3xl text-stone-200 tracking-[0.2em] uppercase text-center mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
                                {selectedPlayer.name}
                            </h2>

                            {/* Center Avatar & Equipment */}
                            <div className="relative flex justify-center mb-6">
                                {/* Portrait */}
                                <div className="w-[240px] h-[240px] border-2 border-stone-700/50 rounded-2xl bg-black/40 shadow-[0_0_40px_rgba(0,0,0,0.6),inset_0_0_20px_rgba(0,0,0,0.4)] flex justify-center items-center">
                                    <div className="w-[210px] h-[210px] relative overflow-visible">
                                        <PlayerPortrait
                                            className={selectedPlayer.class}
                                            hairStyle={selectedPlayer.hairStyle}
                                            beardStyle={selectedPlayer.beardStyle}
                                        />
                                    </div>
                                </div>

                                {/* Equipment Slots (Floating) */}
                                <div className="absolute top-1/2 left-0 -translate-x-[70%] -translate-y-1/2 flex flex-col gap-3">
                                    <EquippedSlot item={selectedPlayer.equipped.armor_cap} type="armor_cap" />
                                    <EquippedSlot item={selectedPlayer.equipped.armor_plate} type="armor_plate" />
                                    <EquippedSlot item={selectedPlayer.equipped.armor_leggings} type="armor_leggings" />
                                </div>
                                <div className="absolute top-1/2 right-0 translate-x-[70%] -translate-y-1/2 flex flex-col gap-3">
                                    <EquippedSlot item={selectedPlayer.equipped.weapon} type="weapon" />
                                    <EquippedSlot item={selectedPlayer.equipped.armor_boots} type="armor_boots" />
                                </div>
                            </div>

                            {/* Stats Line */}
                            <div className="w-full max-w-md bg-stone-900/60 border border-stone-800 p-4 rounded-xl shadow-inner mt-4 flex flex-wrap justify-between gap-2 text-xs md:text-sm">
                                <div className="flex flex-col items-center flex-1 min-w-[60px]">
                                    <span className="text-stone-500 uppercase  text-[10px] tracking-widest">HP</span>
                                    <span className="text-green-400 font-bold">{(selectedPlayer.stats.health * 25) + (selectedPlayer.lvl * 50)}</span>
                                </div>
                                <div className="flex flex-col items-center flex-1 min-w-[60px]">
                                    <span className="text-stone-500 uppercase  text-[10px] tracking-widest">STR</span>
                                    <span className="text-stone-300 font-bold">{selectedPlayer.stats.strength}</span>
                                </div>
                                <div className="flex flex-col items-center flex-1 min-w-[60px]">
                                    <span className="text-stone-500 uppercase  text-[10px] tracking-widest">AGI</span>
                                    <span className="text-stone-300 font-bold">{selectedPlayer.stats.agility}</span>
                                </div>
                                <div className="flex flex-col items-center flex-1 min-w-[60px]">
                                    <span className="text-stone-500 uppercase  text-[10px] tracking-widest">LU</span>
                                    <span className="text-stone-300 font-bold">{selectedPlayer.stats.luck}</span>
                                </div>
                                <div className="flex flex-col items-center flex-1 min-w-[60px]">
                                    <span className="text-stone-500 uppercase  text-[10px] tracking-widest">RES</span>
                                    <span className="text-stone-300 font-bold">{selectedPlayer.stats.resistance}</span>
                                </div>
                                <div className="flex flex-col items-center flex-1 min-w-[60px]">
                                    <span className="text-stone-500 uppercase  text-[10px] tracking-widest">ARMOR</span>
                                    <span className="text-blue-300 font-bold">{selectedPlayer.stats.armor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Fight Button */}
                        <div className="bg-black/80 border-t border-amber-900/50 p-4 shrink-0 flex justify-center">
                            <button
                                onClick={handleFight}
                                className="px-16 py-3 bg-red-900/90 hover:bg-red-800 text-red-100  text-xl uppercase tracking-[0.2em] rounded-xl border border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                            >
                                FIGHT
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </GameLayout>
    );
};

// Mini internal component for item slots
function EquippedSlot({ item, type }) {
    if (!item) {
        return (
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg border border-stone-800/60 bg-black/60 flex items-center justify-center opacity-50 shadow-inner">
                {type === 'weapon' ? '' : ''}
            </div>
        );
    }
    const rarity = (item.rarity || 'common').toLowerCase();
    const imgPath = resolveItemImagePath(item);
    return (
        <div
            className="w-14 h-14 md:w-16 md:h-16 rounded-lg border-2 bg-stone-900/90 flex flex-col items-center justify-center shadow-lg relative group"
            style={{
                borderColor: RARITY_COLOR[rarity] || '#9ca3af',
                boxShadow: `0 0 10px ${RARITY_GLOW[rarity] || 'rgba(156,163,175,0.35)'}`
            }}
        >
            {imgPath ? (
                <img src={imgPath} className="w-10 h-10 md:w-12 md:h-12 object-contain" alt={item.name} />
            ) : (
                <span className="text-2xl">{getItemIcon(item)}</span>
            )}
            {/* Tooltip on hover */}
            <div className="absolute top-1/2 -translate-y-1/2 left-full ml-2 w-max bg-black/95 text-xs text-stone-200 p-2 rounded border border-stone-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                <span style={{ color: RARITY_COLOR[rarity] }} className="font-bold block mb-1">{item.name}</span>
                {item.type === 'weapon' && <span>Damage: {item.weapon_damage || item.base_damage}</span>}
                {item.type === 'armor' && <span>Armor: {item.armor_point}</span>}
            </div>
        </div>
    );
}

export default Leaderboard;
