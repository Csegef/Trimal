import React, { useState, useEffect } from 'react';
import GameLayout from '../layouts/GameLayout';
import PlayerPortrait from '../components/PlayerPortrait';
import { useNavigate } from 'react-router-dom';
import { resolveItemImagePath, getItemIcon, RARITY_COLOR, RARITY_GLOW } from '../models/Item';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [currency, setCurrency] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastPvpAt, setLastPvpAt] = useState(0);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/');

            try {
                const [invRes, lbRes] = await Promise.all([
                    fetch('/api/inventory', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
                    fetch('/api/arena/leaderboard', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
                ]);

                if (invRes.success && invRes.data?.currency) {
                    setCurrency(invRes.data.currency);
                    if (invRes.data.last_pvp_at) {
                        setLastPvpAt(invRes.data.last_pvp_at);
                    }
                }
                if (lbRes.success) {
                    setPlayers(lbRes.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [navigate]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (!lastPvpAt) return;
            const now = Math.floor(Date.now() / 1000);
            const cooldownSeconds = 12 * 60 * 60; // 12 hours
            const remaining = Math.max(0, (lastPvpAt + cooldownSeconds) - now);
            setCooldownRemaining(remaining);
        }, 1000);
        return () => clearInterval(timer);
    }, [lastPvpAt]);

    const formatCooldown = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h}H ${m}M ${s}S`;
    };

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
            <GameLayout currency={currency} customBg="/src/assets/design/backgrounds/station_background/trimal_cave_station_leaderboard_background.png" fullBleed={true}>
                <div className="flex justify-center items-center h-[80vh] text-amber-500 font-bold text-2xl animate-pulse uppercase">
                    Loading Leaderboard...
                </div>
            </GameLayout>
        );
    }

    return (
        <GameLayout currency={currency} customBg="/src/assets/design/backgrounds/station_background/trimal_cave_station_leaderboard_background.png" fullBleed={true}>
            <div className="flex flex-col md:flex-row w-full h-[90vh] gap-6 p-4 md:p-8">

                {/* Left side: Players List */}
                <div className="w-full md:w-1/4 flex-none flex-none shrink-0 bg-black/60 border border-amber-900/40 rounded-2xl flex flex-col backdrop-blur-sm overflow-hidden shadow-2xl min-h-[300px] md:min-h-0">
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
                    <div
                        key={selectedPlayer.specieId}
                        className="w-full md:flex-[2] bg-black/70 border border-stone-700/50 rounded-2xl flex flex-col backdrop-blur-md shadow-2xl relative overflow-hidden"
                        style={{ animation: 'lbCardIn 0.22s ease both' }}
                    >
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

                        {/* Header */}
                        <div className="px-5 pt-4 pb-3 border-b border-stone-800/60 shrink-0">
                            <h2 className="text-xl text-stone-200 tracking-[0.2em] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
                                {selectedPlayer.name}
                            </h2>
                            <p className="text-stone-500 text-[11px] uppercase tracking-widest mt-0.5">
                                Level {selectedPlayer.lvl} · {selectedPlayer.class}
                            </p>
                        </div>

                        {/* Body: Portrait + Equip + Stats side by side */}
                        <div className="flex-1 flex flex-row justify-center items-center gap-6 md:gap-10 px-8 py-6 min-h-0 overflow-hidden">

                            {/* Left equip column */}
                            <div className="flex flex-col justify-center gap-4 shrink-0 relative z-20">
                                <EquippedSlot item={selectedPlayer.equipped.armor_cap} type="armor_cap" />
                                <EquippedSlot item={selectedPlayer.equipped.armor_plate} type="armor_plate" />
                                <EquippedSlot item={selectedPlayer.equipped.armor_leggings} type="armor_leggings" />
                            </div>

                            {/* Portrait */}
                            <div className="w-[280px] h-[360px] md:w-[320px] md:h-[400px] border-2 border-stone-700/50 rounded-2xl bg-black/40 shadow-[0_0_40px_rgba(0,0,0,0.6),inset_0_0_20px_rgba(0,0,0,0.4)] flex justify-center items-end shrink-0 overflow-hidden relative z-10">
                                <div className="w-[260px] h-[350px] md:w-[300px] md:h-[390px] relative overflow-visible">
                                    <PlayerPortrait
                                        className={selectedPlayer.class}
                                        hairStyle={selectedPlayer.hairStyle}
                                        beardStyle={selectedPlayer.beardStyle}
                                    />
                                </div>
                            </div>

                            {/* Right equip column */}
                            <div className="flex flex-col justify-center gap-4 shrink-0 relative z-20">
                                <EquippedSlot item={selectedPlayer.equipped.weapon} type="weapon" />
                                <EquippedSlot item={selectedPlayer.equipped.armor_boots} type="armor_boots" />
                            </div>

                            {/* Stats grid */}
                            <div className="flex-1 flex justify-center max-w-sm shrink-0">
                                <div className="w-full bg-stone-900/60 border border-stone-800 p-6 rounded-2xl shadow-inner flex flex-col gap-3">
                                    <div className="text-stone-400 font-black tracking-widest uppercase border-b border-stone-800 pb-2 mb-2 text-sm text-center">Attributes</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'HP', value: (selectedPlayer.stats.health * 25) + (selectedPlayer.lvl * 50), color: 'text-green-400' },
                                            { label: 'STR', value: selectedPlayer.stats.strength, color: 'text-stone-200' },
                                            { label: 'AGI', value: selectedPlayer.stats.agility, color: 'text-stone-200' },
                                            { label: 'LCK', value: selectedPlayer.stats.luck, color: 'text-stone-200' },
                                            { label: 'RES', value: selectedPlayer.stats.resistance, color: 'text-stone-200' },
                                            { label: 'ARMOR', value: selectedPlayer.stats.armor, color: 'text-blue-300' },
                                        ].map(s => (
                                            <div key={s.label} className="flex flex-col items-center justify-center bg-black/40 rounded-xl px-4 py-3 border border-stone-800/80 shadow-sm">
                                                <span className="text-stone-500 uppercase text-xs font-bold tracking-widest mb-1">{s.label}</span>
                                                <span className={`${s.color} font-black text-xl`}>{s.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/80 border-t border-amber-900/50 p-4 shrink-0 flex justify-center">
                            <button
                                onClick={handleFight}
                                disabled={cooldownRemaining > 0}
                                className={`px-16 py-4 text-2xl font-black uppercase tracking-[0.25em] rounded-xl border transition-all shadow-2xl
                                    ${cooldownRemaining > 0 
                                        ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed scale-95' 
                                        : 'bg-red-900/90 hover:bg-red-800 text-red-100 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(220,38,38,0.7)]'
                                    }`}
                            >
                                {cooldownRemaining > 0 ? (
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs tracking-widest mb-1 opacity-70 text-red-400">Cooldown Active</span>
                                        {formatCooldown(cooldownRemaining)}
                                    </div>
                                ) : "FIGHT"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty Space for layout balance (1/4) */}
                <div className="hidden md:block md:flex-1 shrink-0"></div>
            </div>
            <style>{`
                @keyframes lbCardIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </GameLayout>
    );
};

