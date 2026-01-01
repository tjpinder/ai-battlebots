import Matter from 'matter-js';
import { ArenaConfig, Vector2 } from '@/game/types';

export class PhysicsWorld {
  engine: Matter.Engine;
  world: Matter.World;
  private walls: Matter.Body[] = [];
  private hazards: Matter.Body[] = [];

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 }, // Top-down, no gravity
    });
    this.world = this.engine.world;
  }

  setupArena(config: ArenaConfig): void {
    // Clear existing bodies
    this.clear();

    const { width, height, wallThickness } = config;

    // Create arena walls
    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      restitution: 0.8,
      friction: 0.1,
      label: 'wall',
      render: { fillStyle: '#4a4a4a' },
    };

    // Top wall
    this.walls.push(
      Matter.Bodies.rectangle(
        width / 2,
        wallThickness / 2,
        width,
        wallThickness,
        wallOptions
      )
    );

    // Bottom wall
    this.walls.push(
      Matter.Bodies.rectangle(
        width / 2,
        height - wallThickness / 2,
        width,
        wallThickness,
        wallOptions
      )
    );

    // Left wall
    this.walls.push(
      Matter.Bodies.rectangle(
        wallThickness / 2,
        height / 2,
        wallThickness,
        height,
        wallOptions
      )
    );

    // Right wall
    this.walls.push(
      Matter.Bodies.rectangle(
        width - wallThickness / 2,
        height / 2,
        wallThickness,
        height,
        wallOptions
      )
    );

    // Add walls to world
    Matter.Composite.add(this.world, this.walls);

    // Create hazards
    for (const hazard of config.hazards) {
      const hazardBody = Matter.Bodies.rectangle(
        hazard.position.x,
        hazard.position.y,
        hazard.size.x,
        hazard.size.y,
        {
          isStatic: true,
          isSensor: hazard.type === 'pit', // Pits don't collide, they detect
          label: `hazard_${hazard.type}`,
          render: {
            fillStyle: hazard.type === 'pit' ? '#000000' : '#ff4444',
          },
        }
      );
      this.hazards.push(hazardBody);
    }

    Matter.Composite.add(this.world, this.hazards);
  }

  createBotBody(id: string, position: Vector2, radius: number, mass: number): Matter.Body {
    const body = Matter.Bodies.circle(position.x, position.y, radius, {
      label: `bot_${id}`,
      restitution: 0.6,
      friction: 0.1,
      frictionAir: 0.05,
      mass: mass,
      render: { fillStyle: '#00ff00' },
    });

    Matter.Composite.add(this.world, body);
    return body;
  }

  removeBotBody(body: Matter.Body): void {
    Matter.Composite.remove(this.world, body);
  }

  applyForce(body: Matter.Body, force: Vector2): void {
    Matter.Body.applyForce(body, body.position, force);
  }

  setVelocity(body: Matter.Body, velocity: Vector2): void {
    Matter.Body.setVelocity(body, velocity);
  }

  setAngularVelocity(body: Matter.Body, angularVelocity: number): void {
    Matter.Body.setAngularVelocity(body, angularVelocity);
  }

  update(deltaTime: number): void {
    Matter.Engine.update(this.engine, deltaTime);
  }

  onCollision(callback: (event: Matter.IEventCollision<Matter.Engine>) => void): void {
    Matter.Events.on(this.engine, 'collisionStart', callback);
  }

  onCollisionActive(callback: (event: Matter.IEventCollision<Matter.Engine>) => void): void {
    Matter.Events.on(this.engine, 'collisionActive', callback);
  }

  clear(): void {
    Matter.Composite.clear(this.world, false);
    this.walls = [];
    this.hazards = [];
  }

  destroy(): void {
    Matter.Engine.clear(this.engine);
    this.clear();
  }

  getBodyById(label: string): Matter.Body | undefined {
    return Matter.Composite.allBodies(this.world).find(b => b.label === label);
  }

  getAllBotBodies(): Matter.Body[] {
    return Matter.Composite.allBodies(this.world).filter(b =>
      b.label.startsWith('bot_')
    );
  }
}
