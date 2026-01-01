import { Application, Container, Graphics } from 'pixi.js';
import Matter from 'matter-js';
import { PhysicsWorld } from './PhysicsWorld';
import { ParticleSystem } from './ParticleSystem';
import { SoundManager } from './SoundManager';
import { Bot } from '@/game/entities/Bot';
import { AIController } from '@/game/ai/AIController';
import { ScriptedAI } from '@/game/scripting/ScriptedAI';
import { ArenaConfig, BotConfig, GameState, DamageEvent } from '@/game/types';
import { getChassisById } from '@/data/chassis';
import { getWeaponById } from '@/data/weapons';
import { ReplayRecorder, ReplayData, ReplayBotInfo } from '@/game/replay/ReplaySystem';

export class GameEngine {
  private app: Application | null = null;
  private physics: PhysicsWorld;
  private gameContainer: Container | null = null;
  private arenaGraphics: Graphics | null = null;
  private particles: ParticleSystem | null = null;
  private isDestroyed: boolean = false;

  private bots: Map<string, Bot> = new Map();
  private aiControllers: Map<string, AIController> = new Map();
  private scriptedAIs: Map<string, ScriptedAI> = new Map();

  private state: GameState;
  private lastTime: number = 0;
  private onStateChange: ((state: GameState) => void) | null = null;
  private onDamageEvent: ((event: DamageEvent) => void) | null = null;

  // Replay system
  private replayRecorder: ReplayRecorder | null = null;
  private isRecording: boolean = false;
  private currentActionInfo: Map<string, { action: string; rule?: string }> = new Map();

  constructor() {
    this.physics = new PhysicsWorld();
    this.state = {
      arena: null as unknown as ArenaConfig,
      bots: [],
      isRunning: false,
      isPaused: false,
      winner: null,
      timeElapsed: 0,
    };
  }

