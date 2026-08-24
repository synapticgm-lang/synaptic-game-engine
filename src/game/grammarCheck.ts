/**
 * Grammar and style checking using LanguageTool.
 * Runs post-GM to fix common English errors that AI models make.
 * Works with any AI model (DeepSeek, Claude, GPT, etc.)
 */

import LanguageToolAPI from 'languagetool-api';

export interface GrammarMatch {
  message: string;
  offset: number;
  length: number;
  replacements: string[];
  ruleId: string;
  confidence: number;
}

export interface GrammarCheckResult {
  originalText: string;
  correctedText: string;
  matches: GrammarMatch[];
  appliedFixes: number;
}

let ltInstance: LanguageToolAPI | null = null;

/**
 * Initialize LanguageTool API (lazy, cached)
 */
function getLanguageTool(): LanguageToolAPI {
  if (!ltInstance) {
    ltInstance = new LanguageToolAPI({
      language: 'en-US',
      // Use free public API for now (can self-host later for speed)
      apiUrl: 'https://api.languagetool.org/v2',
    });
  }
  return ltInstance;
}

/**
 * Check text for grammar/style issues and return matches.
 * Does not auto-apply fixes - caller decides what to do with them.
 */
export async function checkGrammar(text: string): Promise<GrammarMatch[]> {
  if (!text?.trim()) return [];
  
  try {
    const lt = getLanguageTool();
    const result = await lt.check(text);
    
    return (result.matches || []).map((m: any) => ({
      message: m.message || '',
      offset: m.offset || 0,
      length: m.length || 0,
      replacements: (m.replacements || []).map((r: any) => r.value),
      ruleId: m.rule?.id || '',
      confidence: m.rule?.confidence || 0,
    }));
  } catch (error) {
    console.error('[grammarCheck] LanguageTool API failed:', error);
    // Silent failure - don't block gameplay
    return [];
  }
}

/**
 * Apply high-confidence grammar fixes to text.
 * Only applies fixes with confidence >= threshold.
 */
export async function applyGrammarFixes(
  text: string,
  confidenceThreshold = 0.8
): Promise<GrammarCheckResult> {
  const matches = await checkGrammar(text);
  
  // Sort by offset descending so we can apply from end to start
  // (avoids offset shifting as we replace text)
  const highConfidence = matches
    .filter(m => m.confidence >= confidenceThreshold && m.replacements.length > 0)
    .sort((a, b) => b.offset - a.offset);
  
  let corrected = text;
  let appliedCount = 0;
  
  for (const match of highConfidence) {
    const before = corrected.substring(0, match.offset);
    const after = corrected.substring(match.offset + match.length);
    const replacement = match.replacements[0]; // Use first (best) suggestion
    
    corrected = before + replacement + after;
    appliedCount++;
  }
  
  return {
    originalText: text,
    correctedText: corrected,
    matches,
    appliedFixes: appliedCount,
  };
}

/**
 * Lightweight grammar check for critical errors only.
 * Faster than full check, use during gameplay.
 */
export async function quickGrammarCheck(text: string): Promise<string> {
  const result = await applyGrammarFixes(text, 0.9); // Only very high confidence
  return result.correctedText;
}

/**
 * Full grammar check with all suggestions.
 * Use for admin review / debugging.
 */
export async function fullGrammarCheck(text: string): Promise<GrammarCheckResult> {
  return applyGrammarFixes(text, 0.6); // Include medium confidence
}