// Mini internal component for item slots
function EquippedSlot({ item, type }) {
    if (!item) {
        return (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-stone-800/60 bg-black/60 flex items-center justify-center opacity-50 shadow-inner">
                {type === 'weapon' ? '' : ''}
            </div>
        );
    }
    const rarity = (item.rarity || 'common').toLowerCase();
    const imgPath = resolveItemImagePath(item);
    return (
        <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 bg-stone-900/90 flex flex-col items-center justify-center shadow-2xl relative group transition-transform hover:scale-105"
            style={{
                borderColor: RARITY_COLOR[rarity] || '#9ca3af',
                boxShadow: `0 0 15px ${RARITY_GLOW[rarity] || 'rgba(156,163,175,0.35)'}`
            }}
        >
            {imgPath ? (
                <img src={imgPath} className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-md" alt={item.name} />
            ) : (
                <span className="text-3xl drop-shadow-md">{getItemIcon(item)}</span>
            )}
            {/* Tooltip on hover */}
            <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 w-max bg-black/95 text-base shadow-xl text-stone-200 p-3 rounded-lg border border-stone-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                <span style={{ color: RARITY_COLOR[rarity] }} className="font-black text-lg block mb-1 drop-shadow-sm">{item.name}</span>
                <div className="text-stone-300 font-medium">
                    {item.type === 'weapon' && <span>Damage: <span className="text-white">{item.weapon_damage || item.base_damage}</span></span>}
                    {item.type === 'armor' && <span>Armor: <span className="text-white">{item.armor_point}</span></span>}
                </div>
            </div>
        </div>
    );
}

export default Leaderboard;
