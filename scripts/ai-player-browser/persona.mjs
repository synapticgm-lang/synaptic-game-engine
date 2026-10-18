/**
 * Persona + life-goal for AI-tester play.
 * Flags: --persona dungeon-diver --goal 'max out dungeon levels'
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PERSONA_DIR = path.join(HERE, 'personas');

/**
 * @param {string[]} argv
 * @returns {{ personaId: string, goal: string }}
 */
export function parsePersonaArgs(argv = []) {
  const args = Array.isArray(argv) ? argv : [];
  const personaFlag = args.find((a) => a.startsWith('--persona='));
  const goalFlag = args.find((a) => a.startsWith('--goal='));
  let personaId = personaFlag ? personaFlag.slice('--persona='.length).trim() : '';
  let goal = goalFlag ? goalFlag.slice('--goal='.length).trim() : '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--persona' && args[i + 1]) personaId = String(args[i + 1]).trim();
    if (args[i] === '--goal' && args[i + 1]) goal = String(args[i + 1]).trim();
  }
  return { personaId, goal };
}

/**
 * Load a persona file (scripts/ai-player-browser/personas/<id>.json) or build from flags.
 * @param {{ personaId?: string, goal?: string, file?: string }} opts
 */
export function loadPersona(opts = {}) {
  const personaId = String(opts.personaId || 'adventurer').trim() || 'adventurer';
  const file = opts.file
    || path.join(PERSONA_DIR, `${personaId}.json`);
  let fromFile = {};
  if (fs.existsSync(file)) {
    try {
      fromFile = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      fromFile = {};
    }
  }
  const goal = String(opts.goal || fromFile.goal || '').trim();
  const name = String(fromFile.name || personaId).trim();
  const blurb = String(fromFile.blurb || fromFile.description || '').trim();
  return {
    id: personaId,
    name,
    goal,
    blurb,
    file: fs.existsSync(file) ? file : null,
  };
}

/**
 * Prompt block the player model sees — must include the life-goal when set.
 */
export function buildPersonaPromptBlock(persona) {
  const p = persona || {};
  const lines = [
    `PERSONA: ${p.name || p.id || 'adventurer'}`,
  ];
  if (p.blurb) lines.push(`Who you are: ${p.blurb}`);
  if (p.goal) {
    lines.push(`LIFE-GOAL: ${p.goal}`);
    lines.push('Plan every move toward that life-goal. Prefer chips or typed lines that advance it.');
  } else {
    lines.push('LIFE-GOAL: (none set — play naturally toward interesting progress).');
  }
  return lines.join('\n');
}
