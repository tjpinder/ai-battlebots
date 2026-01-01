import { BotConfig } from '@/game/types';

// Exportable bot format (excludes internal ID)
export interface SharedBotData {
  version: 1;
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
  author?: string;
  description?: string;
  createdAt: number;
}

// Encode bot config to a shareable string
export function exportBot(bot: BotConfig, author?: string, description?: string): string {
  const sharedData: SharedBotData = {
    version: 1,
    name: bot.name,
    chassisId: bot.chassisId,
    weaponIds: bot.weaponIds,
    armorId: bot.armorId,
    aiConfig: {
      primaryBehavior: bot.aiConfig.primaryBehavior,
      secondaryBehavior: bot.aiConfig.secondaryBehavior,
      aggression: bot.aiConfig.aggression,
      engagementDistance: bot.aiConfig.engagementDistance,
    },
    color: bot.color,
    script: bot.script,
    author,
    description,
    createdAt: Date.now(),
  };

  // Encode to base64 for easy sharing
  const json = JSON.stringify(sharedData);
  const base64 = btoa(encodeURIComponent(json));
  return `AIBOT:${base64}`;
}

export interface ImportResult {
  bot: BotConfig;
  meta: {
    version: number;
    author?: string;
    description?: string;
    createdAt: number;
  };
}

// Decode a shared bot string back to config
export function importBot(shareCode: string): ImportResult | null {
  try {
    // Remove prefix if present
    let code = shareCode.trim();
    if (code.startsWith('AIBOT:')) {
      code = code.substring(6);
    }

    // Decode from base64
    const json = decodeURIComponent(atob(code));
    const data: SharedBotData = JSON.parse(json);

    // Validate version
    if (data.version !== 1) {
      console.error('Unsupported bot version:', data.version);
      return null;
    }

    // Generate new ID for imported bot
    const bot: BotConfig = {
      id: `imported-${Date.now()}`,
      name: data.name,
      chassisId: data.chassisId,
      weaponIds: data.weaponIds,
      armorId: data.armorId,
      aiConfig: {
        primaryBehavior: data.aiConfig.primaryBehavior as BotConfig['aiConfig']['primaryBehavior'],
        secondaryBehavior: data.aiConfig.secondaryBehavior as BotConfig['aiConfig']['secondaryBehavior'],
        aggression: data.aiConfig.aggression,
        engagementDistance: data.aiConfig.engagementDistance,
      },
      color: data.color,
      script: data.script,
    };

    return {
      bot,
      meta: {
        version: data.version,
        author: data.author,
        description: data.description,
        createdAt: data.createdAt,
      },
    };
  } catch (e) {
    console.error('Failed to import bot:', e);
    return null;
  }
}

// Validate that imported bot uses only available parts
export function validateImportedBot(
  bot: BotConfig,
  availableChassis: string[],
  availableWeapons: string[],
  availableArmor: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!availableChassis.includes(bot.chassisId)) {
    errors.push(`Chassis "${bot.chassisId}" is not available`);
  }

  for (const weaponId of bot.weaponIds) {
    if (!availableWeapons.includes(weaponId)) {
      errors.push(`Weapon "${weaponId}" is not available`);
    }
  }

  if (bot.armorId && !availableArmor.includes(bot.armorId)) {
    errors.push(`Armor "${bot.armorId}" is not available`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Generate a shareable URL (for when we have a backend)
export function generateShareUrl(shareCode: string): string {
  // For now, just return a data URL that can be bookmarked
  // In the future, this would be a short URL from our API
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/import?bot=${encodeURIComponent(shareCode)}`;
}
