import Matter from 'matter-js';

// Types
export interface Vector2 {
  x: number;
  y: number;
}

export interface BotConfig {
  id: string;
  name: string;
  chassisId: string;
  weaponIds: string[];
  armorId: string | null;
  aiConfig: {
    primaryBehavior: string;
    secondaryBehavior: string | null;
    aggression: number;
    engagementDistance: number;
  };
  color: string;
  script?: string;
}

export interface BotState {
  id: string;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  position: Vector2;
  finalAction?: string;
}

export interface BattleResult {
  winner: string | null;
  duration: number;
  finalStates: BotState[];
  damageLog: DamageEvent[];
  frameCount: number;
  commentary: CommentaryEvent[];
}

export interface DamageEvent {
  attackerId: string;
  targetId: string;
  damage: number;
  weaponType: string;
  timestamp: number;
}

export interface CommentaryEvent {
  timestamp: number;
  type: 'start' | 'big_hit' | 'low_hp' | 'comeback' | 'finish' | 'pit_fall' | 'wall_slam';
  message: string;
  excitement: number; // 1-10
}

// Data definitions (simplified for API)
const CHASSIS: Record<string, { baseHP: number; baseSpeed: number; weight: number; size: number }> = {
  scout: { baseHP: 60, baseSpeed: 8, weight: 50, size: 20 },
  brawler: { baseHP: 100, baseSpeed: 5, weight: 100, size: 25 },
  tank: { baseHP: 150, baseSpeed: 3, weight: 200, size: 35 },
  speedster: { baseHP: 50, baseSpeed: 10, weight: 40, size: 18 },
  heavyweight: { baseHP: 180, baseSpeed: 2, weight: 280, size: 40 },
};

const WEAPONS: Record<string, { baseDamage: number; weight: number; cooldown: number; type: string }> = {
  miniSpinner: { baseDamage: 8, weight: 15, cooldown: 0, type: 'spinner' },
  basicFlipper: { baseDamage: 12, weight: 20, cooldown: 2000, type: 'flipper' },
  spikeHammer: { baseDamage: 25, weight: 30, cooldown: 3000, type: 'hammer' },
  basicWedge: { baseDamage: 5, weight: 25, cooldown: 0, type: 'wedge' },
  buzzer: { baseDamage: 15, weight: 25, cooldown: 500, type: 'saw' },
  heavySpinner: { baseDamage: 18, weight: 35, cooldown: 0, type: 'spinner' },
  powerFlipper: { baseDamage: 20, weight: 35, cooldown: 2500, type: 'flipper' },
  crushingHammer: { baseDamage: 40, weight: 50, cooldown: 4000, type: 'hammer' },
};

const ARMOR: Record<string, { damageReduction: number; weight: number }> = {
  lightPlating: { damageReduction: 0.1, weight: 10 },
  steelPlating: { damageReduction: 0.2, weight: 25 },
  compositePlating: { damageReduction: 0.25, weight: 30 },
  titaniumShell: { damageReduction: 0.35, weight: 50 },
};

const ARENAS: Record<string, { width: number; height: number; wallThickness: number; hazards: any[] }> = {
  basicPit: {
    width: 800, height: 600, wallThickness: 20,
    hazards: [{ type: 'pit', position: { x: 400, y: 300 }, size: { x: 80, y: 80 } }],
  },
  warzone: {
    width: 900, height: 700, wallThickness: 25,
    hazards: [
      { type: 'spike', position: { x: 200, y: 200 }, size: { x: 60, y: 60 } },
      { type: 'spike', position: { x: 700, y: 500 }, size: { x: 60, y: 60 } },
    ],
  },
  thunderdome: {
    width: 600, height: 600, wallThickness: 30,
    hazards: [],
  },
};

// Script parsing and execution
interface ScriptRule {
  condition: string;
  action: string;
}