  async initialize(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {
    const app = new Application();
    await app.init({
      canvas,
      width,
      height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Check if we were destroyed during async init
    if (this.isDestroyed) {
      // Engine was destroyed, clean up the app we just created
      try {
        app.destroy(true);
      } catch (e) {
        // Ignore
      }
      return;
    }

    this.app = app;
    this.gameContainer = new Container();
    this.app.stage.addChild(this.gameContainer);

    this.arenaGraphics = new Graphics();
    this.gameContainer.addChild(this.arenaGraphics);

    // Initialize particle system (added after arena so particles appear on top)
    this.particles = new ParticleSystem(this.gameContainer);

    // Setup collision handling
    this.setupCollisionHandling();
  }

  setupArena(config: ArenaConfig): void {
    this.state.arena = config;
    this.physics.setupArena(config);
    this.drawArena(config);

    // Resize canvas if needed
    if (this.app) {
      this.app.renderer.resize(config.width, config.height);
    }
  }

  private drawArena(config: ArenaConfig): void {
    if (!this.arenaGraphics) return;

    this.arenaGraphics.clear();

    // Floor
    this.arenaGraphics.rect(0, 0, config.width, config.height);
    this.arenaGraphics.fill({ color: config.backgroundColor });

    // Floor texture (grid lines for industrial look)
    this.arenaGraphics.setStrokeStyle({ width: 1, color: 0x2a2a3e });
    const gridSize = 50;
    for (let x = 0; x < config.width; x += gridSize) {
      this.arenaGraphics.moveTo(x, 0);
      this.arenaGraphics.lineTo(x, config.height);
      this.arenaGraphics.stroke();
    }
    for (let y = 0; y < config.height; y += gridSize) {
      this.arenaGraphics.moveTo(0, y);
      this.arenaGraphics.lineTo(config.width, y);
      this.arenaGraphics.stroke();
    }

    // Walls
    const { wallThickness } = config;
    this.arenaGraphics.rect(0, 0, config.width, wallThickness);
    this.arenaGraphics.fill({ color: 0x4a4a5a });
    this.arenaGraphics.rect(0, config.height - wallThickness, config.width, wallThickness);
    this.arenaGraphics.fill({ color: 0x4a4a5a });
    this.arenaGraphics.rect(0, 0, wallThickness, config.height);
    this.arenaGraphics.fill({ color: 0x4a4a5a });
    this.arenaGraphics.rect(config.width - wallThickness, 0, wallThickness, config.height);
    this.arenaGraphics.fill({ color: 0x4a4a5a });

    // Wall highlights (3D effect)
    this.arenaGraphics.rect(wallThickness, wallThickness, config.width - wallThickness * 2, 3);
    this.arenaGraphics.fill({ color: 0x6a6a7a });

    // Hazards
    for (const hazard of config.hazards) {
      if (hazard.type === 'pit') {
        // Dark pit with warning stripes
        this.arenaGraphics.rect(
          hazard.position.x - hazard.size.x / 2,
          hazard.position.y - hazard.size.y / 2,
          hazard.size.x,
          hazard.size.y
        );
        this.arenaGraphics.fill({ color: 0x000000 });

        // Warning border
        this.arenaGraphics.rect(
          hazard.position.x - hazard.size.x / 2 - 5,
          hazard.position.y - hazard.size.y / 2 - 5,
          hazard.size.x + 10,
          hazard.size.y + 10
        );
        this.arenaGraphics.stroke({ width: 3, color: 0xff4444 });
      } else if (hazard.type === 'spike') {
        this.arenaGraphics.rect(
          hazard.position.x - hazard.size.x / 2,
          hazard.position.y - hazard.size.y / 2,
          hazard.size.x,
          hazard.size.y
        );
        this.arenaGraphics.fill({ color: 0x442222 });
        // Spike markers
        for (let sx = 0; sx < hazard.size.x; sx += 20) {
          for (let sy = 0; sy < hazard.size.y; sy += 20) {
            this.arenaGraphics.circle(
              hazard.position.x - hazard.size.x / 2 + sx + 10,
              hazard.position.y - hazard.size.y / 2 + sy + 10,
              5
            );
            this.arenaGraphics.fill({ color: 0xaa4444 });
          }
        }
      }
    }
  }

  addBot(config: BotConfig, startPosition: { x: number; y: number }): Bot {
    const chassis = getChassisById(config.chassisId)!;

    // Create physics body
    const body = this.physics.createBotBody(
      config.id,
      startPosition,
      chassis.size,
      chassis.weight
    );

    // Create bot entity
    const bot = new Bot(config, body, startPosition);

    // Add to game container
    if (this.gameContainer) {
      this.gameContainer.addChild(bot.container);
    }

    // Create AI controller - use ScriptedAI if bot has a script, otherwise use behavior-based AI
    if (config.script) {
      const scriptedAI = new ScriptedAI(bot, config.script);
      if (this.state.arena) {
        scriptedAI.setArenaSize(this.state.arena.width, this.state.arena.height);
      }
      this.scriptedAIs.set(config.id, scriptedAI);
    } else {
      const ai = new AIController(bot);
      this.aiControllers.set(config.id, ai);
    }

    this.bots.set(config.id, bot);
    this.updateBotStates();

    return bot;
  }

  private setupCollisionHandling(): void {
    this.physics.onCollision((event) => {
      for (const pair of event.pairs) {
        this.handleCollision(pair);
      }
    });

    this.physics.onCollisionActive((event) => {
      for (const pair of event.pairs) {
        this.handleActiveCollision(pair);
      }
    });
  }

  private handleCollision(pair: Matter.Pair): void {
    const labelA = pair.bodyA.label;
    const labelB = pair.bodyB.label;

    // Bot vs Bot collision
    if (labelA.startsWith('bot_') && labelB.startsWith('bot_')) {
      const botAId = labelA.replace('bot_', '');
      const botBId = labelB.replace('bot_', '');
      const botA = this.bots.get(botAId);
      const botB = this.bots.get(botBId);

      if (botA && botB) {
        const relativeVelocity = Math.sqrt(
          Math.pow(pair.bodyA.velocity.x - pair.bodyB.velocity.x, 2) +
            Math.pow(pair.bodyA.velocity.y - pair.bodyB.velocity.y, 2)
        );

        // Emit collision particles and sound
        if (relativeVelocity > 2) {
          if (this.particles) {
            const collisionPoint = {
              x: (botA.state.position.x + botB.state.position.x) / 2,
              y: (botA.state.position.y + botB.state.position.y) / 2,
            };
            this.particles.emitCollision(
              collisionPoint.x,
              collisionPoint.y,
              relativeVelocity / 5
            );
          }
          // Play collision sound
          SoundManager.play('collision');
        }

        // Calculate collision damage based on velocity and weapons
        this.calculateAndApplyDamage(botA, botB, relativeVelocity);
        this.calculateAndApplyDamage(botB, botA, relativeVelocity);
      }
    }

    // Bot vs Wall collision
    if (
      (labelA.startsWith('bot_') && labelB === 'wall') ||
      (labelB.startsWith('bot_') && labelA === 'wall')
    ) {
      const botLabel = labelA.startsWith('bot_') ? labelA : labelB;
      const botId = botLabel.replace('bot_', '');
      const bot = this.bots.get(botId);

      if (bot) {
        const velocity = Math.sqrt(
          Math.pow(bot.body.velocity.x, 2) + Math.pow(bot.body.velocity.y, 2)
        );
        // Wall impact sparks and sound
        if (velocity > 5) {
          if (this.particles) {
            this.particles.emitSparks(
              bot.state.position.x,
              bot.state.position.y,
              Math.floor(velocity)
            );
          }
          SoundManager.play('wallHit');
        }
        // Wall impact damage
        if (velocity > 8) {
          const wallDamage = Math.floor((velocity - 8) * 2);
          bot.takeDamage(wallDamage);
        }
      }
    }

    // Bot vs Pit collision
    if (
      (labelA.startsWith('bot_') && labelB.startsWith('hazard_pit')) ||
      (labelB.startsWith('bot_') && labelA.startsWith('hazard_pit'))
    ) {
      const botLabel = labelA.startsWith('bot_') ? labelA : labelB;
      const botId = botLabel.replace('bot_', '');
      const bot = this.bots.get(botId);

      if (bot && bot.state.isAlive) {
        // Explosion effect and sound for pit fall
        if (this.particles) {
          this.particles.emitExplosion(bot.state.position.x, bot.state.position.y);
        }
        SoundManager.play('explosion');
        // Instant KO for pit
        bot.takeDamage(bot.state.maxHp);
      }
    }
  }

  private handleActiveCollision(pair: Matter.Pair): void {
    const labelA = pair.bodyA.label;
    const labelB = pair.bodyB.label;

    // Continuous damage for spinner weapons during contact
    if (labelA.startsWith('bot_') && labelB.startsWith('bot_')) {
      const botAId = labelA.replace('bot_', '');
      const botBId = labelB.replace('bot_', '');
      const botA = this.bots.get(botAId);
      const botB = this.bots.get(botBId);

      if (botA && botB) {
        this.applySpinnerDamage(botA, botB);
        this.applySpinnerDamage(botB, botA);
      }
    }

    // Continuous damage from spike hazards
    if (
      (labelA.startsWith('bot_') && labelB.startsWith('hazard_spike')) ||
      (labelB.startsWith('bot_') && labelA.startsWith('hazard_spike'))
    ) {
      const botLabel = labelA.startsWith('bot_') ? labelA : labelB;
      const botId = botLabel.replace('bot_', '');
      const bot = this.bots.get(botId);

      if (bot) {
        bot.takeDamage(0.5); // Gradual spike damage
      }
    }
  }

  private calculateAndApplyDamage(
    attacker: Bot,
    target: Bot,
    collisionVelocity: number
  ): void {
    let totalDamage = 0;

    for (const weaponId of attacker.config.weaponIds) {
      const weapon = getWeaponById(weaponId);
      if (!weapon) continue;

      // Skip spinners here (handled in active collision)
      if (weapon.type === 'spinner') continue;

      // Calculate damage based on weapon type and velocity
      let weaponDamage = weapon.baseDamage;

      switch (weapon.type) {
        case 'flipper':
          // Flipper does less damage but applies knockback
          if (attacker.canUseWeapon(weaponId)) {
            weaponDamage *= 0.5;
            const knockbackForce = 0.05;
            const direction = {
              x: target.state.position.x - attacker.state.position.x,
              y: target.state.position.y - attacker.state.position.y,
            };
            const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            Matter.Body.applyForce(target.body, target.body.position, {
              x: (direction.x / len) * knockbackForce,
              y: (direction.y / len) * knockbackForce - 0.03, // Upward flip
            });
            attacker.useWeapon(weaponId);
          }
          break;

        case 'hammer':
          // Hammer does big damage on cooldown
          if (attacker.canUseWeapon(weaponId)) {
            weaponDamage *= 1 + collisionVelocity * 0.1;
            attacker.useWeapon(weaponId);
          } else {
            weaponDamage = 0;
          }
          break;

        case 'saw':
          // Saw does consistent damage
          if (attacker.canUseWeapon(weaponId)) {
            attacker.useWeapon(weaponId);
          } else {
            weaponDamage *= 0.3;
          }
          break;

        case 'wedge':
          // Wedge does low damage but redirects
          weaponDamage *= 0.3;
          break;
      }

      totalDamage += weaponDamage;
    }

    // Add base collision damage from momentum
    const massFactor = attacker.getStats().weight / target.getStats().weight;
    const momentumDamage = collisionVelocity * massFactor * 0.5;
    totalDamage += momentumDamage;

    if (totalDamage > 0) {
      target.takeDamage(Math.floor(totalDamage));

      const damageEvent: DamageEvent = {
        attackerId: attacker.id,
        targetId: target.id,
        damage: totalDamage,
        knockback: { x: 0, y: 0 },
        weaponType: attacker.config.weaponIds[0] || 'collision',
        timestamp: this.state.timeElapsed,
      };

      // Record to replay
      if (this.isRecording && this.replayRecorder) {
        this.replayRecorder.recordEvent({
          type: 'damage',
          data: damageEvent,
        });
      }

      if (this.onDamageEvent) {
        this.onDamageEvent(damageEvent);
      }
    }
  }

  private applySpinnerDamage(attacker: Bot, target: Bot): void {
    for (const weaponId of attacker.config.weaponIds) {
      const weapon = getWeaponById(weaponId);
      if (!weapon || weapon.type !== 'spinner') continue;

      // Spinners do continuous damage while in contact
      const spinnerDamage = weapon.baseDamage * 0.1; // Per-frame damage
      target.takeDamage(spinnerDamage);
    }
  }

  start(): void {
    if (this.bots.size < 2) {
      console.warn('Need at least 2 bots to start a battle');
      return;
    }

    // Set up AI targets (each bot targets the other)
    const botArray = Array.from(this.bots.values());
    for (let i = 0; i < botArray.length; i++) {
      const targetIndex = (i + 1) % botArray.length;
      const target = botArray[targetIndex];

      // Set target for behavior-based AI
      const ai = this.aiControllers.get(botArray[i].id);
      if (ai) {
        ai.setTarget(target);
      }

      // Set target for scripted AI
      const scriptedAI = this.scriptedAIs.get(botArray[i].id);
      if (scriptedAI) {
        scriptedAI.setTarget(target);
        if (this.state.arena) {
          scriptedAI.setArenaSize(this.state.arena.width, this.state.arena.height);
        }
      }
    }

    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.winner = null;
    this.state.timeElapsed = 0;
    this.lastTime = performance.now();

    this.gameLoop();
  }

  private gameLoop = (): void => {
    if (!this.state.isRunning || this.state.isPaused) return;

    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.update(deltaTime);

    requestAnimationFrame(this.gameLoop);
  };

  private applyBotAction(bot: Bot, action: { moveDirection: { x: number; y: number }; targetAngle: number }): void {
    const stats = bot.getStats();

    // Apply movement
    const moveForce = 0.001 * stats.speed;
    this.physics.applyForce(bot.body, {
      x: action.moveDirection.x * moveForce,
      y: action.moveDirection.y * moveForce,
    });

    // Apply rotation towards target
    const angleDiff = action.targetAngle - bot.body.angle;
    const normalizedAngle = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    this.physics.setAngularVelocity(bot.body, normalizedAngle * 0.1);
  }

  private update(deltaTime: number): void {
    this.state.timeElapsed += deltaTime;

    // Clear action info for replay recording
    this.currentActionInfo.clear();

    // Update behavior-based AI and apply actions
    for (const [botId, ai] of this.aiControllers) {
      const bot = this.bots.get(botId);
      if (!bot || !bot.state.isAlive) continue;

      const action = ai.update(deltaTime);
      this.applyBotAction(bot, action);

      // Track action for replay (behavior-based bots use their primary behavior)
      this.currentActionInfo.set(botId, {
        action: bot.config.aiConfig.primaryBehavior,
      });
    }

    // Update scripted AI and apply actions
    for (const [botId, scriptedAI] of this.scriptedAIs) {
      const bot = this.bots.get(botId);
      if (!bot || !bot.state.isAlive) continue;

      const action = scriptedAI.update(deltaTime);
      this.applyBotAction(bot, action);

      // Track action and matched rule for replay debugging
      const lastAction = scriptedAI.getLastAction();
      this.currentActionInfo.set(botId, lastAction);
    }

    // Update physics
    this.physics.update(deltaTime);

    // Update bots
    for (const bot of this.bots.values()) {
      bot.update(deltaTime);

      // Check for bot death and emit explosion
      if (!bot.state.isAlive && this.particles) {
        // Only emit once when bot dies
        const wasAlive = bot.state.hp > 0;
        if (!wasAlive) {
          this.particles.emitExplosion(bot.state.position.x, bot.state.position.y);
        }
      }
    }

    // Update particles
    if (this.particles) {
      this.particles.update(deltaTime);
    }

    // Record frame for replay
    if (this.isRecording && this.replayRecorder) {
      this.replayRecorder.recordFrame(
        Array.from(this.bots.values()).map(b => b.state),
        this.currentActionInfo
      );
    }

    // Check for winner
    this.checkWinCondition();

    // Update state
    this.updateBotStates();

    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  private checkWinCondition(): void {
    const aliveBots = Array.from(this.bots.values()).filter(b => b.state.isAlive);

    if (aliveBots.length <= 1) {
      this.state.isRunning = false;
      this.state.winner = aliveBots.length === 1 ? aliveBots[0].id : null;

      if (this.onStateChange) {
        this.onStateChange(this.state);
      }
    }
  }

  private updateBotStates(): void {
    this.state.bots = Array.from(this.bots.values()).map(b => ({ ...b.state }));
  }

  pause(): void {
    this.state.isPaused = true;
  }

  resume(): void {
    if (this.state.isRunning) {
      this.state.isPaused = false;
      this.lastTime = performance.now();
      this.gameLoop();
    }
  }

  stop(): void {
    this.state.isRunning = false;
  }

  reset(): void {
    this.stop();

    // Remove all bots
    for (const bot of this.bots.values()) {
      this.physics.removeBotBody(bot.body);
      bot.destroy();
    }
    this.bots.clear();
    this.aiControllers.clear();
    this.scriptedAIs.clear();

    // Clear particles
    if (this.particles) {
      this.particles.clear();
    }

    this.state = {
      arena: this.state.arena,
      bots: [],
      isRunning: false,
      isPaused: false,
      winner: null,
      timeElapsed: 0,
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  setOnDamageEvent(callback: (event: DamageEvent) => void): void {
    this.onDamageEvent = callback;
  }

  // Replay recording methods
  startRecording(): void {
    this.replayRecorder = new ReplayRecorder(60);
    this.replayRecorder.start();
    this.isRecording = true;
  }

  stopRecording(): ReplayData | null {
    if (!this.replayRecorder || !this.isRecording) {
      return null;
    }

    this.replayRecorder.stop();
    this.isRecording = false;

    // Build bot info for replay
    const botInfos: ReplayBotInfo[] = Array.from(this.bots.values()).map(bot => ({
      id: bot.id,
      name: bot.config.name,
      color: bot.config.color,
      chassisId: bot.config.chassisId,
      weaponIds: bot.config.weaponIds,
      armorId: bot.config.armorId,
      hasScript: !!bot.config.script,
    }));

    const replay = this.replayRecorder.finalize(
      this.state.arena?.id || 'unknown',
      botInfos,
      this.state.winner
    );

    this.replayRecorder = null;
    return replay;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  destroy(): void {
    this.isDestroyed = true;
    this.stop();
    this.reset();
    this.physics.destroy();

    // Destroy particle system
    if (this.particles) {
      this.particles.destroy();
      this.particles = null;
    }

    if (this.app) {
      try {
        // Only destroy if renderer exists (app was fully initialized)
        if (this.app.renderer) {
          this.app.destroy(true);
        }
      } catch (e) {
        // Ignore destroy errors during cleanup
      }
      this.app = null;
    }
  }
}
