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
  type: 'start' | 'big_hit' | 'low_hp' | 'comeback' | 'finish' | 'pit_fall' | 'wall_slam' | 'banter';
  message: string;
  speaker: 'chuck' | 'frank' | 'both';
  excitement: number; // 1-10
}

// Commentary line generators
const COMMENTARY = {
  start: {
    chuck: [
      (b1: string, b2: string) => `Good evening folks, I'm Chuck Sterling and WELCOME to the Battlebot Championship Series! Tonight: ${b1} versus ${b2}!`,
      (b1: string, b2: string) => `Ladies and gentlemen, this is the moment you've been waiting for. ${b1} takes on ${b2} in what promises to be an ABSOLUTE DEMOLITION DERBY.`,
      (b1: string, b2: string) => `From the Thunderdome, it's ${b1} facing off against ${b2}. I haven't been this excited since they legalized competitive robot combat in international waters.`,
    ],
    frank: [
      () => `That's right Chuck, and I'm Frank "The Tank" Mulligan. I once saw a bot like this eat a whole engine block. True story.`,
      () => `Chuck, I'm so excited I could cry. Actually, I am crying. These are tears of pure mechanical joy.`,
      () => `You know Chuck, my grandmother always said "Frank, robot fighting is the only true sport." She was a wise woman. She was also a toaster.`,
    ],
  },
  bigHit: {
    chuck: [
      (attacker: string, defender: string, dmg: number) => `OH! ${attacker} CONNECTS with a devastating blow! ${Math.round(dmg)} damage to ${defender}!`,
      (attacker: string, defender: string, dmg: number) => `WHAT A HIT! ${attacker} absolutely CRUSHES ${defender}! That's ${Math.round(dmg)} points of pure destruction!`,
      (attacker: string, defender: string, dmg: number) => `${attacker} with the MASSIVE strike! ${defender} is reeling from ${Math.round(dmg)} damage!`,
      (attacker: string, _d: string, dmg: number) => `BOOM! ${attacker} unleashes ${Math.round(dmg)} damage worth of PAIN!`,
    ],
    frank: [
      (attacker: string, _d: string, _dmg: number) => `That's a bold strategy, Cotton— I mean Chuck. ${attacker} is really committing to the "hit them until they stop moving" approach.`,
      (_a: string, _d: string, _dmg: number) => `You know, in my experience, getting hit like that usually hurts. A lot.`,
      (attacker: string, _d: string, _dmg: number) => `${attacker} is fighting like they owe someone money. Beautiful.`,
      (_a: string, _d: string, _dmg: number) => `Ooooh, that's gonna leave a mark. And by mark, I mean a crater.`,
      (_a: string, _d: string, _dmg: number) => `I felt that one in MY chassis, and I don't even have one!`,
      (_a: string, defender: string, _dmg: number) => `${defender}'s insurance premiums just went up. Significantly.`,
    ],
  },
  lowHp: {
    chuck: [
      (bot: string, hp: number) => `${bot} is in SERIOUS trouble now! Only ${hp} HP remaining!`,
      (bot: string, hp: number) => `This could be it for ${bot}! ${hp} HP left and fading fast!`,
      (bot: string, hp: number) => `${bot} is hanging on by a thread with just ${hp} HP!`,
    ],
    frank: [
      (bot: string) => `${bot} is starting to smoke. That's either damage or they're cooking something in there.`,
      (bot: string) => `At this point, ${bot} is held together by hopes, dreams, and what appears to be duct tape.`,
      (bot: string) => `${bot} looking like me after Thanksgiving dinner. Barely operational.`,
      () => `You know what they say: what doesn't kill you makes you... slightly more dented.`,
      (bot: string) => `${bot}'s check engine light has been on for the last three rounds. They're ignoring it. Bold.`,
    ],
  },
  pitFall: {
    chuck: [
      (bot: string) => `OH NO! ${bot} HAS FALLEN INTO THE PIT! IT'S ALL OVER!`,
      (bot: string) => `${bot} GOES INTO THE PIT! THAT'S A KNOCKOUT!`,
      (bot: string) => `INTO THE ABYSS! ${bot} is GONE!`,
    ],
    frank: [
      (bot: string) => `And ${bot} discovers what I like to call "the floor's suggestion box." Suggestions are final.`,
      () => `That's not flying, that's falling with style... into a pit... with no return.`,
      () => `Gravity: 1, Robot: 0. Tale as old as time.`,
      (bot: string) => `${bot} just took the express elevator to the basement. The basement has no floors.`,
    ],
  },
  wallSlam: {
    chuck: [
      (bot: string) => `${bot} SLAMS into the arena wall! That's gotta hurt!`,
      (bot: string) => `${bot} just made VIOLENT contact with the wall!`,
    ],
    frank: [
      () => `That wall came out of NOWHERE. In the wall's defense, it was just standing there.`,
      (bot: string) => `${bot} testing the structural integrity of our arena. Results: the wall wins.`,
      () => `Fun fact: that wall is undefeated. 847 wins, 0 losses.`,
      () => `And THAT'S why we have the big walls, folks. Entertainment AND safety.`,
    ],
  },
  finish: {
    chuck: [
      (winner: string, hp: number) => `IT'S OVER! ${winner} WINS with ${hp} HP remaining! WHAT A BATTLE!`,
      (winner: string, hp: number) => `${winner} IS VICTORIOUS! They survive with ${hp} HP! The crowd goes WILD!`,
      (winner: string, _hp: number) => `THE WINNER IS ${winner.toUpperCase()}! ABSOLUTE DOMINATION!`,
    ],
    frank: [
      (winner: string) => `${winner} proving once again that violence IS the answer. At least in robot combat.`,
      () => `And that, folks, is why I got into broadcasting. Too scared to actually fight robots.`,
      () => `Beautiful. Just beautiful. I'm not crying, you're crying. Actually I am crying.`,
      (winner: string) => `${winner} played that like a fiddle. A fiddle made of steel and hatred.`,
    ],
    draw: [
      () => `IT'S A DRAW! MUTUAL DESTRUCTION! Both bots have been eliminated!`,
      () => `DOUBLE KNOCKOUT! Neither bot survives! This is UNPRECEDENTED!`,
    ],
  },
  banter: [
    { speaker: 'frank' as const, line: `You know Chuck, I used to date a battlebot. Didn't work out. She was too high-maintenance.` },
    { speaker: 'chuck' as const, line: `Let's keep it professional, Frank.` },
    { speaker: 'frank' as const, line: `I'm sensing some tension out there. Either that or someone forgot to oil their joints.` },
    { speaker: 'chuck' as const, line: `The strategy here is fascinating. It appears to be "attack relentlessly."` },
    { speaker: 'frank' as const, line: `Bold strategy. I once tried that in a relationship. Similar results.` },
    { speaker: 'frank' as const, line: `This is like watching poetry. Violent, metallic poetry.` },
    { speaker: 'chuck' as const, line: `The engineering on display here is truly remarkable.` },
    { speaker: 'frank' as const, line: `Almost as remarkable as my fantasy battlebot league. I'm in last place, Chuck.` },
    { speaker: 'frank' as const, line: `If you can dodge a wrench, you can dodge a spinning blade of death.` },
    { speaker: 'chuck' as const, line: `I don't think that's how that saying goes, Frank.` },
    { speaker: 'frank' as const, line: `It's like watching two shopping carts fight in a parking lot. Beautiful.` },
    { speaker: 'frank' as const, line: `My doctor says I shouldn't get this excited. Worth it.` },
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Data definitions
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

  // Helper to add commentary
  function addCommentary(
    timestamp: number,
    type: CommentaryEvent['type'],
    message: string,
    speaker: CommentaryEvent['speaker'],
    excitement: number
  ) {
    commentary.push({ timestamp, type, message, speaker, excitement });
  }

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

  // Opening commentary - Chuck introduces, Frank follows up
  addCommentary(0, 'start', pick(COMMENTARY.start.chuck)(bot1.name, bot2.name), 'chuck', 8);
  addCommentary(800, 'start', pick(COMMENTARY.start.frank)(), 'frank', 7);

  // Simulation loop
  let timeElapsed = 0;
  let frameCount = 0;
  const deltaTime = 1000 / 60;
  const maxDuration = 60000;
  let lastCommentaryTime = 800;
  let lowHpWarned: Set<string> = new Set();
  let banterCount = 0;
  const maxBanter = 3;

  while (timeElapsed < maxDuration) {
    frameCount++;
    timeElapsed += deltaTime;

    // Random banter
    if (banterCount < maxBanter && timeElapsed > 5000 && Math.random() < 0.0003 && timeElapsed - lastCommentaryTime > 4000) {
      const banter = pick(COMMENTARY.banter);
      addCommentary(timeElapsed, 'banter', banter.line, banter.speaker, 5);
      lastCommentaryTime = timeElapsed;
      banterCount++;
    }

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
              if (actual > 12 && timeElapsed - lastCommentaryTime > 2500) {
                addCommentary(
                  timeElapsed,
                  'big_hit',
                  pick(COMMENTARY.bigHit.chuck)(attacker.name, defender.name, actual),
                  'chuck',
                  Math.min(10, Math.floor(actual / 4) + 6)
                );
                lastCommentaryTime = timeElapsed;

                // Frank follow-up on really big hits
                if (actual > 20 && Math.random() > 0.4) {
                  addCommentary(
                    timeElapsed + 600,
                    'big_hit',
                    pick(COMMENTARY.bigHit.frank)(attacker.name, defender.name, actual),
                    'frank',
                    Math.min(10, Math.floor(actual / 5) + 5)
                  );
                }
              }

              // Low HP commentary
              if (defender.hp > 0 && defender.hp < defender.maxHp * 0.25 && !lowHpWarned.has(defender.id)) {
                lowHpWarned.add(defender.id);
                addCommentary(
                  timeElapsed + 200,
                  'low_hp',
                  pick(COMMENTARY.lowHp.chuck)(defender.name, Math.round(defender.hp)),
                  'chuck',
                  8
                );
                addCommentary(
                  timeElapsed + 900,
                  'low_hp',
                  pick(COMMENTARY.lowHp.frank)(defender.name),
                  'frank',
                  7
                );
                lastCommentaryTime = timeElapsed + 900;
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

            if (damage > 8 && timeElapsed - lastCommentaryTime > 3000) {
              addCommentary(timeElapsed, 'wall_slam', pick(COMMENTARY.wallSlam.chuck)(bot.name), 'chuck', 6);
              if (Math.random() > 0.5) {
                addCommentary(timeElapsed + 500, 'wall_slam', pick(COMMENTARY.wallSlam.frank)(bot.name), 'frank', 5);
              }
              lastCommentaryTime = timeElapsed + 500;
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
          addCommentary(timeElapsed, 'pit_fall', pick(COMMENTARY.pitFall.chuck)(bot.name), 'chuck', 10);
          addCommentary(timeElapsed + 600, 'pit_fall', pick(COMMENTARY.pitFall.frank)(bot.name), 'frank', 9);
          lastCommentaryTime = timeElapsed + 600;
        }
      }
    }

    // Check win condition
    const alive = bots.filter(b => b.isAlive);
    if (alive.length <= 1) break;
  }

  // Final commentary
  const winner = bots.find(b => b.isAlive);
  if (winner) {
    addCommentary(timeElapsed, 'finish', pick(COMMENTARY.finish.chuck)(winner.name, Math.round(winner.hp)), 'chuck', 10);
    addCommentary(timeElapsed + 800, 'finish', pick(COMMENTARY.finish.frank)(winner.name), 'frank', 9);
  } else {
    addCommentary(timeElapsed, 'finish', pick(COMMENTARY.finish.draw)(), 'both', 10);
  }

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
