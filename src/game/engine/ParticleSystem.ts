import { Container, Graphics } from 'pixi.js';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  type: 'spark' | 'smoke' | 'debris' | 'impact';
}

export class ParticleSystem {
  private container: Container;
  private particles: Particle[] = [];
  private graphics: Graphics;
  private maxParticles = 200;

  constructor(parentContainer: Container) {
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
    parentContainer.addChild(this.container);
  }

  // Emit sparks on collision
  emitSparks(x: number, y: number, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.3 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? 0xffaa00 : 0xffff00,
        type: 'spark',
      });
    }
  }

  // Emit smoke on damage
  emitSmoke(x: number, y: number, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      const speed = 0.5 + Math.random() * 1;

      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 8 + Math.random() * 8,
        color: 0x444444,
        type: 'smoke',
      });
    }
  }

  // Emit debris on big hit
  emitDebris(x: number, y: number, count: number = 4): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 3;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.4 + Math.random() * 0.3,
        size: 3 + Math.random() * 4,
        color: 0x666666,
        type: 'debris',
      });
    }
  }

  // Impact flash
  emitImpact(x: number, y: number): void {
    if (this.particles.length >= this.maxParticles) return;

    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.1,
      maxLife: 0.1,
      size: 30,
      color: 0xffffff,
      type: 'impact',
    });
  }

  // Combined effect for collision
  emitCollision(x: number, y: number, intensity: number = 1): void {
    const sparkCount = Math.floor(5 * intensity);
    const smokeCount = Math.floor(3 * intensity);

    this.emitImpact(x, y);
    this.emitSparks(x, y, sparkCount);

    if (intensity > 0.5) {
      this.emitSmoke(x, y, smokeCount);
    }

    if (intensity > 1) {
      this.emitDebris(x, y, Math.floor(intensity));
    }
  }

  // Explosion effect for bot destruction
  emitExplosion(x: number, y: number): void {
    // Big flash
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.2,
      maxLife: 0.2,
      size: 60,
      color: 0xff6600,
      type: 'impact',
    });

    // Lots of sparks
    this.emitSparks(x, y, 20);
    this.emitSmoke(x, y, 10);
    this.emitDebris(x, y, 8);
  }

  update(deltaTime: number): void {
    const dt = deltaTime / 1000; // Convert to seconds

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;

      // Gravity for debris
      if (p.type === 'debris') {
        p.vy += 0.2;
      }

      // Slow down sparks
      if (p.type === 'spark') {
        p.vx *= 0.95;
        p.vy *= 0.95;
      }

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Redraw
    this.render();
  }

  private render(): void {
    this.graphics.clear();

    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);

      switch (p.type) {
        case 'spark':
          // Sparks are circles that fade
          this.graphics.circle(p.x, p.y, p.size * alpha);
          this.graphics.fill({ color: p.color, alpha });
          break;

        case 'smoke':
          // Smoke expands as it fades
          const smokeSize = p.size * (1 + (1 - alpha) * 0.5);
          this.graphics.circle(p.x, p.y, smokeSize);
          this.graphics.fill({ color: p.color, alpha: alpha * 0.5 });
          break;

        case 'debris':
          // Debris are small squares
          this.graphics.rect(
            p.x - p.size / 2,
            p.y - p.size / 2,
            p.size,
            p.size
          );
          this.graphics.fill({ color: p.color, alpha });
          break;

        case 'impact':
          // Impact is a fading circle
          this.graphics.circle(p.x, p.y, p.size * alpha);
          this.graphics.fill({ color: p.color, alpha: alpha * 0.8 });
          break;
      }
    }
  }

  clear(): void {
    this.particles = [];
    this.graphics.clear();
  }

  destroy(): void {
    this.clear();
    this.container.destroy({ children: true });
  }
}
