'use client';

import { useState } from 'react';
import { BotConfig } from '@/game/types';
import { exportBot, importBot, validateImportedBot } from '@/game/sharing/BotSharing';
import { CHASSIS } from '@/data/chassis';
import { WEAPONS } from '@/data/weapons';
import { ARMOR } from '@/data/armor';

interface ShareBotModalProps {
  bot?: BotConfig | null;
  mode: 'export' | 'import';
  onImport?: (bot: BotConfig) => void;
  onClose: () => void;
}

export function ShareBotModal({ bot, mode, onImport, onClose }: ShareBotModalProps) {
  const [shareCode, setShareCode] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedBot, setImportedBot] = useState<{
    bot: BotConfig;
    author?: string;
    description?: string;
    createdAt: number;
    errors: string[];
  } | null>(null);

  // Generate share code when in export mode
  const generatedCode = bot ? exportBot(bot, authorName || undefined, description || undefined) : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = generatedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImportParse = () => {
    setImportError(null);
    setImportedBot(null);

    const result = importBot(shareCode);
    if (!result) {
      setImportError('Invalid share code. Make sure you copied the entire code.');
      return;
    }

    // Validate parts availability
    const allChassis = Object.keys(CHASSIS);
    const allWeapons = Object.keys(WEAPONS);
    const allArmor = Object.keys(ARMOR);

    const validation = validateImportedBot(result.bot, allChassis, allWeapons, allArmor);

    setImportedBot({
      bot: result.bot,
      author: result.meta.author,
      description: result.meta.description,
      createdAt: result.meta.createdAt,
      errors: validation.errors,
    });
  };

  const handleConfirmImport = () => {
    if (importedBot && onImport) {
      onImport(importedBot.bot);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-700 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-lg">{mode === 'export' ? '📤' : '📥'}</span>
            <span className="font-bold">
              {mode === 'export' ? 'Share Bot' : 'Import Bot'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-600 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          {mode === 'export' && bot && (
            <>
              {/* Bot Preview */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-700 rounded-lg">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: bot.color + '44' }}
                >
                  🤖
                </div>
                <div>
                  <div className="font-bold" style={{ color: bot.color }}>
                    {bot.name}
                  </div>
                  <div className="text-sm text-gray-400 capitalize">
                    {bot.chassisId} chassis
                  </div>
                  {bot.script && (
                    <span className="text-xs bg-purple-600 text-white px-1 rounded">
                      Custom Script
                    </span>
                  )}
                </div>
              </div>

              {/* Optional metadata */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Anonymous"
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your bot's strategy..."
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Share Code */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Share Code
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={generatedCode}
                    className="w-full px-3 py-2 pr-20 bg-gray-900 rounded-lg font-mono text-xs resize-none focus:outline-none"
                    rows={3}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                  <button
                    onClick={handleCopy}
                    className={`absolute right-2 top-2 px-3 py-1 rounded transition-colors ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Share this code with others. They can import your bot in their game.
              </p>
            </>
          )}

          {mode === 'import' && (
            <>
              {/* Import Input */}
              {!importedBot && (
                <>
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 block mb-1">
                      Paste Share Code
                    </label>
                    <textarea
                      value={shareCode}
                      onChange={(e) => setShareCode(e.target.value)}
                      placeholder="AIBOT:..."
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                  </div>

                  {importError && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                      {importError}
                    </div>
                  )}

                  <button
                    onClick={handleImportParse}
                    disabled={!shareCode.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
                  >
                    Parse Bot
                  </button>
                </>
              )}

              {/* Import Preview */}
              {importedBot && (
                <>
                  <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: importedBot.bot.color + '44' }}
                      >
                        🤖
                      </div>
                      <div>
                        <div className="font-bold" style={{ color: importedBot.bot.color }}>
                          {importedBot.bot.name}
                        </div>
                        <div className="text-sm text-gray-400 capitalize">
                          {importedBot.bot.chassisId} chassis
                        </div>
                      </div>
                    </div>

                    {importedBot.author && (
                      <div className="text-sm text-gray-400">
                        By: <span className="text-white">{importedBot.author}</span>
                      </div>
                    )}
                    {importedBot.description && (
                      <div className="text-sm text-gray-300 mt-2 p-2 bg-gray-800 rounded">
                        {importedBot.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Created: {new Date(importedBot.createdAt).toLocaleDateString()}
                    </div>

                    {/* Bot Details */}
                    <div className="mt-3 pt-3 border-t border-gray-600 text-sm">
                      <div className="grid grid-cols-2 gap-2 text-gray-400">
                        <div>
                          Weapons:{' '}
                          <span className="text-white">
                            {importedBot.bot.weaponIds.length}
                          </span>
                        </div>
                        <div>
                          Armor:{' '}
                          <span className="text-white">
                            {importedBot.bot.armorId || 'None'}
                          </span>
                        </div>
                        <div>
                          AI:{' '}
                          <span className="text-white capitalize">
                            {importedBot.bot.aiConfig.primaryBehavior}
                          </span>
                        </div>
                        <div>
                          Script:{' '}
                          <span className="text-white">
                            {importedBot.bot.script ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Errors */}
                  {importedBot.errors.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                      <div className="font-bold text-yellow-400 mb-2">
                        Some parts are unavailable:
                      </div>
                      <ul className="text-sm text-yellow-300 space-y-1">
                        {importedBot.errors.map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-yellow-500 mt-2">
                        You may need to purchase these parts or the bot may not work as intended.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setImportedBot(null)}
                      className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-colors"
                    >
                      Import Bot
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
