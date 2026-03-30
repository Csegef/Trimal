import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '../layouts/GameLayout';
import { useNavigate } from 'react-router-dom';
import { loadInventoryPage } from '../api/inventoryApi';
import PlayerPortrait from '../components/PlayerPortrait';

// Assets
import damageLeft from '../assets/damage_left.gif';
import damageRight from '../assets/damage_right.gif';
import slashLeft from '../assets/user___slash-left.gif';
import slashRight from '../assets/user___slash-right.gif';

const FightPlaceholder = () => {
  const navigate = useNavigate();

  const [gameState, setGameState] = useState('loading'); // 'loading', 'active', 'victory', 'defeat'
  const [player, setPlayer] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  const [rewards, setRewards] = useState(null); // stores { normal, spec, xp } on victory

  // Animations
  const [playerAnim, setPlayerAnim] = useState(null);
  const [enemyAnim, setEnemyAnim] = useState(null);
  const [playerDebuffs, setPlayerDebuffs] = useState([]);
  const [playerDmgText, setPlayerDmgText] = useState(null);
  const [enemyDmgText, setEnemyDmgText] = useState(null);
  const [bgImage, setBgImage] = useState(null);

  // Refs for combat state to avoid stale closures in setTimeout sequences
  const combatState = useRef({
    turn: 'player',
    playerHp: 0,
    enemyHp: 0,
    playerDebuffs: [],
    playerObj: null,
    enemyObj: null,
    active: false,
    delayPromise: null
  });

  const debuffIcons = {
    poison: '/src/assets/design/status_effects/poison_effect.gif',
    cold: '/src/assets/design/status_effects/ice_effect.gif',
    bleed: '/src/assets/design/status_effects/bleed_effect.gif'
  };

  const addLog = (msg) => {
    setLogs((prev) => [...prev, msg].slice(-25));
  };

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Initialization
  useEffect(() => {
    let isMounted = true;

    const initFight = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/');

        const { inventory, playerInfo } = await loadInventoryPage();

        // Make sure we have an active quest
        if (!inventory || !inventory.active_quest) {
          navigate('/maingame');
          return;
        }

        if (inventory.active_quest.background) {
          setBgImage(`/src/assets/design/backgrounds/quest_background/${inventory.active_quest.background}`);
        }

        let strength = playerInfo?.stats?.strength || 10;
        let agility = playerInfo?.stats?.agility || 10;
        let luck = playerInfo?.stats?.luck || 10;
        let resistance = playerInfo?.stats?.resistance || 10;
        let health = playerInfo?.stats?.health || 10;
        let armor = 0;
        let weaponDamage = 10;

        if (inventory && inventory.equipped) {
          Object.values(inventory.equipped).forEach(item => {
            if (item) {
              if (item.armor_point) armor += item.armor_point;
              if (item.type === 'weapon' && (item.base_damage || item.weapon_damage)) {
                weaponDamage = item.base_damage || item.weapon_damage;
              }
            }
          });
        }

        const maxHp = health * 25 + (playerInfo?.lvl || 1) * 50;

        const pObj = {
          name: playerInfo?.name || 'Hero',
          class: playerInfo?.class || 'Neanderthal',
          hairStyle: playerInfo?.hairStyle || 0,
          beardStyle: playerInfo?.beardStyle || 0,
          lvl: playerInfo?.lvl || 1,
          stats: { strength, agility, luck, resistance, armor },
          maxHp: maxHp,
          hp: maxHp,
          weaponDamage: weaponDamage
        };

        const res = await fetch('/api/entities', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const enemies = data.data?.enemies || [];

        if (enemies.length === 0) throw new Error('No enemies found');
        
        const difficultyToCategory = {
           easy: 'Light',
           medium: 'Medium',
           hard: 'Heavy'
        };
        const qDifficulty = inventory.active_quest.difficulty?.toLowerCase() || 'medium';
        const targetCategory = difficultyToCategory[qDifficulty] || 'Medium';
        
        let possibleEnemies = enemies.filter(e => e.category === targetCategory);
        if (possibleEnemies.length === 0) possibleEnemies = enemies; // Fallback just in case

        const rndEnemyData = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];

        const lvlMult = Math.max(1, pObj.lvl - 1);
        const eMaxHp = rndEnemyData.base_health * 25 * lvlMult;

        const eObj = {
          name: rndEnemyData.name,
          iconPath: rndEnemyData.iconPath,
          category: rndEnemyData.category,
          type: rndEnemyData.type,
          stats: {
            strength: rndEnemyData.base_strength * lvlMult,
            agility: rndEnemyData.base_agility * lvlMult,
            luck: rndEnemyData.base_luck * lvlMult,
            resistance: rndEnemyData.base_resistance * lvlMult
          },
          maxHp: eMaxHp,
          hp: eMaxHp
        };

        if (!isMounted) return;

        combatState.current.playerHp = pObj.maxHp;
        combatState.current.enemyHp = eObj.maxHp;
        combatState.current.playerObj = pObj;
        combatState.current.enemyObj = eObj;
        combatState.current.turn = (eObj.stats.agility > pObj.stats.agility) ? 'enemy' : 'player';
        combatState.current.active = true;

        setPlayer(pObj);
        setEnemy(eObj);
        setGameState('active');
        addLog(`A wild ${eObj.name} appears!`);

        // Start combat loop directly
        runCombatLoop(token);

      } catch (err) {
        console.error('Fight init error:', err);
        addLog('Error loading fight...');
      }
    };

    initFight();

    return () => {
      isMounted = false;
      combatState.current.active = false;
    };
  }, [navigate]);

  const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const runCombatLoop = async (token) => {
    while (combatState.current.active) {
      await delay(1000);
      if (!combatState.current.active) break;

      const state = combatState.current;
      const pObj = state.playerObj;
      const eObj = state.enemyObj;

      if (state.turn === 'player') {
        // --- PLAYER TACK ---
        setPlayerAnim('attack');
        await delay(400);
        if (!state.active) break;

        const isCrit = Math.random() * 100 < pObj.stats.luck;
        let baseDmg = pObj.weaponDamage + (pObj.stats.strength * 1.5);
        let dmg = Math.max(1, Math.floor(baseDmg - (eObj.stats.resistance * 0.5)));
        if (isCrit) dmg *= 2;

        state.enemyHp = Math.max(0, state.enemyHp - dmg);
        setEnemy(prev => ({ ...prev, hp: state.enemyHp }));
        setEnemyAnim('hit');
        setPlayerAnim(null);
        setEnemyDmgText({ val: `-${dmg}`, color: isCrit ? 'text-yellow-400' : 'text-red-500' });
        addLog(`You hit ${eObj.name} for ${dmg} damage${isCrit ? ' (CRIT)!' : '.'}`);

        await delay(600);
        setEnemyAnim(null);
        setEnemyDmgText(null);

        // Check victory
        if (state.enemyHp <= 0) {
          state.active = false;
          setGameState('victory');
          addLog(`You defeated ${eObj.name}!`);
          handleQuestEnd(token, true);
          break;
        }

        state.turn = 'enemy';
      } else {
        // --- ENEMY ATTACK ---
        setEnemyAnim('attack');
        await delay(400);
        if (!state.active) break;

        const isCrit = Math.random() * 100 < eObj.stats.luck;
        let baseDmg = (eObj.stats.strength * 1.5);
        let dmg = Math.max(1, Math.floor(baseDmg - (pObj.stats.resistance * 0.5) - (pObj.stats.armor * 0.2)));
        if (isCrit) dmg *= 2;

        let newlyApplied = false;
        if (eObj.type !== 'none' && Math.random() < 0.30) {
          if (!state.playerDebuffs.includes(eObj.type)) {
            state.playerDebuffs.push(eObj.type);
            setPlayerDebuffs([...state.playerDebuffs]);
            addLog(`You have been inflicted with ${eObj.type.toUpperCase()}!`);
            newlyApplied = true;
          }
        }

        state.playerHp -= dmg;
        setPlayerDmgText({ val: `-${dmg}`, color: isCrit ? 'text-yellow-400' : 'text-red-500' });
        addLog(`${eObj.name} hits you for ${dmg} damage${isCrit ? ' (CRIT)!' : '.'}`);

        if (state.playerDebuffs.includes('poison') || (newlyApplied && eObj.type === 'poison')) {
          const pDmg = Math.floor(pObj.maxHp * 0.05);
          state.playerHp -= pDmg;
          addLog(`You suffer ${pDmg} poison damage.`);
        }
        if (state.playerDebuffs.includes('bleed') || (newlyApplied && eObj.type === 'bleed')) {
          const bDmg = Math.floor(pObj.maxHp * 0.05);
          state.playerHp -= bDmg;
          addLog(`You suffer ${bDmg} bleeding damage.`);
        }

        state.playerHp = Math.max(0, state.playerHp);
        setPlayer(prev => ({ ...prev, hp: state.playerHp }));
        setPlayerAnim('hit');
        setEnemyAnim(null);

        await delay(600);
        setPlayerAnim(null);
        setPlayerDmgText(null);

        // Check defeat
        if (state.playerHp <= 0) {
          state.active = false;
          setGameState('defeat');
          addLog(`You have been defeated by ${eObj.name}!`);
          handleQuestEnd(token, false);
          break;
        }

        state.turn = 'player';
      }
    }
  };

  const handleQuestEnd = async (token, isWin) => {
    try {
      const endpoint = isWin ? '/api/inventory/quest/claim' : '/api/inventory/quest/fail';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (isWin && data.success && data.rewards) {
        setRewards(data.rewards);
      }
    } catch (e) {
      console.error("Failed handling quest end:", e);
    }
  };

  const handleFinish = async () => {
    navigate('/maingame');
  };

  if (gameState === 'loading') {
    return (
      <GameLayout>
        <div className="flex justify-center items-center h-[80vh] text-amber-500 font-bold text-2xl animate-pulse tracking-widest uppercase">
          Preparing for Battle...
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      <div
        className={`relative w-full max-w-6xl mx-auto h-[85vh] flex flex-col p-4 md:p-8 ${bgImage ? 'bg-cover bg-center rounded-3xl mt-4 border-2 border-stone-800 shadow-2xl overflow-hidden' : ''}`}
        style={bgImage ? { backgroundImage: `url('${bgImage}')` } : {}}
      >
        {bgImage && <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-0" />}

        <div className="relative z-10 flex flex-col h-full w-full">
          <h1 className="text-4xl text-center font-black text-stone-300 tracking-widest uppercase mb-6 drop-shadow-md">
            VS
          </h1>

          <div className="flex-1 flex flex-col md:flex-row gap-4 lg:gap-8 relative items-stretch justify-center">

            {/* PLAYER SIDE */}
            <div className="flex-1 flex flex-col items-center justify-start relative w-full">
              <h2 className="text-xl font-bold text-amber-400 uppercase tracking-widest mb-1 truncate max-w-[240px] text-center">{player.name}</h2>

              {/* Health Bar */}
              <div className="w-full max-w-[240px] mb-6">
                <div className="flex text-[10px] font-bold text-stone-400 mb-1 justify-center">
                  <span>{player.hp} / {player.maxHp} HP</span>
                </div>
                <div className="w-full h-3 bg-stone-900 border border-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-700 to-green-400 transition-all duration-300"
                    style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Avatar Container */}
              <div className="relative w-48 h-64 bg-stone-950/60 rounded-2xl border-2 border-stone-800 flex items-end justify-center overflow-hidden mb-6 shadow-2xl backdrop-blur-sm">
                <PlayerPortrait
                  className={player.class}
                  hairStyle={player.hairStyle}
                  beardStyle={player.beardStyle}
                />

                {/* Hit Overlay */}
                {playerAnim === 'hit' && (
                  <img src={damageRight} alt="Hit" className="absolute inset-0 w-full h-full object-contain z-50 pointer-events-none" />
                )}

                {/* Debuffs Overlay - Full Cover */}
                {playerDebuffs.map((d, i) => (
                  <img key={`${d}-${i}`} src={debuffIcons[d]} alt={d} className="absolute inset-0 w-full h-full object-cover z-30 pointer-events-none opacity-80" />
                ))}

                {/* Floating Damage Text */}
                {playerDmgText && (
                  <div className={`absolute top-[10%] left-1/2 -translate-x-1/2 font-black text-6xl z-[100] animate-bounce drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] ${playerDmgText.color}`}>
                    {playerDmgText.val}
                  </div>
                )}
              </div>

              {/* Attack Animation */}
              {playerAnim === 'attack' && (
                <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                  <img src={slashRight} alt="Slash" className="w-40 h-40 object-contain" />
                </div>
              )}

              {/* Stats Box */}
              <div className="w-full max-w-[240px] bg-stone-950/80 border border-stone-800 p-3 rounded-xl text-[11px] font-bold flex flex-col gap-1 shadow-inner">
                <div className="flex justify-between"><span className="text-stone-500 uppercase">Level</span> <span className="text-amber-400">{player.lvl}</span></div>
                <div className="flex justify-between"><span className="text-stone-500 uppercase">Strength</span> <span className="text-stone-300">{player.stats.strength}</span></div>
                <div className="flex justify-between"><span className="text-stone-500 uppercase">Agility</span> <span className="text-stone-300">{player.stats.agility}</span></div>
                <div className="flex justify-between"><span className="text-stone-500 uppercase">Luck</span> <span className="text-stone-300">{player.stats.luck}</span></div>
                <div className="flex justify-between"><span className="text-stone-500 uppercase">Resistance</span> <span className="text-stone-300">{player.stats.resistance}</span></div>
                <div className="flex justify-between border-t border-stone-800 pt-1 mt-1"><span className="text-stone-500 uppercase">Armor</span> <span className="text-blue-300">{player.stats.armor}</span></div>
              </div>
            </div>

            {/* COMBAT LOG */}
            <div className="hidden lg:flex flex-col flex-1 max-w-[320px] bg-stone-900/60 border border-stone-800 rounded-2xl p-4 overflow-hidden shadow-inner">
              <div className="text-center text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-3 border-b border-stone-800 pb-2">Combat Log</div>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin flex flex-col gap-2 font-mono text-[11px] text-stone-300">
                {logs.map((L, i) => (
                  <div key={i} className={`${L.includes('CRIT') ? 'text-amber-400 font-black' : L.includes('defeated') || L.includes('inflicted') || L.includes('damage.') ? 'text-red-400 font-bold' : L.includes('hits you') ? 'text-red-200' : 'text-green-300'}`}>
                    &gt; {L}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* ENEMY SIDE */}
            <div className="flex-1 flex flex-col items-center justify-start relative w-full">
              <h2 className="text-xl font-bold text-red-500 uppercase tracking-widest mb-1 truncate max-w-[240px] text-center">{enemy.name}</h2>

              {/* Health Bar */}
              <div className="w-full max-w-[240px] mb-6">
                <div className="flex text-[10px] font-bold text-stone-400 mb-1 justify-center">
                  <span>{enemy.hp} / {enemy.maxHp} HP</span>
                </div>
                <div className="w-full h-3 bg-stone-900 border border-stone-700 rounded-full overflow-hidden flex justify-end">
                  <div
                    className="h-full bg-gradient-to-l from-red-700 to-red-500 transition-all duration-300"
                    style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Avatar Container */}
              <div className="relative w-48 h-64 bg-stone-950/60 rounded-2xl border-2 border-red-900/40 flex items-center justify-center overflow-hidden mb-6 shadow-2xl backdrop-blur-sm">
                <img src={`/src/assets/design/covers/enemy_covers/final_imgs/${enemy.iconPath}`} alt={enemy.name} className="h-full w-auto object-cover opacity-90" />

                {/* Hit Overlay */}
                {enemyAnim === 'hit' && (
                  <img src={damageLeft} alt="Hit" className="absolute inset-0 w-full h-full object-contain z-50 pointer-events-none" />
                )}

                {/* Floating Damage Text */}
                {enemyDmgText && (
                  <div className={`absolute top-[10%] left-1/2 -translate-x-1/2 font-black text-6xl z-[100] animate-bounce drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] ${enemyDmgText.color}`}>
                    {enemyDmgText.val}
                  </div>
                )}
              </div>

              {/* Attack Animation */}
              {enemyAnim === 'attack' && (
                <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                  <img src={slashLeft} alt="Slash" className="w-40 h-40 object-contain" />
                </div>
              )}

              {/* Stats Box */}
              <div className="w-full max-w-[240px] bg-stone-950/80 border border-stone-800 p-3 rounded-xl text-[11px] font-bold flex flex-col gap-1 shadow-inner">
                <div className="flex justify-between"><span className="text-stone-500 uppercase">Type</span> <span className={`capitalize ${enemy.type !== 'none' ? 'text-purple-400' : 'text-stone-400'}`}>{enemy.type}</span></div>
                <div className="flex justify-between"><span className="text-stone-500 uppercase">Strength</span> <span className="text-stone-300">{enemy.stats.strength}</span></div>
                <div className="flex justify-between"><span className="text-stone-500 uppercase">Agility</span> <span className="text-stone-300">{enemy.stats.agility}</span></div>
                <div className="flex justify-between"><span className="text-stone-500 uppercase">Luck</span> <span className="text-stone-300">{enemy.stats.luck}</span></div>
                <div className="flex justify-between border-t border-stone-800 pt-1 mt-1"><span className="text-stone-500 uppercase">Resistance</span> <span className="text-stone-300">{enemy.stats.resistance}</span></div>
              </div>
            </div>
          </div>

          {/* Action Modal */}
          {(gameState === 'victory' || gameState === 'defeat') && (
            <div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-md animate-fade-in rounded-3xl">
              <div className="bg-stone-950 border border-stone-800 p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full text-center">
                <h2 className={`text-4xl font-black uppercase tracking-widest mb-4 ${gameState === 'victory' ? 'text-green-500' : 'text-red-500'}`}>
                  {gameState}
                </h2>
                <p className="text-stone-400 mb-6 font-medium">
                  {gameState === 'victory' ? `You have vanquished the ${enemy.name} and proved your might!` : `You have fallen to the ${enemy.name}. You must rest and try again.`}
                </p>

                {/* Rewards Display on Victory */}
                {gameState === 'victory' && rewards && (
                  <div className="flex gap-4 mb-8 bg-black/40 p-4 rounded-xl border border-stone-800">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest">Normal</span>
                      <span className="text-amber-400 font-black">+{rewards.normal}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest">Spec</span>
                      <span className="text-purple-400 font-black">+{rewards.spec}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest">XP</span>
                      <span className="text-blue-400 font-black">+{rewards.xp}</span>
                    </div>
                  </div>
                )}
                {gameState === 'defeat' && (
                  <div className="mb-8 text-stone-500 text-sm font-bold uppercase tracking-widest">
                    Earned Nothing!
                  </div>
                )}

                <button
                  onClick={handleFinish}
                  className="px-8 py-4 bg-amber-700 hover:bg-amber-600 border-2 border-amber-500 text-amber-100 rounded-xl font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(180,83,9,0.5)] active:scale-95 w-full"
                >
                  Continue Journey
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </GameLayout>
  );
};

export default FightPlaceholder;
