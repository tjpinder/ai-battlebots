import Matter from 'matter-js';
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { BotConfig, BotState, Vector2 } from '@/game/types';
import { getChassisById } from '@/data/chassis';
import { getWeaponById } from '@/data/weapons';
import { getArmorById } from '@/data/armor';

export class Bot {
  id: string;
  config: BotConfig;
  state: BotState;
  body: Matter.Body;

  // Rendering
  container: Container;
  private bodyGraphics: Graphics;
  private weaponGraphics: Graphics;
  private hpBar: Graphics;
  private nameText: Text;

  constructor(
    config: BotConfig,
    body: Matter.Body,
    startPosition: Vector2
  ) {
    this.id = config.id;
    this.config = config;
    this.body = body;

    const chassis = getChassisById(config.chassisId)!;

    // Initialize state
    this.state = {
      id: config.id,
      config: config,
      position: { ...startPosition },
      velocity: { x: 0, y: 0 },
      angle: 0,
      angularVelocity: 0,
      hp: chassis.baseHP,
      maxHp: chassis.baseHP,
      isAlive: true,
      weaponCooldowns: {},
    };

    // Initialize weapon cooldowns
    for (const weaponId of config.weaponIds) {
      this.state.weaponCooldowns[weaponId] = 0;
    }

    // Create visual container
    this.container = new Container();
    this.container.position.set(startPosition.x, startPosition.y);

    // Bot body graphics
    this.bodyGraphics = new Graphics();
    this.drawBody();
    this.container.addChild(this.bodyGraphics);

    // Weapon graphics
    this.weaponGraphics = new Graphics();
    this.drawWeapons();
    this.container.addChild(this.weaponGraphics);

    // HP bar
    this.hpBar = new Graphics();
    this.updateHpBar();
    this.container.addChild(this.hpBar);

    // Name label
    this.nameText = new Text({
      text: config.name,
      style: new TextStyle({
        fontSize: 12,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      }),
    });
    this.nameText.anchor.set(0.5, 0);
    this.nameText.position.set(0, -chassis.size - 25);
    this.container.addChild(this.nameText);
  }

  private drawBody(): void {
    const chassis = getChassisById(this.config.chassisId)!;
    const color = parseInt(this.config.color.replace('#', ''), 16);

    this.bodyGraphics.clear();

    // Main body circle with industrial look
    // Outer ring (armor)
    this.bodyGraphics.circle(0, 0, chassis.size);
    this.bodyGraphics.fill({ color: 0x333333 });

    // Inner body
    this.bodyGraphics.circle(0, 0, chassis.size - 4);
    this.bodyGraphics.fill({ color });

    // Center detail
    this.bodyGraphics.circle(0, 0, chassis.size * 0.3);
    this.bodyGraphics.fill({ color: 0x222222 });

    // Direction indicator (front)
    this.bodyGraphics.moveTo(0, 0);
    this.bodyGraphics.lineTo(chassis.size - 2, 0);
    this.bodyGraphics.stroke({ width: 4, color: 0xffffff });
  }

  private drawWeapons(): void {
    const chassis = getChassisById(this.config.chassisId)!;
    this.weaponGraphics.clear();

    for (let i = 0; i < this.config.weaponIds.length; i++) {
      const weapon = getWeaponById(this.config.weaponIds[i]);
      if (!weapon) continue;

      const angle = (i * Math.PI) / 2; // Distribute weapons around bot
      const offsetX = Math.cos(angle) * (chassis.size - 5);
      const offsetY = Math.sin(angle) * (chassis.size - 5);

      switch (weapon.type) {
        case 'spinner':
          // Spinning disc
          this.weaponGraphics.circle(offsetX, offsetY, 10);
          this.weaponGraphics.fill({ color: 0xff4444 });
          // Blades
          for (let b = 0; b < 4; b++) {
            const bladeAngle = (b * Math.PI) / 2;
            this.weaponGraphics.moveTo(
              offsetX + Math.cos(bladeAngle) * 5,
              offsetY + Math.sin(bladeAngle) * 5
            );
            this.weaponGraphics.lineTo(
              offsetX + Math.cos(bladeAngle) * 15,
              offsetY + Math.sin(bladeAngle) * 15
            );
            this.weaponGraphics.stroke({ width: 2, color: 0xcccccc });
          }
          break;

        case 'hammer':
          // Hammer head
          this.weaponGraphics.rect(offsetX - 8, offsetY - 4, 16, 8);
          this.weaponGraphics.fill({ color: 0x888888 });
          // Spike
          this.weaponGraphics.moveTo(offsetX, offsetY - 4);
          this.weaponGraphics.lineTo(offsetX, offsetY - 12);
          this.weaponGraphics.stroke({ width: 3, color: 0xaaaaaa });
          break;

        case 'flipper':
          // Flipper plate
          this.weaponGraphics.rect(offsetX - 12, offsetY - 3, 24, 6);
          this.weaponGraphics.fill({ color: 0x44ff44 });
          break;

        case 'saw':
          // Circular saw
          this.weaponGraphics.circle(offsetX, offsetY, 12);
          this.weaponGraphics.stroke({ width: 2, color: 0xffff44 });
          // Teeth
          for (let t = 0; t < 8; t++) {
            const toothAngle = (t * Math.PI) / 4;
            this.weaponGraphics.moveTo(
              offsetX + Math.cos(toothAngle) * 10,
              offsetY + Math.sin(toothAngle) * 10
            );
            this.weaponGraphics.lineTo(
              offsetX + Math.cos(toothAngle) * 14,
              offsetY + Math.sin(toothAngle) * 14
            );
            this.weaponGraphics.stroke({ width: 2, color: 0xffff44 });
          }
          break;

        case 'wedge':
          // Wedge shape
          this.weaponGraphics.moveTo(offsetX - 10, offsetY + 5);
          this.weaponGraphics.lineTo(offsetX + 10, offsetY + 5);
          this.weaponGraphics.lineTo(offsetX, offsetY - 8);
          this.weaponGraphics.fill({ color: 0x666666 });
          break;
      }
    }
  }

