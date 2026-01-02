import { GameState, DamageEvent } from '@/game/types';

export interface CommentaryEvent {
  timestamp: number;
  type: 'start' | 'big_hit' | 'low_hp' | 'comeback' | 'finish' | 'pit_fall' | 'wall_slam' | 'banter';
  message: string;
  speaker: 'chuck' | 'frank' | 'both';
  excitement: number; // 1-10
}

// MST3K/Dodgeball style commentary lines
const COMMENTARY = {
  start: {
    chuck: [
      (b1: string, b2: string) => `Good evening folks, I'm Chuck Sterling! Tonight: ${b1} versus ${b2}!`,
      (b1: string, b2: string) => `WELCOME to Robot Combat Championship! ${b1} takes on ${b2}!`,
      (b1: string, b2: string) => `Ladies and gentlemen, ${b1} and ${b2} are ready to RUMBLE!`,
      (b1: string, b2: string) => `From the depths of the garage, ${b1} faces the terrifying ${b2}!`,
      (b1: string, b2: string) => `It's the moment you've been waiting for! ${b1} vs ${b2}! LET'S GO!`,
      (b1: string, b2: string) => `Two bots enter, one bot leaves! ${b1} and ${b2} in the THUNDERDOME!`,
      (b1: string, b2: string) => `The arena is SET! ${b1} on the left, ${b2} on the right! This is gonna be GOOD!`,
    ],
    frank: [
      () => `That's right Chuck, I'm Frank "The Tank" Mulligan. I once saw a bot eat an engine block. True story.`,
      () => `Frank Mulligan here. I've been waiting all week for this. My therapist says I have issues.`,
      () => `I'm more excited than a toaster in a bathtub, Chuck!`,
      () => `You know what I always say Chuck - if it ain't sparking, it ain't fighting!`,
      () => `I haven't been this pumped since I discovered you could microwave metal! Don't do that, by the way.`,
      () => `My money's on whoever looks more like they were assembled by an angry engineer at 3 AM.`,
      () => `I can smell the motor oil and desperation from here, Chuck. Beautiful.`,
    ],
  },
  big_hit: {
    chuck: [
      (a: string, d: string, dmg: number) => `MASSIVE HIT! ${a} deals ${dmg.toFixed(0)} damage to ${d}!`,
      (a: string, d: string) => `OH! ${a} just ROCKED ${d} with that shot!`,
      (a: string, d: string) => `${d} is gonna feel THAT one tomorrow, courtesy of ${a}!`,
      (a: string, d: string) => `DEVASTATING blow from ${a}! ${d} is REELING!`,
      (a: string, d: string) => `${a} connects with AUTHORITY! ${d} didn't see that coming!`,
      (a: string, d: string) => `WHAT A HIT! ${a} just reorganized ${d}'s internal components!`,
      (a: string, d: string) => `${a} with the HAYMAKER! ${d} is scrambling!`,
      (a: string, d: string) => `BOOM! ${a} delivers a CRUSHING blow to ${d}!`,
      (a: string, d: string) => `${d} just got a FREE HARDWARE UPGRADE from ${a}! The violent kind!`,
    ],
    frank: [
      () => `That's a bold strategy, Cotton— I mean Chuck. Let's see if it pays off.`,
      (a: string) => `${a} hits harder than my ex-wife's lawyer!`,
      () => `That's gonna leave a mark. And probably some property damage.`,
      () => `I haven't seen a hit that hard since I tried to pet that electric fence!`,
      () => `OOF! That's gonna void the warranty!`,
      () => `Somewhere, a mechanic just felt a disturbance in the force.`,
      () => `That hit was so hard, my fillings rattled!`,
      () => `If you can dodge a wrench, you can dodge a— never mind, nobody's dodging THAT.`,
      () => `That's what we call "percussive maintenance" Chuck!`,
      () => `I felt that in my SOUL. And I'm not even sure I have one!`,
      () => `WHAM! Right in the actuators!`,
      () => `That bot just got sent to the shadow realm of the repair shop!`,
    ],
  },
  low_hp: {
    chuck: [
      (bot: string, hp: number) => `${bot} is in TROUBLE! Down to ${hp.toFixed(0)} HP!`,
      (bot: string) => `${bot} is hanging on by a thread here!`,
      (bot: string) => `Can ${bot} survive? This is getting INTENSE!`,
      (bot: string) => `${bot} is on LIFE SUPPORT! This could be it!`,
      (bot: string) => `${bot} is smoking and sparking! NOT GOOD!`,
      (bot: string) => `The end might be near for ${bot}! Can they pull off a miracle?`,
      (bot: string) => `${bot} is barely holding together! One more hit could be the end!`,
    ],
    frank: [
      (bot: string) => `${bot} is looking shakier than my hands before my morning coffee.`,
      () => `This bot needs a miracle. Or a good mechanic. Preferably both.`,
      () => `I've seen healthier robots at a junkyard!`,
      () => `That bot's got more warning lights than a Christmas tree!`,
      () => `Stick a fork in 'em, they're almost done!`,
      () => `I've seen better days... on broken toasters.`,
      () => `Someone get the defibrillator! Do robots have those? They should.`,
      () => `That thing's leaking more fluids than my first car!`,
      () => `It's not looking good, Chuck. And I'm an optimist! Well, no I'm not.`,
    ],
  },
  pit_fall: {
    chuck: [
      (bot: string) => `OH NO! ${bot} HAS FALLEN INTO THE PIT! IT'S ALL OVER!`,
      (bot: string) => `${bot} GOES DOWN! The pit claims another victim!`,
      (bot: string) => `INTO THE ABYSS! ${bot} is ELIMINATED by pit fall!`,
      (bot: string) => `${bot} takes the EXPRESS ELEVATOR to the basement! ELIMINATED!`,
      (bot: string) => `GOODNIGHT ${bot}! The pit says HELLO!`,
      (bot: string) => `${bot} just discovered the arena's SECRET EXIT! Permanently!`,
    ],
    frank: [
      (bot: string) => `${bot} discovers what I call "the floor's suggestion box." Suggestions are final.`,
      () => `Gravity: 1, Robot: 0. Every. Single. Time.`,
      () => `And THAT'S why you don't skip leg day at the robot gym!`,
      () => `That's not flying, that's falling with STYLE! Actually no, that's just falling.`,
      () => `I'd say "watch your step" but it's a bit late for that!`,
      () => `Down the hatch! That pit has claimed more bots than my garage has!`,
      () => `Hole in one! Wait, wrong sport. Still counts!`,
    ],
  },
  wall_slam: {
    chuck: [
      (a: string, d: string) => `${a} SLAMS ${d} into the wall! BRUTAL!`,
      (d: string) => `${d} gets introduced to the arena wall! OOF!`,
      (d: string) => `The wall wins that exchange against ${d}!`,
      (a: string, d: string) => `${a} drives ${d} into the barrier! CRUSHING impact!`,
      (d: string) => `${d} just BOUNCED off the wall like a pinball!`,
      (a: string, d: string) => `${a} uses the wall as a WEAPON! ${d} is DAZED!`,
    ],
    frank: [
      () => `That wall has a family, you know! Think of the children!`,
      () => `I felt that impact from here. And I'm sitting in a bunker.`,
      () => `That's what I call aggressive redecorating!`,
      () => `Someone check on that wall! Actually, check on the bot first.`,
      () => `The wall remains UNDEFEATED!`,
      () => `Newton's third law in ACTION, baby!`,
      () => `That's gonna need more than a fresh coat of paint!`,
    ],
  },
  finish: {
    chuck: [
      (winner: string) => `IT'S OVER! ${winner} WINS! ABSOLUTE DOMINATION!`,
      (winner: string) => `${winner} IS YOUR CHAMPION! What a battle!`,
      (winner: string) => `VICTORY for ${winner}! The crowd goes WILD!`,
      (winner: string) => `${winner} stands VICTORIOUS! What an incredible performance!`,
      (winner: string) => `AND THE WINNER IS... ${winner}! UNBELIEVABLE!`,
      (winner: string) => `${winner} has done it! TOTAL ANNIHILATION!`,
      (winner: string) => `The arena belongs to ${winner}! FLAWLESS victory!`,
      (winner: string) => `${winner} reigns SUPREME! That was BRUTAL!`,
    ],
    frank: [
      (winner: string) => `${winner} proving once again that violence IS the answer. At least in robot combat.`,
      () => `And THAT'S why I always bet on the one that looks angrier!`,
      () => `What a fight! I'm gonna need a new pair of pants after that one!`,
      () => `That was more beautiful than my wedding. Well, both of them.`,
      () => `I'm not crying, Chuck. It's just motor oil in my eyes.`,
      () => `GLORIOUS! Someone get me a tissue and a welding torch!`,
      () => `That's what peak performance looks like, folks! Well, for one of them anyway.`,
      () => `Another victory for the forces of organized mechanical violence!`,
      () => `And the crowd goes mild! Just kidding, they're going NUTS!`,
    ],
  },
  banter: {
    chuck: [
      () => `The tension is PALPABLE here tonight!`,
      () => `Both robots looking for an opening...`,
      () => `Strategic positioning on display here!`,
      () => `Neither bot wants to make the first mistake!`,
      () => `The anticipation is KILLING me, Frank!`,
      () => `It's like a chess match... with MORE VIOLENCE!`,
      () => `Who will strike first? The crowd is on the edge of their seats!`,
      () => `They're circling like mechanical sharks!`,
      () => `You can cut the tension with a plasma cutter!`,
    ],
    frank: [
      () => `You know Chuck, this reminds me of my second marriage. Lots of sparks, inevitable destruction.`,
      () => `I've seen more action in a chess tournament. Just kidding, this is GREAT!`,
      () => `If these bots were any slower, they'd be going backwards in time.`,
      () => `I once entered a staring contest with a robot. I lost. Robots don't blink, Chuck.`,
      () => `They're being more careful than me at an all-you-can-eat buffet.`,
      () => `The calm before the storm... I LOVE the calm before the storm!`,
      () => `Someone poke them with a stick! A big metal stick!`,
      () => `This is like watching paint dry, except the paint is made of DANGER.`,
      () => `My grandma moves faster than this, and she's a lamp.`,
      () => `Come on, hit something! I didn't skip my anger management class for nothing!`,
      () => `The suspense is killing me. Not really, but SOMEONE should be getting killed here!`,
      () => `You know what they say - patience is a virtue. VIOLENCE is also a virtue in this arena!`,
    ],
  },
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class LiveCommentaryGenerator {
  private events: CommentaryEvent[] = [];
  private lastBigHitTime: number = 0;
  private lastBanterTime: number = 0;
  private lowHpAnnounced: Set<string> = new Set();
  private battleStarted: boolean = false;
  private onCommentary: ((event: CommentaryEvent) => void) | null = null;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.events = [];
    this.lastBigHitTime = 0;
    this.lastBanterTime = 0;
    this.lowHpAnnounced = new Set();
    this.battleStarted = false;
  }

  setCommentaryCallback(callback: (event: CommentaryEvent) => void): void {
    this.onCommentary = callback;
  }

  private emit(event: CommentaryEvent): void {
    this.events.push(event);
    if (this.onCommentary) {
      this.onCommentary(event);
    }
  }

  // Call when battle starts
  onBattleStart(bot1Name: string, bot2Name: string): void {
    if (this.battleStarted) return;
    this.battleStarted = true;

    const chuckLine = randomPick(COMMENTARY.start.chuck);
    this.emit({
      timestamp: 0,
      type: 'start',
      message: chuckLine(bot1Name, bot2Name),
      speaker: 'chuck',
      excitement: 8,
    });

    // Frank responds after a delay
    setTimeout(() => {
      const frankLine = randomPick(COMMENTARY.start.frank);
      this.emit({
        timestamp: 800,
        type: 'start',
        message: frankLine(),
        speaker: 'frank',
        excitement: 7,
      });
    }, 800);
  }

  // Call on damage events
  onDamage(event: DamageEvent, currentTime: number, attackerName?: string, targetName?: string): void {
    // Use provided names or fall back to IDs
    const attacker = attackerName || event.attackerId;
    const target = targetName || event.targetId;
    
    // Big hit threshold - lowered to 8 for more frequent commentary
    if (event.damage >= 8 && currentTime - this.lastBigHitTime > 2000) {
      this.lastBigHitTime = currentTime;

      const chuckLine = randomPick(COMMENTARY.big_hit.chuck);
      this.emit({
        timestamp: currentTime,
        type: 'big_hit',
        message: chuckLine(attacker, target, event.damage),
        speaker: 'chuck',
        excitement: 9,
      });

      // Frank adds color commentary
      setTimeout(() => {
        const frankLine = randomPick(COMMENTARY.big_hit.frank);
        const msg = typeof frankLine === 'function' && frankLine.length > 0
          ? frankLine(attacker)
          : (frankLine as () => string)();
        this.emit({
          timestamp: currentTime + 600,
          type: 'big_hit',
          message: msg,
          speaker: 'frank',
          excitement: 8,
        });
      }, 600);
    }
  }

  // Check for low HP
  onStateUpdate(state: GameState, currentTime: number): void {
    for (const bot of state.bots) {
      const hpPercent = bot.hp / bot.maxHp;
      if (hpPercent < 0.25 && bot.isAlive && !this.lowHpAnnounced.has(bot.id)) {
        this.lowHpAnnounced.add(bot.id);

        const chuckLine = randomPick(COMMENTARY.low_hp.chuck);
        this.emit({
          timestamp: currentTime,
          type: 'low_hp',
          message: chuckLine(bot.config.name, bot.hp),
          speaker: 'chuck',
          excitement: 8,
        });

        setTimeout(() => {
          const frankLine = randomPick(COMMENTARY.low_hp.frank);
          const msg = typeof frankLine === 'function' && frankLine.length > 0
            ? frankLine(bot.config.name)
            : (frankLine as () => string)();
          this.emit({
            timestamp: currentTime + 600,
            type: 'low_hp',
            message: msg,
            speaker: 'frank',
            excitement: 7,
          });
        }, 600);
      }
    }

    // Occasional banter during lulls
    if (currentTime - this.lastBanterTime > 10000 && currentTime > 5000) {
      this.lastBanterTime = currentTime;
      if (Math.random() < 0.3) {
        const speaker = Math.random() < 0.5 ? 'chuck' : 'frank';
        const line = randomPick(COMMENTARY.banter[speaker]);
        this.emit({
          timestamp: currentTime,
          type: 'banter',
          message: line(),
          speaker,
          excitement: 5,
        });
      }
    }
  }

  // Call when bot falls in pit
  onPitFall(botName: string, currentTime: number): void {
    const chuckLine = randomPick(COMMENTARY.pit_fall.chuck);
    this.emit({
      timestamp: currentTime,
      type: 'pit_fall',
      message: chuckLine(botName),
      speaker: 'chuck',
      excitement: 10,
    });

    setTimeout(() => {
      const frankLine = randomPick(COMMENTARY.pit_fall.frank);
      const msg = typeof frankLine === 'function' && frankLine.length > 0
        ? frankLine(botName)
        : (frankLine as () => string)();
      this.emit({
        timestamp: currentTime + 600,
        type: 'pit_fall',
        message: msg,
        speaker: 'frank',
        excitement: 9,
      });
    }, 600);
  }

  // Call when bot hits wall hard
  onWallSlam(attackerName: string, victimName: string, currentTime: number): void {
    const chuckLine = randomPick(COMMENTARY.wall_slam.chuck);
    this.emit({
      timestamp: currentTime,
      type: 'wall_slam',
      message: chuckLine(attackerName, victimName),
      speaker: 'chuck',
      excitement: 8,
    });

    setTimeout(() => {
      const frankLine = randomPick(COMMENTARY.wall_slam.frank);
      this.emit({
        timestamp: currentTime + 600,
        type: 'wall_slam',
        message: frankLine(),
        speaker: 'frank',
        excitement: 7,
      });
    }, 600);
  }

  // Call when battle ends
  onBattleEnd(winnerName: string, currentTime: number): void {
    const chuckLine = randomPick(COMMENTARY.finish.chuck);
    this.emit({
      timestamp: currentTime,
      type: 'finish',
      message: chuckLine(winnerName),
      speaker: 'chuck',
      excitement: 10,
    });

    setTimeout(() => {
      const frankLine = randomPick(COMMENTARY.finish.frank);
      const msg = typeof frankLine === 'function' && frankLine.length > 0
        ? frankLine(winnerName)
        : (frankLine as () => string)();
      this.emit({
        timestamp: currentTime + 800,
        type: 'finish',
        message: msg,
        speaker: 'frank',
        excitement: 9,
      });
    }, 800);
  }

  getEvents(): CommentaryEvent[] {
    return [...this.events];
  }
}
