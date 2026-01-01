/**
 * Bot Scripting Language
 *
 * A simple DSL for defining bot behavior. Rules are evaluated top-to-bottom,
 * first matching rule wins.
 *
 * Syntax:
 *   WHEN <condition> DO <action>
 *   DEFAULT <action>
 *
 * Conditions:
 *   distance_to_enemy < 100
 *   my_hp < 50
 *   enemy_hp > my_hp
 *   my_hp_percent < 30
 *   enemy_hp_percent < 50
 *   distance_to_wall < 50
 *   enemy_is_spinning
 *   i_am_faster
 *   i_am_heavier
 *
 * Actions:
 *   attack       - Rush toward enemy
 *   retreat      - Move away from enemy
 *   circle_left  - Circle around enemy (counterclockwise)
 *   circle_right - Circle around enemy (clockwise)
 *   ram          - Build speed and ram
 *   wait         - Hold position
 *   approach     - Move toward enemy cautiously
 *   flee_to_center - Move toward arena center
 *
 * Example:
 *   WHEN my_hp_percent < 20 DO retreat
 *   WHEN distance_to_enemy < 50 DO attack
 *   WHEN enemy_hp < my_hp DO attack
 *   WHEN i_am_heavier DO ram
 *   DEFAULT approach
 */

export interface ScriptCondition {
  variable: string;
  operator: '<' | '>' | '<=' | '>=' | '==' | '!=';
  value: number | boolean | string;
}

export interface ScriptRule {
  conditions: ScriptCondition[];
  action: string;
  isDefault: boolean;
}

export interface ParsedScript {
  rules: ScriptRule[];
  errors: string[];
  isValid: boolean;
}

export interface ScriptContext {
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
  enemyIsSpinning: boolean;
  angleToEnemy: number;
  arenaWidth: number;
  arenaHeight: number;
}

const VALID_VARIABLES = [
  'distance_to_enemy',
  'my_hp',
  'my_hp_percent',
  'enemy_hp',
  'enemy_hp_percent',
  'my_speed',
  'enemy_speed',
  'my_weight',
  'enemy_weight',
  'distance_to_wall',
  'distance_to_center',
  'enemy_is_spinning',
  'i_am_faster',
  'i_am_heavier',
];

const VALID_ACTIONS = [
  'attack',
  'retreat',
  'circle_left',
  'circle_right',
  'ram',
  'wait',
  'approach',
  'flee_to_center',
  'flank',
];

export function parseScript(code: string): ParsedScript {
  const lines = code.split('\n');
  const rules: ScriptRule[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    // Parse DEFAULT action
    if (line.toUpperCase().startsWith('DEFAULT')) {
      const match = line.match(/^DEFAULT\s+(\w+)$/i);
      if (match) {
        const action = match[1].toLowerCase();
        if (!VALID_ACTIONS.includes(action)) {
          errors.push(`Line ${lineNum}: Unknown action "${action}"`);
          continue;
        }
        rules.push({
          conditions: [],
          action,
          isDefault: true,
        });
      } else {
        errors.push(`Line ${lineNum}: Invalid DEFAULT syntax. Use: DEFAULT <action>`);
      }
      continue;
    }

    // Parse WHEN ... DO ...
    if (line.toUpperCase().startsWith('WHEN')) {
      const match = line.match(/^WHEN\s+(.+)\s+DO\s+(\w+)$/i);
      if (!match) {
        errors.push(`Line ${lineNum}: Invalid WHEN syntax. Use: WHEN <condition> DO <action>`);
        continue;
      }

      const conditionStr = match[1];
      const action = match[2].toLowerCase();

      if (!VALID_ACTIONS.includes(action)) {
        errors.push(`Line ${lineNum}: Unknown action "${action}"`);
        continue;
      }

      // Parse conditions (support AND)
      const conditionParts = conditionStr.split(/\s+AND\s+/i);
      const conditions: ScriptCondition[] = [];
      let conditionError = false;

      for (const part of conditionParts) {
        const condMatch = part.trim().match(/^(\w+)\s*(<=|>=|<|>|==|!=)\s*(.+)$/);
        if (!condMatch) {
          // Check for boolean variables
          const boolMatch = part.trim().match(/^(\w+)$/);
          if (boolMatch && VALID_VARIABLES.includes(boolMatch[1].toLowerCase())) {
            conditions.push({
              variable: boolMatch[1].toLowerCase(),
              operator: '==',
              value: true,
            });
          } else {
            errors.push(`Line ${lineNum}: Invalid condition "${part.trim()}"`);
            conditionError = true;
          }
          continue;
        }

        const variable = condMatch[1].toLowerCase();
        const operator = condMatch[2] as ScriptCondition['operator'];
        let value: number | boolean | string = condMatch[3].trim();

        if (!VALID_VARIABLES.includes(variable)) {
          errors.push(`Line ${lineNum}: Unknown variable "${variable}"`);
          conditionError = true;
          continue;
        }

        // Parse value
        if (value === 'true') {
          value = true;
        } else if (value === 'false') {
          value = false;
        } else if (!isNaN(Number(value))) {
          value = Number(value);
        }

        conditions.push({ variable, operator, value });
      }

      if (!conditionError) {
        rules.push({
          conditions,
          action,
          isDefault: false,
        });
      }
      continue;
    }

    errors.push(`Line ${lineNum}: Unknown statement. Use WHEN or DEFAULT.`);
  }

  return {
    rules,
    errors,
    isValid: errors.length === 0,
  };
}

