'use client';

import { useState, useEffect } from 'react';
import { parseScript, DEFAULT_BOT_SCRIPT, ParsedScript } from '@/game/scripting/BotScript';

interface ScriptEditorProps {
  script: string;
  onChange: (script: string) => void;
}

export function ScriptEditor({ script, onChange }: ScriptEditorProps) {
  const [code, setCode] = useState(script || DEFAULT_BOT_SCRIPT);
  const [parseResult, setParseResult] = useState<ParsedScript | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setCode(script || DEFAULT_BOT_SCRIPT);
  }, [script]);

  useEffect(() => {
    const result = parseScript(code);
    setParseResult(result);
  }, [code]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    onChange(newCode);
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-700 border-b border-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <span className="font-bold">Bot Script</span>
          {parseResult && (
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                parseResult.isValid
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {parseResult.isValid
                ? `${parseResult.rules.length} rules`
                : `${parseResult.errors.length} error${parseResult.errors.length > 1 ? 's' : ''}`}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
        >
          {showHelp ? 'Hide Help' : 'Show Help'}
        </button>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="p-4 bg-gray-750 border-b border-gray-600 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-bold text-cyan-400 mb-2">Conditions</h4>
              <ul className="space-y-1 text-gray-300 text-xs">
                <li><code className="text-yellow-400">distance_to_enemy</code> - pixels to enemy</li>
                <li><code className="text-yellow-400">my_hp</code> / <code className="text-yellow-400">enemy_hp</code> - current HP</li>
                <li><code className="text-yellow-400">my_hp_percent</code> - % HP remaining</li>
                <li><code className="text-yellow-400">distance_to_wall</code> - nearest wall</li>
                <li><code className="text-yellow-400">i_am_faster</code> - boolean</li>
                <li><code className="text-yellow-400">i_am_heavier</code> - boolean</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-green-400 mb-2">Actions</h4>
              <ul className="space-y-1 text-gray-300 text-xs">
                <li><code className="text-green-400">attack</code> - rush toward enemy</li>
                <li><code className="text-green-400">retreat</code> - move away</li>
                <li><code className="text-green-400">circle_left/right</code> - circle enemy</li>
                <li><code className="text-green-400">ram</code> - charge attack</li>
                <li><code className="text-green-400">approach</code> - cautious advance</li>
                <li><code className="text-green-400">flank</code> - attack from side</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 p-2 bg-gray-800 rounded text-xs font-mono">
            <div className="text-gray-400"># Example:</div>
            <div><span className="text-purple-400">WHEN</span> my_hp_percent {'<'} 20 <span className="text-purple-400">DO</span> retreat</div>
            <div><span className="text-purple-400">WHEN</span> distance_to_enemy {'<'} 80 <span className="text-purple-400">DO</span> attack</div>
            <div><span className="text-purple-400">DEFAULT</span> approach</div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="w-full h-64 p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          spellCheck={false}
          placeholder="# Write your bot script here..."
        />
        {/* Line numbers */}
        <div className="absolute left-0 top-0 p-4 text-gray-600 font-mono text-sm select-none pointer-events-none">
          {code.split('\n').map((_, i) => (
            <div key={i} className="text-right pr-4" style={{ width: '2rem' }}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Errors */}
      {parseResult && !parseResult.isValid && (
        <div className="p-3 bg-red-900/30 border-t border-red-700">
          <div className="font-bold text-red-400 text-sm mb-1">Errors:</div>
          {parseResult.errors.map((error, i) => (
            <div key={i} className="text-red-300 text-xs font-mono">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Quick Templates */}
      <div className="p-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Quick Templates:</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              handleCodeChange(`# Aggressive Bot
WHEN distance_to_enemy < 100 DO attack
WHEN my_hp_percent < 25 DO ram
DEFAULT attack`)
            }
            className="text-xs px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded transition-colors"
          >
            Aggressive
          </button>
          <button
            onClick={() =>
              handleCodeChange(`# Defensive Bot
WHEN my_hp_percent < 30 DO retreat
WHEN distance_to_enemy < 60 DO circle_left
WHEN enemy_hp_percent < 30 DO attack
DEFAULT approach`)
            }
            className="text-xs px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded transition-colors"
          >
            Defensive
          </button>
          <button
            onClick={() =>
              handleCodeChange(`# Ram Bot
WHEN i_am_heavier DO ram
WHEN distance_to_enemy < 50 DO attack
WHEN my_hp_percent < 20 DO flee_to_center
DEFAULT ram`)
            }
            className="text-xs px-2 py-1 bg-orange-600/30 hover:bg-orange-600/50 text-orange-300 rounded transition-colors"
          >
            Ram
          </button>
          <button
            onClick={() =>
              handleCodeChange(`# Flanker Bot
WHEN distance_to_enemy < 60 DO attack
WHEN distance_to_enemy < 150 DO flank
WHEN my_hp_percent < 25 DO retreat
DEFAULT circle_right`)
            }
            className="text-xs px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded transition-colors"
          >
            Flanker
          </button>
          <button
            onClick={() =>
              handleCodeChange(`# Smart Bot
WHEN my_hp_percent < 15 DO retreat
WHEN enemy_hp_percent < 20 DO attack
WHEN i_am_heavier AND distance_to_enemy < 120 DO ram
WHEN i_am_faster DO circle_left
WHEN distance_to_enemy < 80 DO attack
DEFAULT approach`)
            }
            className="text-xs px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 rounded transition-colors"
          >
            Smart
          </button>
          <button
            onClick={() => handleCodeChange(DEFAULT_BOT_SCRIPT)}
            className="text-xs px-2 py-1 bg-gray-600/50 hover:bg-gray-600/80 text-gray-300 rounded transition-colors"
          >
            Reset Default
          </button>
        </div>
      </div>
    </div>
  );
}