interface ParsedScript {
  rules: ScriptRule[];
  defaultAction: string;
  isValid: boolean;
}

function parseScript(code: string): ParsedScript {
  const rules: ScriptRule[] = [];
  let defaultAction = 'approach';

  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

  for (const line of lines) {
    if (line.startsWith('WHEN ')) {
      const match = line.match(/^WHEN\s+(.+?)\s+DO\s+(\w+)$/i);
      if (match) {
        rules.push({ condition: match[1], action: match[2] });
      }
    } else if (line.startsWith('DEFAULT ')) {
      const match = line.match(/^DEFAULT\s+(\w+)$/i);
      if (match) {
        defaultAction = match[1];
      }
    }
  }

  return { rules, defaultAction, isValid: true };
}

interface ScriptContext {
  distanceToEnemy: number;
  myHp: number;
  myHpPercent: number;
  enemyHp: number;
  enemyHpPercent: number;
  mySpeed: number;
  enemySpeed: number;
  myWeight: number;
  enemyWeight: number;
  distanceToWall: number;
  distanceToCenter: number;
}

function evaluateCondition(condition: string, ctx: ScriptContext): boolean {
  // Replace variables with values
  let expr = condition
    .replace(/distance_to_enemy/g, ctx.distanceToEnemy.toString())
    .replace(/my_hp_percent/g, ctx.myHpPercent.toString())
    .replace(/my_hp/g, ctx.myHp.toString())
    .replace(/enemy_hp_percent/g, ctx.enemyHpPercent.toString())
    .replace(/enemy_hp/g, ctx.enemyHp.toString())
    .replace(/distance_to_wall/g, ctx.distanceToWall.toString())
    .replace(/distance_to_center/g, ctx.distanceToCenter.toString())
    .replace(/i_am_faster/g, (ctx.mySpeed > ctx.enemySpeed).toString())
    .replace(/i_am_heavier/g, (ctx.myWeight > ctx.enemyWeight).toString());

  // Handle AND/OR
  expr = expr.replace(/\bAND\b/gi, '&&').replace(/\bOR\b/gi, '||');

  try {
    return Function(`"use strict"; return (${expr});`)();
  } catch {
    return false;
  }
}

function executeScript(script: ParsedScript, ctx: ScriptContext): string {
  for (const rule of script.rules) {
    if (evaluateCondition(rule.condition, ctx)) {
      return rule.action;
    }
  }
  return script.defaultAction;
}

// Headless bot
interface HeadlessBot {
  id: string;
  name: string;
  config: BotConfig;
  body: Matter.Body;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  speed: number;
  weight: number;
  damageReduction: number;
  script: ParsedScript;
  weaponCooldowns: Map<string, number>;
  lastAction: string;
}

