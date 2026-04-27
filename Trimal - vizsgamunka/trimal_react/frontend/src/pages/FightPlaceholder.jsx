// ==========================================
// Fájl: Harc Képernyő Helyőrző (Fight Placeholder)
// Cél: A harcrendszer grafikus megjelenítése a küldetések közben.
//
// Itt láthatjuk életerő sávokkal az ellenfelet és a saját karakterünket.
// ==========================================
import React, { useState, useEffect, useRef } from 'react';
import GameLayout from '../layouts/GameLayout';
import { useNavigate } from 'react-router-dom';
import { loadInventoryPage } from '../api/inventoryApi';
import PlayerPortrait from '../components/PlayerPortrait';

// Assetek
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

  // Animációk
  const [playerAnim, setPlayerAnim] = useState(null);
  const [enemyAnim, setEnemyAnim] = useState(null);
  const [playerDebuffs, setPlayerDebuffs] = useState([]);
  const [playerDmgText, setPlayerDmgText] = useState(null);
  const [enemyDmgText, setEnemyDmgText] = useState(null);
  const [bgImage, setBgImage] = useState(null);

  // Refek a harci állapot tárolására, hogy elkerüljük a stale closure-öket a setTimeout szekvenciákban
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
    sapiensFirstHitUsed: false,
    // Dungeon ellenfél oldali szupererők
    enemyRageTurns: 0,
    enemyRageTriggered: false,
    enemySapiensFirstHitUsed: false,
    isDungeon: false,
    enemyPrefix: null,
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

  // Inicializálás
  const hasInit = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const initFight = async () => {
      if (hasInit.current) return;
      hasInit.current = true;
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/');

        const { inventory, playerInfo } = await loadInventoryPage();

        if (inventory?.currency) setCurrency(inventory.currency);

        // Biztosítsuk, hogy legyen egy aktív küldetés
        if (!inventory || !inventory.active_quest) {
          navigate('/maingame');
          return;
        }

        if (inventory.active_quest.background) {
          // A háttér útvonalát használjuk közvetlenül, ahogy tárolva van (már teljes útvonal)
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
              if (item.type === 'weapon' && (item.weapon_damage || item.base_damage)) {
                weaponDamage = item.weapon_damage || item.base_damage;
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

        // ─── Dungeon: ősember ellenfél építés ───────────────────
        const isDungeon = !!inventory.active_quest.isDungeon;
        const isArena = !!inventory.active_quest.isArena;
        combatState.current.isDungeon = isDungeon;
        combatState.current.isArena = isArena;
        combatState.current.enemyPrefix = inventory.active_quest.enemyPrefix || null;

        let eObj;

        if (isArena) {
          eObj = inventory.active_quest.enemyObj;
          combatState.current.turn = pObj.stats.agility >= eObj.stats.agility ? 'player' : 'enemy';

          const prefixMap = { 'Neanderthal': 'n', 'Sapiens': 'hs', 'Floresiensis': 'f' };
          combatState.current.enemyPrefix = prefixMap[eObj.class] || 'n';
        } else if (isDungeon) {
          const ePrefix = inventory.active_quest.enemyPrefix || 'n';
          const eName = inventory.active_quest.enemyName || 'Ancient Warrior';
          const dungeonId = inventory.active_quest.dungeonId || 1;
          const eLvl = playerInfo?.lvl || 1;
          let statMult = 1 + ((eLvl - 1) * 0.40); // kicsit erősebb mint az állatok
          if (playerInfo?.lvl <= 3) statMult *= 0.5; // Kezdő bónusz szintekhez 1-3

          // Stat-ok skálázása dungeon tier alapján
          const tierMults = { 1: 1.0, 2: 1.25, 3: 1.55 };
          const tier = tierMults[dungeonId] || 1.0;
          const baseStr = Math.ceil(10 * statMult * tier);
          const baseAgi = Math.ceil(10 * statMult * tier);
          const baseLuck = Math.ceil(8 * statMult * tier);
          const baseRes = Math.ceil(8 * statMult * tier);
          const eMaxHp = Math.ceil(12 * 20 * statMult * tier);

          eObj = {
            name: eName,
            iconPath: null,     // PlayerPortrait-ot használjuk helyette
            isDungeonHuman: true,
            enemyPrefix: ePrefix,
            category: 'Medium',
            type: 'none',
            stats: { strength: baseStr, agility: baseAgi, luck: baseLuck, resistance: baseRes },
            maxHp: eMaxHp,
            hp: eMaxHp,
          };

          // Homo Sapiens: érme dobás az első körért
          let startTurn = (eObj.stats.agility > pObj.stats.agility) ? 'enemy' : 'player';
          if (pObj.class === 'Sapiens') startTurn = 'player';
          if (ePrefix === 'hs') {
            startTurn = Math.random() < 0.5 ? 'player' : 'enemy';
            addLog(`Lean Scout calls a coin flip — ${startTurn === 'player' ? 'you strike first!' : 'the scout strikes first!'}`);
          }
          combatState.current.turn = startTurn;
        } else {
          // ─── Rendess küldetésbeli ellenfél az /api/entities-ből ───────────────────────────
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
          if (possibleEnemies.length === 0) possibleEnemies = enemies;

          const rndEnemyData = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];

          let eLvl = playerInfo?.lvl || 1;
          if (qDifficulty === 'easy') eLvl -= 0.6; // -= 0.4 volt
          if (qDifficulty === 'medium') eLvl -= 0.5; // += 0.2 volt
          if (qDifficulty === 'hard') eLvl -= 0.2; // += 0.8 volt, -= 0.5 volt

          let statMult = 1 + ((eLvl - 1) * 0.25);
          if (playerInfo?.lvl <= 3) statMult *= 0.5; // Kezdő bónusz szintekhez 1-3
          const eMaxHp = rndEnemyData.base_health * 20 * statMult;

          eObj = {
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

          let startTurn = (eObj.stats.agility > pObj.stats.agility) ? 'enemy' : 'player';
          if (pObj.class === 'Sapiens') startTurn = 'player';
          combatState.current.turn = startTurn;
        }

        combatState.current.playerHp = pObj.maxHp;
        combatState.current.enemyHp = eObj.maxHp;
        combatState.current.playerObj = pObj;
        combatState.current.enemyObj = eObj;
        combatState.current.rageTurns = 0;
        combatState.current.rageTriggered = false;
        combatState.current.sapiensFirstHitUsed = false;
        combatState.current.enemyRageTurns = 0;
        combatState.current.enemyRageTriggered = false;
        combatState.current.enemySapiensFirstHitUsed = false;
        combatState.current.active = true;

        setPlayer(pObj);
        setEnemy(eObj);
        setGameState('active');
        addLog(`A wild ${eObj.name} appears!`);
        if (playerInfo?.lvl <= 3) {
          setTimeout(() => addLog("Beginner Boost: The enemy seems noticeably weaker."), 10);
        }

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
    // animált harci ciklus leállítása
    combatState.current.active = false;

    const token = localStorage.getItem('token');
    const state = combatState.current;
    const pObj = state.playerObj;
    const eObj = state.enemyObj;
    if (!pObj || !eObj) return;

    // Render nélküli szimuláció
    let pHp = pObj.maxHp;
    let eHp = eObj.maxHp;
    let turn = state.turn;
    const MAX_ROUNDS = 300;

    for (let i = 0; i < MAX_ROUNDS; i++) {
      if (pHp <= 0 || eHp <= 0) break;

      if (turn === 'player') {
        let eEvadeChance = Math.min(10, eObj.stats.agility * 0.2);
        if (eObj.category === 'Light') eEvadeChance = Math.min(50, eObj.stats.agility * 0.5);
        if (Math.random() * 100 < eEvadeChance) {
          turn = 'enemy';
          continue;
        }

        const isCrit = Math.random() * 100 < pObj.stats.luck;
        let rawDmg = pObj.weaponDamage * 1.5 * (1 + pObj.stats.strength / 25);
        rawDmg *= (0.9 + Math.random() * 0.2);
        const eReductionMult = 100 / (100 + eObj.stats.resistance * 2);
        let dmg = Math.max(1, Math.floor(rawDmg * eReductionMult));
        if (isCrit) dmg *= 2;
        eHp = Math.max(0, eHp - dmg);
        turn = 'enemy';
      } else {
        let pEvadeChance = Math.min(10, pObj.stats.agility * 0.2);
        if (pObj.class === 'Floresiensis' && (pHp / pObj.maxHp) < 0.25) pEvadeChance = Math.max(pEvadeChance, 50);
        if (Math.random() * 100 < pEvadeChance) {
          turn = 'player';
          continue;
        }

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
    // A megjelenített életerőt megmutassa a végső állapotot
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
        // --- PLAYER TÁMADÁS ---
        setPlayerAnim('attack');
        await delay(400);
        if (!state.active) break;

        let evaded = false;
        let evadeChance = Math.min(10, eObj.stats.agility * 0.2);
        if (eObj.category === 'Light') {
          evadeChance = Math.min(50, eObj.stats.agility * 0.5);
        }
        if (Math.random() * 100 < evadeChance) evaded = true;

        if (evaded) {
          setEnemyDmgText({ val: `MISS`, color: 'text-stone-400' });
          addLog(`${eObj.name} evaded your attack!`);
          await delay(400);
          setEnemyDmgText(null);
          setPlayerAnim(null);
        } else {
          const rageActive = state.rageTurns > 0;
          const critChance = pObj.stats.luck + (rageActive ? 40 : 0);
          const isCrit = Math.random() * 100 < critChance;
          let rawDmg = pObj.weaponDamage * 1.5 * (1 + (pObj.stats.strength / 25));
          rawDmg = rawDmg * (0.9 + Math.random() * 0.2); // +-10% variancia

          if (pObj.class === 'Sapiens' && !state.sapiensFirstHitUsed) {
            rawDmg *= 1.25;
            state.sapiensFirstHitUsed = true;
            addLog(`SAPIENS First Strike! (+25% damage)`);
          }

          if (state.rageTurns > 0) {
            rawDmg *= 1.50;
            state.rageTurns -= 1;
          }

          // Az ellenfél rezisztenciájának arányos alkalmazása
          const eReductionMult = 100 / (100 + (eObj.stats.resistance * 2));
          rawDmg = rawDmg * eReductionMult;

          let dmg = Math.max(1, Math.floor(rawDmg));
          if (isCrit) {
            dmg *= 2;
            state.currentConsecutiveCrits = (state.currentConsecutiveCrits || 0) + 1;
            if (state.currentConsecutiveCrits > (state.maxConsecutiveCrits || 0)) state.maxConsecutiveCrits = state.currentConsecutiveCrits;
          } else {
            state.currentConsecutiveCrits = 0;
          }

          state.enemyHp = Math.max(0, state.enemyHp - dmg);
          setEnemy(prev => ({ ...prev, hp: state.enemyHp }));
          setEnemyAnim('hit');
          setPlayerAnim(null);
          setEnemyDmgText({ val: `-${dmg}`, color: isCrit ? 'text-yellow-400' : 'text-red-500' });
          addLog(`You hit ${eObj.name} for ${dmg} damage${isCrit ? ' (CRIT)!' : '.'}`);
          if (rageActive) addLog(`Rage active! (+50% DMG, +40% CRIT)`);
          else if (state.rageTurns === 0 && state.rageTriggered) { } // silent

          await delay(400);
          setEnemyAnim(null);
          setEnemyDmgText(null);
        }

        // GYŐZELEM ellenőrzése
        if (state.enemyHp <= 0) {
          state.active = false;
          setGameState('victory');
          addLog(`You defeated ${eObj.name}!`);
          handleQuestEnd(token, true);
          break;
        }

        state.turn = 'enemy';
      } else {
        // --- ENEMY TÁMADÁS ---
        setEnemyAnim('attack');
        await delay(400);
        if (!state.active) break;

        let autoEvade = false;
        let isReflex = false;
        const playerDodgeChance = Math.min(10, pObj.stats.agility * 0.2);

        if (Math.random() * 100 < playerDodgeChance) {
          autoEvade = true;
        }

        // Floresiensis: reflex
        if (pObj.class === 'Floresiensis' && (state.playerHp / pObj.maxHp) < 0.25) {
          if (!autoEvade && Math.random() < 0.50) {
            autoEvade = true;
            isReflex = true;
          } else if (autoEvade) {
            isReflex = true;
          }
        }

        if (autoEvade) {
          setPlayerDmgText({ val: isReflex ? `REFLEX!` : `DODGED!`, color: 'text-stone-400' });
          addLog(isReflex ? `You used REFLEX to instinctively evade!` : `You agilely dodged the attack!`);
          await delay(400);
          setPlayerDmgText(null);
          setEnemyAnim(null);
        } else {
          // Az ellenfél képességei (a játékos osztályainak tükörképe)
          const ePrefix = state.enemyPrefix;

          // Neanderthal enemy: rage keves HP-nél
          if (ePrefix === 'n' && state.enemyRageTurns === 0 && !state.enemyRageTriggered) {
            if ((state.enemyHp / eObj.maxHp) < 0.30) {
              if (Math.random() < 0.40) {
                state.enemyRageTurns = 2;
                state.enemyRageTriggered = true;
                addLog(`${eObj.name} enters a primal rage! (+50% DMG, +40% CRIT)`);
              }
            }
          }

          // Floresiensis enemy: reflex auto-evade kevés hp-nél
          let enemyAutoEvade = false;
          if (ePrefix === 'f' && (state.enemyHp / eObj.maxHp) < 0.25) {
            if (Math.random() < 0.50) enemyAutoEvade = true;
          }

          if (enemyAutoEvade) {
            setPlayerDmgText({ val: 'EVADED!', color: 'text-stone-400' });
            addLog(`${eObj.name} vanishes into shadow — attack evaded!`);
            await delay(400);
            setPlayerDmgText(null);
            setEnemyAnim(null);
            // átugorja a következő körre a játékos ütése nélkül
          } else {
            let isCrit = Math.random() * 100 < eObj.stats.luck;
            if (eObj.category === 'Heavy') {
              isCrit = Math.random() * 100 < Math.min(25, eObj.stats.luck * 0.3); // max 25% krit
            }

            // Homo Sapiens enemy: +25% első ütésnél
            let enemyIncomingDmg = (eObj.stats.strength * 2.5 + 10) * (0.9 + Math.random() * 0.2);
            if (ePrefix === 'hs' && !state.enemySapiensFirstHitUsed) {
              enemyIncomingDmg *= 1.25;
              state.enemySapiensFirstHitUsed = true;
              addLog(`${eObj.name} exploits their superior intellect! First strike +25%`);
            }

            // Neanderthal enemy rage boost
            const enemyRageActive = state.enemyRageTurns > 0;
            if (enemyRageActive) {
              enemyIncomingDmg *= 1.50;
              isCrit = isCrit || Math.random() * 100 < 40;
              state.enemyRageTurns -= 1;
            }

            if (isCrit) enemyIncomingDmg *= 2;

            const effectiveArmor = pObj.stats.armor + (pObj.lvl * 3);

            // A páncél csökkenés logaritmikus skálázása
            const armorReductionMult = 100 / (100 + effectiveArmor);
            let reducedDmg = enemyIncomingDmg * armorReductionMult;

            const defReduction = Math.min(0.75, pObj.stats.resistance / 100);

            let dmg = Math.floor(reducedDmg * (1 - defReduction));
            dmg = Math.max(1, dmg); // minimum 1 sebzés

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

            // Neanderthal: rage
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

            await delay(400);
            setPlayerAnim(null);
            setPlayerDmgText(null);
          } // end enemyAutoEvade else
        }

        // GYŐZELEM ellenőrzése
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
      let endpoint = isWin ? '/api/inventory/quest/claim' : '/api/inventory/quest/fail';
      const achData = {
        maxCrits: combatState.current.maxConsecutiveCrits || 0,
        flawlessWin: isWin && combatState.current.playerHp === combatState.current.playerObj.maxHp,
        enemyEncountered: combatState.current.isArena ? null : combatState.current.enemyObj?.name
      };

      let payload = { achievementsData: achData };

      if (combatState.current.isArena) {
        endpoint = '/api/arena/claim';
        payload.isWin = isWin;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined
      });
      const data = await res.json();
      if (isWin && data.success) {
        if (data.rewards) setRewards(data.rewards);
        if (data.stolenItem) setRewards(prev => ({ ...prev, stolenItem: data.stolenItem }));
      }
    } catch (e) {
      console.error("Failed handling quest/arena end:", e);
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

        {/* VS Header — középre igazított */}
        <h1 className="text-3xl text-stone-200 tracking-[0.4em] uppercase text-center mb-5 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
          VS
        </h1>

        {/* Main arena row */}
        <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-start justify-center w-full">

          {/* ── PLAYER CARD ── */}
          <div className="flex-1 flex flex-col items-center min-w-0 bg-black/40 border border-stone-700/50 rounded-2xl p-4 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            <h2 className="text-lg text-amber-400 uppercase tracking-widest mb-2 drop-shadow-[0_1px_6px_rgba(0,0,0,1)]">{player.name}</h2>

            {/* Health Bar */}
            <div className="w-full max-w-[260px] mb-4">
              <div className="flex text-[10px] text-stone-400 mb-1 justify-center">
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
            <h2 className="text-lg text-red-400 uppercase tracking-widest mb-2 drop-shadow-[0_1px_6px_rgba(0,0,0,1)]">{enemy.name}</h2>

            {/* Health Bar */}
            <div className="w-full max-w-[260px] mb-4">
              <div className="flex text-[10px] text-stone-400 mb-1 justify-center">
                <span>{enemy.hp} / {enemy.maxHp} HP</span>
              </div>
              <div className="w-full h-2.5 bg-black/60 border border-stone-700/60 rounded-full overflow-hidden flex justify-end">
                <div
                  className="h-full bg-gradient-to-l from-red-700 to-red-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Avatar frame — négyzet alakú */}
            <div
              className="relative flex items-center justify-center mb-4 rounded-xl border-2 border-red-900/40 shadow-[0_0_30px_rgba(0,0,0,0.7),inset_0_0_20px_rgba(0,0,0,0.4)] bg-black/25"
              style={{ width: '220px', height: '220px' }}
            >
              {enemyAnim === 'hit' && (
                <img src={damageLeft} alt="Hit"
                  className="absolute inset-0 w-full h-full object-contain z-40 pointer-events-none"
                  style={{ animation: 'fadeInOut 0.7s ease-in-out forwards' }} />
              )}
              {(enemy.isDungeonHuman || enemy.isArenaHuman) ? (
                <div style={{ width: '210px', height: '210px', position: 'relative', overflow: 'visible' }}>
                  <PlayerPortrait
                    className={
                      enemy.isArenaHuman
                        ? (enemy.class || 'Neanderthal')
                        : (enemy.enemyPrefix === 'n' ? 'Neanderthal' : enemy.enemyPrefix === 'hs' ? 'Sapiens' : 'Floresiensis')
                    }
                    hairStyle={enemy.isArenaHuman ? (enemy.hairStyle || 0) : 5}
                    beardStyle={enemy.isArenaHuman ? (enemy.beardStyle || 0) : 5}
                  />
                </div>
              ) : (
                <img
                  src={`/src/assets/design/covers/enemy_covers/final_imgs/${enemy.iconPath}`}
                  alt={enemy.name}
                  style={{ maxHeight: '210px', maxWidth: '210px', width: 'auto', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.9))' }}
                />
              )}
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

            {/* Enemy Statok */}
            <div className="w-full max-w-[240px] bg-black/40 border border-stone-800/60 p-3 rounded-xl text-[11px] font-bold flex flex-col gap-1 shadow-inner">
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Type</span> <span className={`capitalize ${enemy.type !== 'none' ? 'text-purple-400' : 'text-stone-400'}`}>{enemy.type}</span></div>
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Strength</span> <span className="text-stone-300">{enemy.stats.strength}</span></div>
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Agility</span> <span className="text-stone-300">{enemy.stats.agility}</span></div>
              <div className="flex justify-between"><span className="text-stone-500 uppercase">Luck</span> <span className="text-stone-300">{enemy.stats.luck}</span></div>
              <div className="flex justify-between border-t border-stone-800 pt-1 mt-1"><span className="text-stone-500 uppercase">Resistance</span> <span className="text-stone-300">{enemy.stats.resistance}</span></div>
            </div>
          </div>

        </div>
      </div>

      {/* Győzelem / Vereség Modal */}
      {(gameState === 'victory' || gameState === 'defeat') && (
        <div className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center backdrop-blur-md">
          <div className="bg-stone-950/95 border border-stone-800 p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full text-center mx-4">
            <h2 className={`text-4xl uppercase tracking-widest mb-4 ${gameState === 'victory' ? 'text-green-400' : 'text-red-400'}`}>
              {gameState}
            </h2>
            <p className="text-stone-400 mb-6 font-medium text-sm">
              {gameState === 'victory'
                ? `You have vanquished ${enemy.name} and proved your might!`
                : `You have fallen to ${enemy.name}. Rest and try again.`}
            </p>
            {gameState === 'victory' && rewards && (
              <div className="flex flex-col mb-8 gap-4 w-full">
                {rewards.normal !== undefined && (
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
                )}
                {rewards.stolenItem && (
                  <div className="bg-amber-900/30 border border-amber-500/50 p-4 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <span className="text-[11px] text-amber-500 uppercase font-black tracking-[0.2em] block mb-2">Item Stolen!</span>
                    <div className="flex items-center gap-3 justify-center">
                      <div className="w-12 h-12 bg-black/60 rounded border border-amber-500/40 flex items-center justify-center p-1">
                        {rewards.stolenItem.iconPath ? (
                          <img src={`/src/assets/design/items/${rewards.stolenItem.type === 'weapon' ? 'weapon/' + (rewards.stolenItem.rarity || 'common') + '/' : rewards.stolenItem.type === 'armor' ? 'armor/' + (rewards.stolenItem.rarity || 'common') + '/' : rewards.stolenItem.type === 'misc' ? 'misc/' : 'food/heal/'}${rewards.stolenItem.iconPath}`} alt="stolen" className="object-contain w-full h-full" />
                        ) : '🎁'}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-amber-100">{rewards.stolenItem.name}</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-60">Rarity: {rewards.stolenItem.rarity || 'Common'}</div>
                      </div>
                    </div>
                  </div>
                )}
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
              <div className="mb-8 text-stone-500 text-sm uppercase tracking-widest">Earned Nothing</div>
            )}
            <button
              onClick={handleFinish}
              className="px-8 py-4 bg-amber-800 hover:bg-amber-700 border-2 border-amber-600 text-amber-100 rounded-xl uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(180,83,9,0.4)] active:scale-95 w-full"
            >
              Continue Journey
            </button>
          </div>
        </div>
      )}

      {/* Az animációk */}
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

