import Matter from 'matter-js';
import { Bot } from '@/game/entities/Bot';
import { BehaviorType, Vector2 } from '@/game/types';

interface AIAction {
  moveDirection: Vector2;
  targetAngle: number;
  useWeapon: boolean;
}

export class AIController {
  private bot: Bot;
  private target: Bot | null = null;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  setTarget(target: Bot | null): void {
    this.target = target;
  }

  update(deltaTime: number): AIAction {
    if (!this.target || !this.target.state.isAlive) {
      return { moveDirection: { x: 0, y: 0 }, targetAngle: 0, useWeapon: false };
    }

    const { primaryBehavior, secondaryBehavior, aggression, engagementDistance } =
      this.bot.config.aiConfig;

    // Calculate primary action
    const primaryAction = this.executeBehavior(primaryBehavior, aggression);

    // Blend with secondary if present
    if (secondaryBehavior) {
      const secondaryAction = this.executeBehavior(
        secondaryBehavior,
        aggression * 0.5
      );
      return this.blendActions(primaryAction, secondaryAction, 0.7);
    }

    return primaryAction;
  }

  private executeBehavior(behavior: BehaviorType, aggression: number): AIAction {
    switch (behavior) {
      case 'aggressive':
        return this.aggressiveBehavior(aggression);
      case 'defensive':
        return this.defensiveBehavior(aggression);
      case 'flanker':
        return this.flankerBehavior(aggression);
      case 'ram':
        return this.ramBehavior(aggression);
      case 'reactive':
        return this.reactiveBehavior(aggression);
      default:
        return this.aggressiveBehavior(aggression);
    }
  }

  private aggressiveBehavior(aggression: number): AIAction {
    if (!this.target) {
      return { moveDirection: { x: 0, y: 0 }, targetAngle: 0, useWeapon: false };
    }

    const toTarget = this.vectorToTarget();
    const distance = this.distanceToTarget();

    // Rush directly at target
    const moveDirection = this.normalize(toTarget);
    const targetAngle = Math.atan2(toTarget.y, toTarget.x);

    // More aggression = attack at greater distance
    const attackDistance = 50 + (aggression / 100) * 50;
    const useWeapon = distance < attackDistance;

    return { moveDirection, targetAngle, useWeapon };
  }

  private defensiveBehavior(aggression: number): AIAction {
    if (!this.target) {
      return { moveDirection: { x: 0, y: 0 }, targetAngle: 0, useWeapon: false };
    }

    const toTarget = this.vectorToTarget();
    const distance = this.distanceToTarget();
    const targetAngle = Math.atan2(toTarget.y, toTarget.x);

    // Preferred distance based on aggression (low = stay far)
    const preferredDistance = 150 - (aggression / 100) * 100;

    let moveDirection: Vector2;

    if (distance < preferredDistance) {
      // Too close - back away
      moveDirection = this.normalize({ x: -toTarget.x, y: -toTarget.y });
    } else if (distance > preferredDistance + 50) {
      // Too far - approach slowly
      moveDirection = this.normalize(toTarget);
      moveDirection.x *= 0.5;
      moveDirection.y *= 0.5;
    } else {
      // Good distance - circle
      moveDirection = this.normalize({
        x: -toTarget.y,
        y: toTarget.x,
      });
    }

    const useWeapon = distance < 80;

    return { moveDirection, targetAngle, useWeapon };
  }

  private flankerBehavior(aggression: number): AIAction {
    if (!this.target) {
      return { moveDirection: { x: 0, y: 0 }, targetAngle: 0, useWeapon: false };
    }

    const toTarget = this.vectorToTarget();
    const distance = this.distanceToTarget();
    const targetAngle = Math.atan2(toTarget.y, toTarget.x);

    // Calculate perpendicular direction for circling
    const perpendicular = this.normalize({
      x: -toTarget.y,
      y: toTarget.x,
    });

    let moveDirection: Vector2;

    if (distance > 100) {
      // Approach while circling
      const approach = this.normalize(toTarget);
      moveDirection = {
        x: approach.x * 0.5 + perpendicular.x * 0.5,
        y: approach.y * 0.5 + perpendicular.y * 0.5,
      };
    } else {
      // Close enough - circle and strike
      const inward = this.normalize(toTarget);
      moveDirection = {
        x: perpendicular.x * 0.7 + inward.x * (aggression / 100) * 0.5,
        y: perpendicular.y * 0.7 + inward.y * (aggression / 100) * 0.5,
      };
    }

    const useWeapon = distance < 60;

    return { moveDirection, targetAngle, useWeapon };
  }

  private ramBehavior(aggression: number): AIAction {
    if (!this.target) {
      return { moveDirection: { x: 0, y: 0 }, targetAngle: 0, useWeapon: false };
    }

    const toTarget = this.vectorToTarget();
    const distance = this.distanceToTarget();
    const targetAngle = Math.atan2(toTarget.y, toTarget.x);

    // Always charge directly at target at full speed
    const moveDirection = this.normalize(toTarget);

    // Use weapon on impact
    const useWeapon = distance < 40;

    return { moveDirection, targetAngle, useWeapon };
  }

  private reactiveBehavior(aggression: number): AIAction {
    if (!this.target) {
      return { moveDirection: { x: 0, y: 0 }, targetAngle: 0, useWeapon: false };
    }

    const toTarget = this.vectorToTarget();
    const distance = this.distanceToTarget();
    const targetAngle = Math.atan2(toTarget.y, toTarget.x);

    // Check enemy velocity to predict movement
    const enemyVelocity = this.target.state.velocity;
    const enemySpeed = Math.sqrt(
      enemyVelocity.x * enemyVelocity.x + enemyVelocity.y * enemyVelocity.y
    );

    let moveDirection: Vector2;

    if (enemySpeed > 3) {
      // Enemy approaching - sidestep and counter
      const dodge = this.normalize({
        x: -enemyVelocity.y,
        y: enemyVelocity.x,
      });
      moveDirection = {
        x: dodge.x * 0.6 + toTarget.x * 0.4,
        y: dodge.y * 0.6 + toTarget.y * 0.4,
      };
      moveDirection = this.normalize(moveDirection);
    } else {
      // Enemy idle - approach cautiously
      moveDirection = this.normalize(toTarget);
      moveDirection.x *= 0.5 + (aggression / 100) * 0.5;
      moveDirection.y *= 0.5 + (aggression / 100) * 0.5;
    }

    const useWeapon = distance < 70;

    return { moveDirection, targetAngle, useWeapon };
  }

  private vectorToTarget(): Vector2 {
    if (!this.target) return { x: 0, y: 0 };
    return {
      x: this.target.state.position.x - this.bot.state.position.x,
      y: this.target.state.position.y - this.bot.state.position.y,
    };
  }

  private distanceToTarget(): number {
    const v = this.vectorToTarget();
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  private normalize(v: Vector2): Vector2 {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  }

  private blendActions(a: AIAction, b: AIAction, weight: number): AIAction {
    return {
      moveDirection: {
        x: a.moveDirection.x * weight + b.moveDirection.x * (1 - weight),
        y: a.moveDirection.y * weight + b.moveDirection.y * (1 - weight),
      },
      targetAngle: a.targetAngle * weight + b.targetAngle * (1 - weight),
      useWeapon: a.useWeapon || b.useWeapon,
    };
  }
}
