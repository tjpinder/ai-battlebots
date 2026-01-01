import { Bot } from '@/game/entities/Bot';
import { Vector2 } from '@/game/types';
import {
  ParsedScript,
  ScriptContext,
  executeScript,
  parseScript,
  DEFAULT_BOT_SCRIPT,
} from './BotScript';

export interface AIAction {
  moveDirection: Vector2;
  targetAngle: number;
  useWeapon: boolean;
}

export class ScriptedAI {
  private bot: Bot;
  private target: Bot | null = null;
  private script: ParsedScript;
  private arenaWidth: number = 800;
  private arenaHeight: number = 600;

  // Action state for complex maneuvers
  private ramChargeTime: number = 0;
  private circleAngle: number = 0;

  // Tracking for replay/debugging
  private lastActionName: string = 'idle';
  private lastMatchedRule: string | undefined;

  constructor(bot: Bot, scriptCode?: string) {
    this.bot = bot;
    this.script = parseScript(scriptCode || DEFAULT_BOT_SCRIPT);
  }

  setTarget(target: Bot): void {
    this.target = target;
  }

  setArenaSize(width: number, height: number): void {
    this.arenaWidth = width;
    this.arenaHeight = height;
  }

  updateScript(scriptCode: string): ParsedScript {
    this.script = parseScript(scriptCode);
    return this.script;
  }

  getScript(): ParsedScript {
    return this.script;
  }

  update(deltaTime: number): AIAction {
    if (!this.target || !this.bot.state.isAlive) {
      this.lastActionName = 'idle';
      this.lastMatchedRule = undefined;
      return { moveDirection: { x: 0, y: 0 }, targetAngle: 0, useWeapon: false };
    }

    // Build context for script evaluation
    const context = this.buildContext();

    // Execute script to get action
    const actionName = executeScript(this.script, context);
    this.lastActionName = actionName;

    // Convert action name to movement
    return this.executeAction(actionName, deltaTime);
  }

  getLastAction(): { action: string; rule?: string } {
    return {
      action: this.lastActionName,
      rule: this.lastMatchedRule,
    };
  }

  private buildContext(): ScriptContext {
    const myPos = this.bot.state.position;
    const enemyPos = this.target!.state.position;

    const dx = enemyPos.x - myPos.x;
    const dy = enemyPos.y - myPos.y;
    const distanceToEnemy = Math.sqrt(dx * dx + dy * dy);

    const myStats = this.bot.getStats();
    const enemyStats = this.target!.getStats();

    // Calculate distance to nearest wall
    const distToLeft = myPos.x;
    const distToRight = this.arenaWidth - myPos.x;
    const distToTop = myPos.y;
    const distToBottom = this.arenaHeight - myPos.y;
    const distanceToWall = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    // Calculate distance to center
    const centerX = this.arenaWidth / 2;
    const centerY = this.arenaHeight / 2;
    const distanceToCenter = Math.sqrt(
      Math.pow(myPos.x - centerX, 2) + Math.pow(myPos.y - centerY, 2)
    );

    // Check if enemy has spinner weapon
    const enemyIsSpinning = this.target!.config.weaponIds.some((id) =>
      id.toLowerCase().includes('spinner')
    );

    return {
      distanceToEnemy,
      myHp: this.bot.state.hp,
      myHpPercent: (this.bot.state.hp / this.bot.state.maxHp) * 100,
      enemyHp: this.target!.state.hp,
      enemyHpPercent: (this.target!.state.hp / this.target!.state.maxHp) * 100,
      mySpeed: myStats.speed,
      enemySpeed: enemyStats.speed,
      myWeight: myStats.weight,
      enemyWeight: enemyStats.weight,
      distanceToWall,
      distanceToCenter,
      enemyIsSpinning,
      angleToEnemy: Math.atan2(dy, dx),
      arenaWidth: this.arenaWidth,
      arenaHeight: this.arenaHeight,
    };
  }

