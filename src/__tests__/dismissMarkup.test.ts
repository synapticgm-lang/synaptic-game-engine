/**
 * q51f-AIPOVL3: pure dismiss controls carry data-dismiss; commit buttons do not.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AutoFightTipModal } from '@/components/AutoFightTipModal';
import { QuestUnlockModal } from '@/components/QuestUnlockModal';
import { MainQuestCompleteModal } from '@/components/qol/MainQuestCompleteModal';
import type { Quest } from '@/game/types';

function buttons(html: string) {
  const out: { text: string; dismiss: boolean }[] = [];
  const re = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    out.push({ text, dismiss: /\bdata-dismiss\b/.test(m[1]) });
  }
  return out;
}

const quest = { id: 'q1', name: 'Echoes', description: 'A key in the rubble.' } as Quest;

describe('q51f dismiss markup', () => {
  it('Auto Fight tip marks only Got it', () => {
    const html = renderToStaticMarkup(createElement(AutoFightTipModal, {
      combatResolveMode: 'full',
      onEnableAuto: () => {},
      onDismiss: () => {},
    }));
    const found = buttons(html);
    expect(found.filter((b) => b.dismiss).map((b) => b.text)).toEqual(['Got it']);
    expect(found.find((b) => b.text.includes('Turn on Auto Fight'))?.dismiss).toBe(false);
  });

  it('quest unlock marks only Continue', () => {
    const html = renderToStaticMarkup(createElement(QuestUnlockModal, {
      quests: [quest],
      onClose: () => {},
      onOpenJournal: () => {},
    }));
    const found = buttons(html);
    expect(found.filter((b) => b.dismiss).map((b) => b.text)).toEqual(['Continue']);
    expect(found.find((b) => b.text === 'Open journal')?.dismiss).toBe(false);
  });

  it('main quest complete marks only the keep-playing button', () => {
    const html = renderToStaticMarkup(createElement(MainQuestCompleteModal, {
      prompt: { questId: 'q1', questName: 'Echoes', epilogue: ['The tower stayed down.'] },
      litrpg: false,
      busy: false,
      onContinue: () => {},
      onFinish: () => {},
    }));
    const found = buttons(html);
    const marked = found.filter((b) => b.dismiss);
    expect(marked).toHaveLength(1);
    expect(marked[0].text).not.toMatch(/Finish/);
    expect(found.find((b) => b.text.includes('Finish'))?.dismiss).toBe(false);
  });
});
