import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '../layouts/GameLayout';
import { useNavigate } from 'react-router-dom';
import { loadInventoryPage } from '../api/inventoryApi';
import PlayerPortrait from '../components/PlayerPortrait';
import { API_BASE_URL } from '../api/inventoryApi';

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

  const [currency, setCurrency] = useState(null);
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
    delayPromise: null,
    rageTurns: 0,
    rageTriggered: false,
    sapiensFirstHitUsed: false
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

        if (inventory?.currency) setCurrency(inventory.currency);

        // Make sure we have an active quest
        if (!inventory || !inventory.active_quest) {
          navigate('/maingame');
          return;
        }

        if (inventory.active_quest.background) {
          // Use the background path directly as stored (full path already)
          const bg = inventory.active_quest.background;
          setBgImage(bg.startsWith('/') ? bg : `/src/assets/design/backgrounds/quest_background/${bg}`);
        }

        let strength = playerInfo?.stats?.strength || 10;
        let agility = playerInfo?.stats?.agility || 10;
        let luck = playerInfo?.stats?.luck || 10;
        let resistance = playerInfo?.stats?.resistance || 10;
        let health = playerInfo?.stats?.health || 10;

        if (inventory && inventory.active_buffs) {
          inventory.active_buffs.forEach(b => {
            if (b.expires_at > Math.floor(Date.now() / 1000)) {
              const mult = 1 + (b.percent / 100);
              if (b.category === 'strength') strength = Math.floor(strength * mult);
              if (b.category === 'agility') agility = Math.floor(agility * mult);
              if (b.category === 'luck') luck = Math.floor(luck * mult);
              if (b.category === 'resistance') resistance = Math.floor(resistance * mult);
              if (b.category === 'health') health = Math.floor(health * mult);
            }
          });
        }

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

        const res = await fetch(`${API_BASE_URL}/api/entities`, { headers: { 'Authorization': `Bearer ${token}` } });
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

        let eLvl = playerInfo?.lvl || 1;
        // Easy: no boost → Light enemies easy to beat
        // Medium: +1 boost → Medium enemies moderately harder
        // Hard: no boost, but Heavy base stats (16) are ~2x Light/Medium's (~8), creating natural difficulty
        if (qDifficulty === 'medium') eLvl += 0.2;

        const statMult = 1 + ((eLvl - 1) * 0.35);

        const eMaxHp = rndEnemyData.base_health * 20 * statMult;

        const eObj = {
          name: rndEnemyData.name,
          iconPath: rndEnemyData.iconPath,
          category: rndEnemyData.category,
          type: rndEnemyData.type,
          stats: {
            strength: Math.ceil(rndEnemyData.base_strength * statMult),
            agility: Math.ceil(rndEnemyData.base_agility * statMult),
            luck: Math.ceil(rndEnemyData.base_luck * statMult),
            resistance: Math.ceil(rndEnemyData.base_resistance * statMult)
          },
          maxHp: Math.ceil(eMaxHp),
          hp: Math.ceil(eMaxHp)
        };

        if (!isMounted) return;

        combatState.current.playerHp = pObj.maxHp;
        combatState.current.enemyHp = eObj.maxHp;
        combatState.current.playerObj = pObj;
        combatState.current.enemyObj = eObj;
        combatState.current.rageTurns = 0;
        combatState.current.rageTriggered = false;
        combatState.current.sapiensFirstHitUsed = false;

        let startTurn = (eObj.stats.agility > pObj.stats.agility) ? 'enemy' : 'player';
        if (pObj.class === 'Sapiens') startTurn = 'player'; // Sapiens első ütés
        combatState.current.turn = startTurn;
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

  const skipFight = async () => {
    // Stop the ongoing animated combat loop
    combatState.current.active = false;

    const token = localStorage.getItem('token');
    const state = combatState.current;
    const pObj = state.playerObj;
    const eObj = state.enemyObj;
    if (!pObj || !eObj) return;

    // Simulate combat instantly with the same math, no rendering
    let pHp = pObj.maxHp;
    let eHp = eObj.maxHp;
    let turn = state.turn;
    const MAX_ROUNDS = 300;

    for (let i = 0; i < MAX_ROUNDS; i++) {
      if (pHp <= 0 || eHp <= 0) break;

      if (turn === 'player') {
        const isCrit = Math.random() * 100 < pObj.stats.luck;
        let rawDmg = pObj.weaponDamage * 1.5 * (1 + pObj.stats.strength / 25);
        rawDmg *= (0.9 + Math.random() * 0.2);
        const eReductionMult = 100 / (100 + eObj.stats.resistance * 2);
        let dmg = Math.max(1, Math.floor(rawDmg * eReductionMult));
        if (isCrit) dmg *= 2;
        eHp = Math.max(0, eHp - dmg);
        turn = 'enemy';
      } else {
        const isCrit = Math.random() * 100 < (eObj.category === 'Heavy'
          ? Math.min(25, eObj.stats.luck * 0.3)
          : eObj.stats.luck);
        let dmg = Math.floor((eObj.stats.strength * 2.5 + 10) * (0.9 + Math.random() * 0.2));
        if (isCrit) dmg *= 2;
        const effectiveArmor = pObj.stats.armor + pObj.lvl * 3;
        const armorMult = 100 / (100 + effectiveArmor);
        const defReduction = Math.min(0.75, pObj.stats.resistance / 100);
        dmg = Math.max(1, Math.floor(dmg * armorMult * (1 - defReduction)));
        pHp = Math.max(0, pHp - dmg);
        turn = 'player';
      }
    }

    const isWin = eHp <= 0;
    setGameState(isWin ? 'victory' : 'defeat');
    // Update displayed HP so bars show final state
    setPlayer(prev => ({ ...prev, hp: Math.max(0, pHp) }));
    setEnemy(prev => ({ ...prev, hp: Math.max(0, eHp) }));
    await handleQuestEnd(token, isWin);
  };

  const runCombatLoop = async (token) => {
    while (combatState.current.active) {
      await delay(1000);
      if (!combatState.current.active) break;

      const state = combatState.current;
      const pObj = state.playerObj;
      const eObj = state.enemyObj;

      if (state.turn === 'player') {
        // --- PLAYER ATTACK ---
        setPlayerAnim('attack');
        await delay(400);
        if (!state.active) break;

        let evaded = false;
        if (eObj.category === 'Light') {
          const evadeChance = Math.min(50, eObj.stats.agility * 0.5);
          if (Math.random() * 100 < evadeChance) evaded = true;
        }

        if (evaded) {
          setEnemyDmgText({ val: `MISS`, color: 'text-stone-400' });
          addLog(`${eObj.name} evaded your attack!`);
          await delay(600);
          setEnemyDmgText(null);
          setPlayerAnim(null);
        } else {
          const rageActive = state.rageTurns > 0;
          const critChance = pObj.stats.luck + (rageActive ? 40 : 0);
          const isCrit = Math.random() * 100 < critChance;
          let rawDmg = pObj.weaponDamage * 1.5 * (1 + (pObj.stats.strength / 25));
          rawDmg = rawDmg * (0.9 + Math.random() * 0.2); // +-10% variance

          if (pObj.class === 'Sapiens' && !state.sapiensFirstHitUsed) {
            rawDmg *= 1.25;
            state.sapiensFirstHitUsed = true;
            addLog(`SAPIENS First Strike! (+25% damage)`);
          }

          if (state.rageTurns > 0) {
            rawDmg *= 1.50;
            state.rageTurns -= 1;
          }

          // Apply proportional enemy resistance
          const eReductionMult = 100 / (100 + (eObj.stats.resistance * 2));
          rawDmg = rawDmg * eReductionMult;

          let dmg = Math.max(1, Math.floor(rawDmg));
          if (isCrit) dmg *= 2;

          state.enemyHp = Math.max(0, state.enemyHp - dmg);
          setEnemy(prev => ({ ...prev, hp: state.enemyHp }));
          setEnemyAnim('hit');
          setPlayerAnim(null);
          setEnemyDmgText({ val: `-${dmg}`, color: isCrit ? 'text-yellow-400' : 'text-red-500' });
          addLog(`You hit ${eObj.name} for ${dmg} damage${isCrit ? ' (CRIT)!' : '.'}`);
          if (rageActive) addLog(`Rage active! (+50% DMG, +40% CRIT)`);
          else if (state.rageTurns === 0 && state.rageTriggered) {} // silent

          await delay(600);
          setEnemyAnim(null);
          setEnemyDmgText(null);
        }

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

        // Floresiensis: reflex
        let autoEvade = false;
        if (pObj.class === 'Floresiensis' && (state.playerHp / pObj.maxHp) < 0.25) {
          if (Math.random() < 0.50) autoEvade = true;
        }

        if (autoEvade) {
          setPlayerDmgText({ val: `REFLEX!`, color: 'text-stone-400' });
          addLog(`You used REFLEX to instinctively evade!`);
          await delay(600);
          setPlayerDmgText(null);
          setEnemyAnim(null);
        } else {
          let isCrit = Math.random() * 100 < eObj.stats.luck;
          if (eObj.category === 'Heavy') {
            isCrit = Math.random() * 100 < Math.min(25, eObj.stats.luck * 0.3); // Hard cap at 25%
          }

          // Unified 2.5x damage multiplier for all enemy types - raw base stats create difficulty gap
          let enemyIncomingDmg = (eObj.stats.strength * 2.5 + 10) * (0.9 + Math.random() * 0.2);
          if (isCrit) enemyIncomingDmg *= 2;

          const effectiveArmor = pObj.stats.armor + (pObj.lvl * 3);

          // Logarithmic scaling for armor reduction
          const armorReductionMult = 100 / (100 + effectiveArmor);
          let reducedDmg = enemyIncomingDmg * armorReductionMult;

          const defReduction = Math.min(0.75, pObj.stats.resistance / 100);

          let dmg = Math.floor(reducedDmg * (1 - defReduction));
          dmg = Math.max(1, dmg); // At least 1 damage taken

          let newlyApplied = false;
          if (eObj.type !== 'none' && Math.random() < 0.12) {
            if (!state.playerDebuffs.includes(eObj.type)) {
              state.playerDebuffs.push(eObj.type);
              setPlayerDebuffs([...state.playerDebuffs]);
              addLog(`You have been inflicted with ${eObj.type.toUpperCase()}!`);
              newlyApplied = true;
            }
          }

          state.playerHp -= dmg;
          addLog(`${eObj.name} hits you for ${dmg} damage${isCrit ? ' (CRIT)!' : '.'}`);
          setPlayerDmgText({ val: `-${dmg}`, color: isCrit ? 'text-yellow-400' : 'text-red-500' });

          if (state.playerDebuffs.includes('poison') || (newlyApplied && eObj.type === 'poison')) {
            const pDmg = Math.max(1, Math.floor(pObj.maxHp * 0.013));
            state.playerHp -= pDmg;
            addLog(`You suffer ${pDmg} poison damage.`);
          }
          if (state.playerDebuffs.includes('bleed') || (newlyApplied && eObj.type === 'bleed')) {
            const bDmg = Math.max(1, Math.floor(pObj.maxHp * 0.013));
            state.playerHp -= bDmg;
            addLog(`You suffer ${bDmg} bleeding damage.`);
          }
          if (state.playerDebuffs.includes('freeze') || (newlyApplied && eObj.type === 'freeze')) {
            const fDmg = Math.max(1, Math.floor(pObj.maxHp * 0.013));
            state.playerHp -= fDmg;
            addLog(`You suffer ${fDmg} freeze damage.`);
          }

          // Neanderthal: háborgás
          if (pObj.class === 'Neanderthal' && state.rageTurns === 0 && !state.rageTriggered) {
            if ((state.playerHp / pObj.maxHp) < 0.30) {
              if (Math.random() < 0.40) {
                state.rageTurns = 2;
                state.rageTriggered = true;
                addLog(`Neanderthal rage kicks in for 2 attacks (+50% DMG, +40% CRIT)`);
              }
            }
          }

          state.playerHp = Math.max(0, state.playerHp);
          setPlayer(prev => ({ ...prev, hp: state.playerHp }));
          setPlayerAnim('hit');
          setEnemyAnim(null);

          await delay(600);
          setPlayerAnim(null);
          setPlayerDmgText(null);
        }

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
      const endpoint = isWin ? `${API_BASE_URL}/api/inventory/quest/claim` : `${API_BASE_URL}/api/inventory/quest/fail`;
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
    <GameLayout currency={currency} customBg={bgImage} bgOpacity={50}>
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col py-4 px-2 md:px-6">

        {/* VS Header — centered */}
        <h1 className="text-3xl font-black text-stone-200 tracking-[0.4em] uppercase text-center mb-5 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
          VS
        </h1>

        {/* Main arena row */}
        <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-start justify-center w-full">

          {/* ── PLAYER CARD ── */}
          <div className="flex-1 flex flex-col items-center min-w-0 bg-black/40 border border-stone-700/50 rounded-2xl p-4 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-widest mb-2 drop-shadow-[0_1px_6px_rgba(0,0,0,1)]">{player.name}</h2>

            {/* Health Bar */}
            <div className="w-full max-w-[260px] mb-4">
              <div className="flex text-[10px] font-bold text-stone-400 mb-1 justify-center">
                <span>{player.hp} / {player.maxHp} HP</span>
              </div>
              <div className="w-full h-2.5 bg-black/60 border border-stone-700/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-700 to-green-400 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Avatar frame — square */}
            <div
              className="relative flex items-center justify-center mb-4 rounded-xl border-2 border-amber-900/40 shadow-[0_0_30px_rgba(0,0,0,0.7),inset_0_0_20px_rgba(0,0,0,0.4)] bg-black/25"
              style={{ width: '220px', height: '220px' }}
            >
              <div style={{ width: '210px', height: '210px', position: 'relative', overflow: 'visible' }}>
                <PlayerPortrait
                  className={player.class}
                  hairStyle={player.hairStyle}
                  beardStyle={player.beardStyle}
                />
              </div>
              {playerDebuffs.map((d, i) => (
                debuffIcons[d] && (
                  <img key={`${d}-${i}`} src={debuffIcons[d]} alt={d}
                    className="absolute inset-0 w-full h-full object-cover z-30 pointer-events-none opacity-80" />
                )
              ))}
              {playerAnim === 'hit' && (
                <img src={damageRight} alt="Hit"
                  className="absolute inset-0 w-full h-full object-contain z-40 pointer-events-none"
                  style={{ animation: 'fadeInOut 0.7s ease-in-out forwards' }} />
              )}
              {playerDmgText && (
                <div className={`absolute top-2 left-1/2 font-black text-5xl z-[100] drop-shadow-[0_4px_8px_rgba(0,0,0,1)] ${playerDmgText.color}`}
                  style={{ animation: 'floatUp 0.9s ease-out forwards' }}>
                  {playerDmgText.val}
                </div>
              )}
            </div>

            {playerAnim === 'attack' && (
              <div className="absolute right-[calc(50%-60px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none"
                style={{ animation: 'slashIn 0.4s ease-out forwards' }}>
                <img src={slashRight} alt="Slash" className="w-32 h-32 object-contain opacity-90" />
              </div>
            )}

            {/* Player Stats */}
            <div className="w-full max-w-[240px] bg-black/40 border border-stone-800/60 p-3 rounded-xl text-[11px] font-bold flex flex-col gap-1 shadow-inner">
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Level</span> <span className="text-amber-400">{player.lvl}</span></div>
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Strength</span> <span className="text-stone-300">{player.stats.strength}</span></div>
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Agility</span> <span className="text-stone-300">{player.stats.agility}</span></div>
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Luck</span> <span className="text-stone-300">{player.stats.luck}</span></div>
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Resistance</span> <span className="text-stone-300">{player.stats.resistance}</span></div>
              <div className="flex justify-between border-t border-stone-800 pt-1 mt-1"><span className="text-stone-500 uppercase">Armor</span> <span className="text-blue-300">{player.stats.armor}</span></div>
            </div>
          </div>

          {/* ── COMBAT LOG + SKIP ── */}
          <div className="hidden lg:flex flex-col w-[260px] shrink-0 gap-3">
            <div className="bg-black/40 border border-stone-700/50 rounded-2xl p-4 shadow-inner backdrop-blur-sm flex flex-col" style={{ maxHeight: '420px' }}>
              <div className="text-center text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-3 border-b border-stone-800 pb-2">Combat Log</div>
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 font-mono text-[11px]" style={{ scrollbarWidth: 'none' }}>
                {logs.map((L, i) => {
                  let cls = 'text-stone-500';
                  if (L.includes('CRIT') || L.includes('Rage') || L.includes('Strike')) cls = 'text-stone-200 font-semibold';
                  else if (L.includes('You hit')) cls = 'text-stone-300';
                  else if (L.includes('hits you')) cls = 'text-stone-400';
                  return <div key={i} className={cls}>&gt; {L}</div>;
                })}
                <div ref={logsEndRef} />
              </div>
            </div>
            {gameState === 'active' && (
              <button
                onClick={skipFight}
                className="w-full py-2 bg-stone-800/80 hover:bg-stone-700 border border-stone-600 hover:border-amber-600 text-stone-300 hover:text-amber-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-md"
              >
                Skip Fight
              </button>
            )}
          </div>

          {/* ── ENEMY CARD ── */}
          <div className="flex-1 flex flex-col items-center min-w-0 bg-black/40 border border-stone-700/50 rounded-2xl p-4 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            <h2 className="text-lg font-black text-red-400 uppercase tracking-widest mb-2 drop-shadow-[0_1px_6px_rgba(0,0,0,1)]">{enemy.name}</h2>

            {/* Health Bar */}
            <div className="w-full max-w-[260px] mb-4">
              <div className="flex text-[10px] font-bold text-stone-400 mb-1 justify-center">
                <span>{enemy.hp} / {enemy.maxHp} HP</span>
              </div>
              <div className="w-full h-2.5 bg-black/60 border border-stone-700/60 rounded-full overflow-hidden flex justify-end">
                <div
                  className="h-full bg-gradient-to-l from-red-700 to-red-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Avatar frame — square */}
            <div
              className="relative flex items-center justify-center mb-4 rounded-xl border-2 border-red-900/40 shadow-[0_0_30px_rgba(0,0,0,0.7),inset_0_0_20px_rgba(0,0,0,0.4)] bg-black/25"
              style={{ width: '220px', height: '220px' }}
            >
              {enemyAnim === 'hit' && (
                <img src={damageLeft} alt="Hit"
                  className="absolute inset-0 w-full h-full object-contain z-40 pointer-events-none"
                  style={{ animation: 'fadeInOut 0.7s ease-in-out forwards' }} />
              )}
              <img
                src={`/src/assets/design/covers/enemy_covers/final_imgs/${enemy.iconPath}`}
                alt={enemy.name}
                style={{ maxHeight: '210px', maxWidth: '210px', width: 'auto', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.9))' }}
              />
              {enemyDmgText && (
                <div className={`absolute top-2 left-1/2 font-black text-5xl z-[100] drop-shadow-[0_4px_8px_rgba(0,0,0,1)] ${enemyDmgText.color}`}
                  style={{ animation: 'floatUp 0.9s ease-out forwards' }}>
                  {enemyDmgText.val}
                </div>
              )}
            </div>

            {enemyAnim === 'attack' && (
              <div className="absolute left-[calc(50%-60px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none"
                style={{ animation: 'slashIn 0.4s ease-out forwards' }}>
                <img src={slashLeft} alt="Slash" className="w-32 h-32 object-contain opacity-90" />
              </div>
            )}

            {/* Enemy Stats */}
            <div className="w-full max-w-[240px] bg-black/40 border border-stone-800/60 p-3 rounded-xl text-[11px] font-bold flex flex-col gap-1 shadow-inner">
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Type</span> <span className={`capitalize ${enemy.type !== 'none' ? 'text-purple-400' : 'text-stone-400'}`}>{enemy.type}</span></div>
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Strength</span> <span className="text-stone-300">{enemy.stats.strength}</span></div>
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Agility</span> <span className="text-stone-300">{enemy.stats.agility}</span></div>
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Luck</span> <span className="text-stone-300">{enemy.stats.luck}</span></div>
              <div className="flex justify-between border-t border-stone-800 pt-1 mt-1"><span className="text-stone-500 uppercase">Resistance</span> <span className="text-stone-300">{enemy.stats.resistance}</span></div>
            </div>
          </div>

        </div>{/* end arena row */}
      </div>{/* end z-10 content */}

      {/* Victory / Defeat Modal */}
      {(gameState === 'victory' || gameState === 'defeat') && (
        <div className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center backdrop-blur-md">
          <div className="bg-stone-950/95 border border-stone-800 p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full text-center mx-4">
            <h2 className={`text-4xl font-black uppercase tracking-widest mb-4 ${gameState === 'victory' ? 'text-green-400' : 'text-red-400'}`}>
              {gameState}
            </h2>
            <p className="text-stone-400 mb-6 font-medium text-sm">
              {gameState === 'victory'
                ? `You have vanquished ${enemy.name} and proved your might!`
                : `You have fallen to ${enemy.name}. Rest and try again.`}
            </p>
            {gameState === 'victory' && rewards && (
              <div className="flex flex-col mb-8 gap-4 w-full">
                <div className="flex gap-4 bg-black/40 p-4 rounded-xl border border-stone-800 justify-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-stone-500 uppercase tracking-widest">Normal</span>
                    <span className="text-amber-400 font-black">+{rewards.normal}</span>
                  </div>
                  {rewards.spec > 0 && (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest">Special</span>
                      <span className="text-purple-400 font-black">+{rewards.spec}</span>
                    </div>
                  )}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-stone-500 uppercase tracking-widest">XP</span>
                    <span className="text-blue-400 font-black">+{rewards.xp}</span>
                  </div>
                </div>
                {rewards.drops && rewards.drops.length > 0 && (
                  <div className="flex flex-col items-center bg-black/40 p-3 rounded-xl border border-stone-800">
                    <span className="text-[9px] text-stone-500 uppercase tracking-widest mb-1">Items Found</span>
                    <div className="flex flex-col gap-1 text-xs font-bold">
                      {rewards.drops.map((dropName, i) => (
                        <span key={i} className="text-green-400">+ 1x {dropName}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {gameState === 'defeat' && (
              <div className="mb-8 text-stone-500 text-sm font-bold uppercase tracking-widest">Earned Nothing</div>
            )}
            <button
              onClick={handleFinish}
              className="px-8 py-4 bg-amber-800 hover:bg-amber-700 border-2 border-amber-600 text-amber-100 rounded-xl font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(180,83,9,0.4)] active:scale-95 w-full"
            >
              Continue Journey
            </button>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeInOut {
          0%   { opacity: 0; transform: scale(0.8); }
          25%  { opacity: 0.85; transform: scale(1); }
          75%  { opacity: 0.7; }
          100% { opacity: 0; }
        }
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateX(-50%) translateY(0); }
          15%  { opacity: 1; }
          80%  { opacity: 1; transform: translateX(-50%) translateY(-28px); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-42px); }
        }
        @keyframes slashIn {
          0%   { opacity: 0; transform: scale(0.6) rotate(-12deg); }
          45%  { opacity: 1; transform: scale(1.05) rotate(2deg); }
          100% { opacity: 0.7; transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </GameLayout>
  );
};

export default FightPlaceholder;