  private executeAction(actionName: string, deltaTime: number): AIAction {
    const myPos = this.bot.state.position;
    const enemyPos = this.target!.state.position;

    const dx = enemyPos.x - myPos.x;
    const dy = enemyPos.y - myPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToEnemy = Math.atan2(dy, dx);

    // Normalize direction to enemy
    const toEnemy: Vector2 = distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 1, y: 0 };

    let moveDirection: Vector2 = { x: 0, y: 0 };
    let targetAngle = angleToEnemy;
    let useWeapon = false;

    switch (actionName) {
      case 'attack':
        // Rush directly at enemy
        moveDirection = toEnemy;
        useWeapon = distance < 100;
        break;

      case 'retreat':
        // Move away from enemy
        moveDirection = { x: -toEnemy.x, y: -toEnemy.y };
        targetAngle = angleToEnemy + Math.PI; // Face away
        break;

      case 'circle_left':
        // Circle counterclockwise around enemy
        this.circleAngle += deltaTime * 0.002;
        const perpLeft: Vector2 = { x: -toEnemy.y, y: toEnemy.x };
        // Mix approaching with circling
        moveDirection = {
          x: toEnemy.x * 0.3 + perpLeft.x * 0.7,
          y: toEnemy.y * 0.3 + perpLeft.y * 0.7,
        };
        useWeapon = distance < 120;
        break;

      case 'circle_right':
        // Circle clockwise around enemy
        this.circleAngle -= deltaTime * 0.002;
        const perpRight: Vector2 = { x: toEnemy.y, y: -toEnemy.x };
        moveDirection = {
          x: toEnemy.x * 0.3 + perpRight.x * 0.7,
          y: toEnemy.y * 0.3 + perpRight.y * 0.7,
        };
        useWeapon = distance < 120;
        break;

      case 'ram':
        // Build up speed then charge
        this.ramChargeTime += deltaTime;
        if (this.ramChargeTime < 500) {
          // Back up briefly
          moveDirection = { x: -toEnemy.x, y: -toEnemy.y };
        } else {
          // Charge!
          moveDirection = { x: toEnemy.x * 1.5, y: toEnemy.y * 1.5 };
          if (distance < 80) {
            this.ramChargeTime = 0; // Reset for next ram
          }
        }
        useWeapon = distance < 60;
        break;

      case 'wait':
        // Hold position, face enemy
        moveDirection = { x: 0, y: 0 };
        break;

      case 'approach':
        // Move toward enemy cautiously
        if (distance > 150) {
          moveDirection = toEnemy;
        } else {
          // Slow approach when close
          moveDirection = { x: toEnemy.x * 0.5, y: toEnemy.y * 0.5 };
        }
        useWeapon = distance < 100;
        break;

      case 'flee_to_center':
        // Move toward arena center
        const centerX = this.arenaWidth / 2;
        const centerY = this.arenaHeight / 2;
        const toCenterX = centerX - myPos.x;
        const toCenterY = centerY - myPos.y;
        const toCenterDist = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
        if (toCenterDist > 10) {
          moveDirection = { x: toCenterX / toCenterDist, y: toCenterY / toCenterDist };
        }
        targetAngle = Math.atan2(toCenterY, toCenterX);
        break;

      case 'flank':
        // Move to the side of enemy, then attack
        const flankAngle = angleToEnemy + Math.PI / 2;
        if (distance > 100) {
          moveDirection = {
            x: Math.cos(flankAngle) * 0.7 + toEnemy.x * 0.3,
            y: Math.sin(flankAngle) * 0.7 + toEnemy.y * 0.3,
          };
        } else {
          moveDirection = toEnemy;
          useWeapon = true;
        }
        break;

      default:
        moveDirection = toEnemy;
    }

    // Normalize move direction
    const moveMag = Math.sqrt(
      moveDirection.x * moveDirection.x + moveDirection.y * moveDirection.y
    );
    if (moveMag > 0) {
      moveDirection.x /= moveMag;
      moveDirection.y /= moveMag;
    }

    return { moveDirection, targetAngle, useWeapon };
  }
}