// Main battle runner
export function runHeadlessBattle(playerBot: BotConfig, opponentBot: BotConfig, arenaId: string): BattleResult {
  const arena = ARENAS[arenaId] || ARENAS.basicPit;
  const commentary: CommentaryEvent[] = [];
  const damageLog: DamageEvent[] = [];

  // Create Matter.js engine
  const engine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });

  // Create walls
  const walls = [
    Matter.Bodies.rectangle(arena.width / 2, arena.wallThickness / 2, arena.width, arena.wallThickness, { isStatic: true, label: 'wall' }),
    Matter.Bodies.rectangle(arena.width / 2, arena.height - arena.wallThickness / 2, arena.width, arena.wallThickness, { isStatic: true, label: 'wall' }),
    Matter.Bodies.rectangle(arena.wallThickness / 2, arena.height / 2, arena.wallThickness, arena.height, { isStatic: true, label: 'wall' }),
    Matter.Bodies.rectangle(arena.width - arena.wallThickness / 2, arena.height / 2, arena.wallThickness, arena.height, { isStatic: true, label: 'wall' }),
  ];
  Matter.Composite.add(engine.world, walls);

  // Create hazards
  for (const hazard of arena.hazards) {
    const body = Matter.Bodies.rectangle(hazard.position.x, hazard.position.y, hazard.size.x, hazard.size.y, {
      isStatic: true,
      isSensor: true,
      label: `hazard_${hazard.type}`,
    });
    Matter.Composite.add(engine.world, body);
  }

  // Helper to create bot
  function createBot(config: BotConfig, position: Vector2): HeadlessBot {
    const chassis = CHASSIS[config.chassisId] || CHASSIS.brawler;
    let totalWeight = chassis.weight;
    let damageReduction = 0;

    for (const wid of config.weaponIds) {
      const w = WEAPONS[wid];
      if (w) totalWeight += w.weight;
    }
    if (config.armorId) {
      const a = ARMOR[config.armorId];
      if (a) {
        totalWeight += a.weight;
        damageReduction = a.damageReduction;
      }
    }

    const speed = chassis.baseSpeed * (100 / totalWeight);
    const body = Matter.Bodies.circle(position.x, position.y, chassis.size, {
      label: `bot_${config.id}`,
      friction: 0.1,
      frictionAir: 0.05,
      restitution: 0.8,
    });
    Matter.Body.setMass(body, totalWeight);
    Matter.Composite.add(engine.world, body);

    const script = config.script ? parseScript(config.script) : parseScript('DEFAULT approach');

    return {
      id: config.id,
      name: config.name,
      config,
      body,
      hp: chassis.baseHP,
      maxHp: chassis.baseHP,
      isAlive: true,
      speed,
      weight: totalWeight,
      damageReduction,
      script,
      weaponCooldowns: new Map(),
      lastAction: 'idle',
    };
  }

  // Create bots
  const bot1 = createBot(playerBot, { x: arena.width * 0.25, y: arena.height / 2 });
  const bot2 = createBot(opponentBot, { x: arena.width * 0.75, y: arena.height / 2 });
  const bots = [bot1, bot2];

  // Opening commentary
  commentary.push({
    timestamp: 0,
    type: 'start',
    message: `${bot1.name} vs ${bot2.name}! Let's see who has the better strategy!`,
    excitement: 7,
  });

  // Simulation loop
  let timeElapsed = 0;
  let frameCount = 0;
  const deltaTime = 1000 / 60;
  const maxDuration = 60000;
  let lastCommentaryTime = 0;

  while (timeElapsed < maxDuration) {
    frameCount++;
    timeElapsed += deltaTime;

    // Update each bot's AI
    for (let i = 0; i < bots.length; i++) {
      const bot = bots[i];
      if (!bot.isAlive) continue;

      const target = bots[(i + 1) % 2];
      if (!target.isAlive) continue;

      // Build context
      const dx = target.body.position.x - bot.body.position.x;
      const dy = target.body.position.y - bot.body.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const toEnemy = distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 1, y: 0 };

      const ctx: ScriptContext = {
        distanceToEnemy: distance,
        myHp: bot.hp,
        myHpPercent: (bot.hp / bot.maxHp) * 100,
        enemyHp: target.hp,
        enemyHpPercent: (target.hp / target.maxHp) * 100,
        mySpeed: bot.speed,
        enemySpeed: target.speed,
        myWeight: bot.weight,
        enemyWeight: target.weight,
        distanceToWall: Math.min(
          bot.body.position.x,
          arena.width - bot.body.position.x,
          bot.body.position.y,
          arena.height - bot.body.position.y
        ),
        distanceToCenter: Math.sqrt(
          Math.pow(bot.body.position.x - arena.width / 2, 2) +
          Math.pow(bot.body.position.y - arena.height / 2, 2)
        ),
      };

      // Execute script
      const action = executeScript(bot.script, ctx);
      bot.lastAction = action;

      // Apply movement
      let moveDir: Vector2 = { x: 0, y: 0 };
      switch (action) {
        case 'attack':
          moveDir = toEnemy;
          break;
        case 'retreat':
          moveDir = { x: -toEnemy.x, y: -toEnemy.y };
          break;
        case 'circle_left':
          moveDir = { x: toEnemy.x * 0.3 - toEnemy.y * 0.7, y: toEnemy.y * 0.3 + toEnemy.x * 0.7 };
          break;
        case 'circle_right':
          moveDir = { x: toEnemy.x * 0.3 + toEnemy.y * 0.7, y: toEnemy.y * 0.3 - toEnemy.x * 0.7 };
          break;
        case 'ram':
          moveDir = { x: toEnemy.x * 1.5, y: toEnemy.y * 1.5 };
          break;
        case 'flank':
          if (distance > 100) {
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            moveDir = { x: Math.cos(angle) * 0.7 + toEnemy.x * 0.3, y: Math.sin(angle) * 0.7 + toEnemy.y * 0.3 };
          } else {
            moveDir = toEnemy;
          }
          break;
        case 'flee_to_center':
          const cx = arena.width / 2 - bot.body.position.x;
          const cy = arena.height / 2 - bot.body.position.y;
          const cd = Math.sqrt(cx * cx + cy * cy);
          moveDir = cd > 10 ? { x: cx / cd, y: cy / cd } : { x: 0, y: 0 };
          break;
        default:
          moveDir = distance > 150 ? toEnemy : { x: toEnemy.x * 0.5, y: toEnemy.y * 0.5 };
      }

      // Normalize and apply
      const mag = Math.sqrt(moveDir.x * moveDir.x + moveDir.y * moveDir.y);
      if (mag > 0) {
        moveDir.x /= mag;
        moveDir.y /= mag;
      }
      const force = 0.001 * bot.speed;
      Matter.Body.applyForce(bot.body, bot.body.position, { x: moveDir.x * force, y: moveDir.y * force });

      // Update cooldowns
      for (const [wid, cd] of bot.weaponCooldowns) {
        if (cd > 0) bot.weaponCooldowns.set(wid, cd - deltaTime);
      }
    }

    // Update physics
    Matter.Engine.update(engine, deltaTime);

    // Check collisions
    const pairs = Matter.Detector.collisions(
      Matter.Detector.create({ bodies: Matter.Composite.allBodies(engine.world) })
    );

    for (const pair of pairs) {
      const labelA = pair.bodyA.label;
      const labelB = pair.bodyB.label;

      // Bot vs Bot
      if (labelA.startsWith('bot_') && labelB.startsWith('bot_')) {
        const botA = bots.find(b => `bot_${b.id}` === labelA);
        const botB = bots.find(b => `bot_${b.id}` === labelB);
        if (botA && botB && botA.isAlive && botB.isAlive) {
          const vel = Math.sqrt(
            Math.pow(pair.bodyA.velocity.x - pair.bodyB.velocity.x, 2) +
            Math.pow(pair.bodyA.velocity.y - pair.bodyB.velocity.y, 2)
          );

          // Calculate damage
          for (const attacker of [botA, botB]) {
            const defender = attacker === botA ? botB : botA;
            let damage = 0;

            for (const wid of attacker.config.weaponIds) {
              const w = WEAPONS[wid];
              if (!w) continue;
              if (w.type === 'spinner') {
                damage += w.baseDamage * 0.1;
              } else if ((attacker.weaponCooldowns.get(wid) || 0) <= 0) {
                damage += w.baseDamage * (w.type === 'hammer' ? 1 + vel * 0.1 : 1);
                attacker.weaponCooldowns.set(wid, w.cooldown);
              }
            }

            // Momentum damage
            damage += vel * (attacker.weight / defender.weight) * 0.5;

            if (damage > 0) {
              const actual = damage * (1 - defender.damageReduction);
              defender.hp = Math.max(0, defender.hp - actual);

              damageLog.push({
                attackerId: attacker.id,
                targetId: defender.id,
                damage: actual,
                weaponType: attacker.config.weaponIds[0] || 'collision',
                timestamp: timeElapsed,
              });

              // Big hit commentary
              if (actual > 15 && timeElapsed - lastCommentaryTime > 2000) {
                commentary.push({
                  timestamp: timeElapsed,
                  type: 'big_hit',
                  message: `Massive hit! ${attacker.name} deals ${Math.round(actual)} damage to ${defender.name}!`,
                  excitement: Math.min(10, Math.floor(actual / 5) + 5),
                });
                lastCommentaryTime = timeElapsed;
              }

              // Low HP commentary
              if (defender.hp > 0 && defender.hp < defender.maxHp * 0.25 && timeElapsed - lastCommentaryTime > 3000) {
                commentary.push({
                  timestamp: timeElapsed,
                  type: 'low_hp',
                  message: `${defender.name} is in trouble! Only ${Math.round(defender.hp)} HP left!`,
                  excitement: 8,
                });
                lastCommentaryTime = timeElapsed;
              }

              if (defender.hp <= 0) {
                defender.isAlive = false;
              }
            }
          }
        }
      }

      // Bot vs Wall
      if ((labelA.startsWith('bot_') && labelB === 'wall') || (labelB.startsWith('bot_') && labelA === 'wall')) {
        const botLabel = labelA.startsWith('bot_') ? labelA : labelB;
        const bot = bots.find(b => `bot_${b.id}` === botLabel);
        if (bot && bot.isAlive) {
          const vel = Math.sqrt(bot.body.velocity.x ** 2 + bot.body.velocity.y ** 2);
          if (vel > 8) {
            const damage = (vel - 8) * 2 * (1 - bot.damageReduction);
            bot.hp = Math.max(0, bot.hp - damage);

            if (damage > 10 && timeElapsed - lastCommentaryTime > 2000) {
              commentary.push({
                timestamp: timeElapsed,
                type: 'wall_slam',
                message: `${bot.name} slams into the wall! That's gonna leave a dent!`,
                excitement: 6,
              });
              lastCommentaryTime = timeElapsed;
            }

            if (bot.hp <= 0) bot.isAlive = false;
          }
        }
      }

      // Bot vs Pit
      if ((labelA.startsWith('bot_') && labelB.startsWith('hazard_pit')) ||
          (labelB.startsWith('bot_') && labelA.startsWith('hazard_pit'))) {
        const botLabel = labelA.startsWith('bot_') ? labelA : labelB;
        const bot = bots.find(b => `bot_${b.id}` === botLabel);
        if (bot && bot.isAlive) {
          bot.hp = 0;
          bot.isAlive = false;
          commentary.push({
            timestamp: timeElapsed,
            type: 'pit_fall',
            message: `Oh no! ${bot.name} falls into the pit! It's over for them!`,
            excitement: 10,
          });
          lastCommentaryTime = timeElapsed;
        }
      }
    }

    // Check win condition
    const alive = bots.filter(b => b.isAlive);
    if (alive.length <= 1) break;
  }

  // Final commentary
  const winner = bots.find(b => b.isAlive);
  commentary.push({
    timestamp: timeElapsed,
    type: 'finish',
    message: winner
      ? `${winner.name} wins! What a battle! Final HP: ${Math.round(winner.hp)}/${winner.maxHp}`
      : "It's a draw! Both bots are destroyed!",
    excitement: 10,
  });

  // Cleanup
  Matter.Engine.clear(engine);

  return {
    winner: winner?.id || null,
    duration: timeElapsed,
    finalStates: bots.map(b => ({
      id: b.id,
      hp: Math.round(b.hp),
      maxHp: b.maxHp,
      isAlive: b.isAlive,
      position: { x: b.body.position.x, y: b.body.position.y },
      finalAction: b.lastAction,
    })),
    damageLog,
    frameCount,
    commentary,
  };
}