export function evaluateCondition(condition: ScriptCondition, context: ScriptContext): boolean {
  let actualValue: number | boolean;

  switch (condition.variable) {
    case 'distance_to_enemy':
      actualValue = context.distanceToEnemy;
      break;
    case 'my_hp':
      actualValue = context.myHp;
      break;
    case 'my_hp_percent':
      actualValue = context.myHpPercent;
      break;
    case 'enemy_hp':
      actualValue = context.enemyHp;
      break;
    case 'enemy_hp_percent':
      actualValue = context.enemyHpPercent;
      break;
    case 'my_speed':
      actualValue = context.mySpeed;
      break;
    case 'enemy_speed':
      actualValue = context.enemySpeed;
      break;
    case 'my_weight':
      actualValue = context.myWeight;
      break;
    case 'enemy_weight':
      actualValue = context.enemyWeight;
      break;
    case 'distance_to_wall':
      actualValue = context.distanceToWall;
      break;
    case 'distance_to_center':
      actualValue = context.distanceToCenter;
      break;
    case 'enemy_is_spinning':
      actualValue = context.enemyIsSpinning;
      break;
    case 'i_am_faster':
      actualValue = context.mySpeed > context.enemySpeed;
      break;
    case 'i_am_heavier':
      actualValue = context.myWeight > context.enemyWeight;
      break;
    default:
      return false;
  }

  const expectedValue = condition.value;

  switch (condition.operator) {
    case '<':
      return (actualValue as number) < (expectedValue as number);
    case '>':
      return (actualValue as number) > (expectedValue as number);
    case '<=':
      return (actualValue as number) <= (expectedValue as number);
    case '>=':
      return (actualValue as number) >= (expectedValue as number);
    case '==':
      return actualValue === expectedValue;
    case '!=':
      return actualValue !== expectedValue;
    default:
      return false;
  }
}

export function executeScript(script: ParsedScript, context: ScriptContext): string {
  for (const rule of script.rules) {
    if (rule.isDefault) {
      return rule.action;
    }

    const allConditionsMet = rule.conditions.every((cond) =>
      evaluateCondition(cond, context)
    );

    if (allConditionsMet) {
      return rule.action;
    }
  }

  return 'approach'; // Fallback if no rules match
}

// Default script for new bots
export const DEFAULT_BOT_SCRIPT = `# Bot Strategy Script
# Rules are checked top-to-bottom, first match wins

# Retreat when low on health
WHEN my_hp_percent < 20 DO retreat

# Attack when close to enemy
WHEN distance_to_enemy < 80 DO attack

# Ram if we're heavier
WHEN i_am_heavier AND distance_to_enemy < 150 DO ram

# Circle if we're faster
WHEN i_am_faster DO circle_left

# Default: approach the enemy
DEFAULT approach
`;