  private updateHpBar(): void {
    const chassis = getChassisById(this.config.chassisId)!;
    const barWidth = 50;
    const barHeight = 6;
    const hpPercent = this.state.hp / this.state.maxHp;

    this.hpBar.clear();

    // Background
    this.hpBar.rect(-barWidth / 2, -chassis.size - 15, barWidth, barHeight);
    this.hpBar.fill({ color: 0x333333 });

    // HP fill
    const hpColor =
      hpPercent > 0.5 ? 0x44ff44 : hpPercent > 0.25 ? 0xffff44 : 0xff4444;
    this.hpBar.rect(
      -barWidth / 2,
      -chassis.size - 15,
      barWidth * hpPercent,
      barHeight
    );
    this.hpBar.fill({ color: hpColor });

    // Border
    this.hpBar.rect(-barWidth / 2, -chassis.size - 15, barWidth, barHeight);
    this.hpBar.stroke({ width: 1, color: 0xffffff });
  }

  update(deltaTime: number): void {
    // Sync state with physics body
    this.state.position = {
      x: this.body.position.x,
      y: this.body.position.y,
    };
    this.state.velocity = {
      x: this.body.velocity.x,
      y: this.body.velocity.y,
    };
    this.state.angle = this.body.angle;
    this.state.angularVelocity = this.body.angularVelocity;

    // Update visual position
    this.container.position.set(this.state.position.x, this.state.position.y);
    this.container.rotation = this.state.angle;

    // Update weapon cooldowns
    for (const weaponId of Object.keys(this.state.weaponCooldowns)) {
      if (this.state.weaponCooldowns[weaponId] > 0) {
        this.state.weaponCooldowns[weaponId] = Math.max(
          0,
          this.state.weaponCooldowns[weaponId] - deltaTime
        );
      }
    }

    // Update HP bar
    this.updateHpBar();
  }

  takeDamage(amount: number): void {
    // Apply armor damage reduction
    let finalDamage = amount;
    if (this.config.armorId) {
      const armor = getArmorById(this.config.armorId);
      if (armor) {
        finalDamage = amount * (1 - armor.damageReduction);
      }
    }

    this.state.hp = Math.max(0, this.state.hp - finalDamage);
    if (this.state.hp <= 0) {
      this.state.isAlive = false;
    }
  }

  canUseWeapon(weaponId: string): boolean {
    return (
      this.state.weaponCooldowns[weaponId] !== undefined &&
      this.state.weaponCooldowns[weaponId] <= 0
    );
  }

  useWeapon(weaponId: string): void {
    const weapon = getWeaponById(weaponId);
    if (weapon) {
      this.state.weaponCooldowns[weaponId] = weapon.cooldown;
    }
  }

  getStats() {
    const chassis = getChassisById(this.config.chassisId)!;
    let totalWeight = chassis.weight;
    let totalDamage = 0;
    let damageReduction = 0;

    for (const weaponId of this.config.weaponIds) {
      const weapon = getWeaponById(weaponId);
      if (weapon) {
        totalWeight += weapon.weight;
        totalDamage += weapon.baseDamage;
      }
    }

    if (this.config.armorId) {
      const armor = getArmorById(this.config.armorId);
      if (armor) {
        totalWeight += armor.weight;
        damageReduction = armor.damageReduction;
      }
    }

    return {
      maxHp: chassis.baseHP,
      speed: chassis.baseSpeed * (100 / totalWeight), // Heavier = slower
      weight: totalWeight,
      damage: totalDamage,
      damageReduction,
      size: chassis.size,
    };
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
