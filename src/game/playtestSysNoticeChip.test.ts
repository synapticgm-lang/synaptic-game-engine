/**
 * LitRPG / RPG System notification chip — display derivation only.
 * No XP / skill / quest engine changes.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  briefSystemNoticeCue,
  checkSystemChipLabel,
  collapseNotificationStatus,
  deriveSystemNotifications,
  isLevelOrRankUpLine,
  isPerUseSkillLine,
  isSystemNotificationLine,
  presentSystemNotices,
  systemNotice,
  usesSystemNoticeChip,
} from './systemNotice';

describe('playtestSysNoticeChip — notification derivation', () => {
  it('matches level-up, skill rank-up, quest complete, XP, loot, gold', () => {
    expect(isSystemNotificationLine('Level Up! Now level 2')).toBe(true);
    expect(isSystemNotificationLine(systemNotice('Level Up! Now level 2'))).toBe(true);
    expect(isSystemNotificationLine('Skill rank up: Searching (rank 1).')).toBe(true);
    expect(isSystemNotificationLine(systemNotice('Skill rank up: Searching (rank 1).'))).toBe(true);
    expect(isSystemNotificationLine('Quest complete: Circle\'s Price')).toBe(true);
    expect(isSystemNotificationLine('XP Gained: 25 (combat)')).toBe(true);
    expect(isSystemNotificationLine(systemNotice('XP Gained: 25 (combat)'))).toBe(true);
    expect(isSystemNotificationLine('Loot: [Rare] Ash Blade')).toBe(true);
    expect(isSystemNotificationLine('Gold Gained: 5')).toBe(true);
  });

  it('rejects per-use skill / technique and unrelated STATUS', () => {
    expect(isPerUseSkillLine('Technique used: Keen Eye (1 MP).')).toBe(true);
    expect(isSystemNotificationLine('Technique used: Keen Eye (1 MP).')).toBe(false);
    expect(isSystemNotificationLine(systemNotice('Technique used: Keen Eye (1 MP).'))).toBe(false);
    expect(isSystemNotificationLine('Quest Unlocked: Circle\'s Price')).toBe(false);
    expect(isSystemNotificationLine('HP: 10 / 20')).toBe(false);
    expect(isSystemNotificationLine('')).toBe(false);
    expect(isLevelOrRankUpLine('Technique used: Keen Eye (1 MP).')).toBe(false);
  });

  it('derives presented LitRPG notices and ignores tabletop', () => {
    const raw = [
      'Level Up! Now level 2',
      'Technique used: Keen Eye (1 MP).',
      'XP Gained: 25 (combat)',
      'Quest complete: Circle\'s Price',
    ];
    expect(deriveSystemNotifications(raw, 'litrpg')).toEqual([
      'Level up — level 2.',
      'XP — +25 (combat).',
      'Quest complete — Circle\'s Price.',
    ]);
    expect(deriveSystemNotifications(raw, 'rpg')).toEqual([
      'Level Up! Now level 2',
      'XP Gained: 25 (combat)',
      'Quest complete: Circle\'s Price',
    ]);
    expect(deriveSystemNotifications(raw, 'dnd')).toEqual([]);
    expect(usesSystemNoticeChip('litrpg')).toBe(true);
    expect(usesSystemNoticeChip('rpg')).toBe(true);
    expect(usesSystemNoticeChip('dnd')).toBe(false);
  });

  it('collapses chat STATUS to one brief cue (mode wording)', () => {
    const presented = presentSystemNotices(
      ['Level Up! Now level 2', 'Encounter cleared: Skirmisher (defeat)', 'XP Gained: 25 (combat)'],
      'litrpg',
    );
    expect(collapseNotificationStatus(presented, 'litrpg')).toEqual([
      'You have a new System notification.',
      'Encounter cleared: Skirmisher (defeat)',
    ]);
    expect(briefSystemNoticeCue('rpg')).toBe('You have a new notice.');
    expect(collapseNotificationStatus(
      ['XP Gained: 10 (talk)', 'Location: West Wall'],
      'rpg',
    )).toEqual(['You have a new notice.', 'Location: West Wall']);
    expect(collapseNotificationStatus(['Location: West Wall'], 'litrpg')).toEqual(['Location: West Wall']);
    expect(collapseNotificationStatus(['XP Gained: 10 (talk)'], 'dnd')).toEqual(['XP Gained: 10 (talk)']);
  });

  it('chip label stacks unread count', () => {
    expect(checkSystemChipLabel('litrpg', 0)).toBe('Check System');
    expect(checkSystemChipLabel('litrpg', 3)).toBe('Check System (3)');
    expect(checkSystemChipLabel('rpg', 2)).toBe('Check notices (2)');
  });
});

describe('playtestSysNoticeChip — chip + panel render', () => {
  it('renders Check System chip with count', async () => {
    const { CheckSystemChip } = await import('../components/CheckSystemChip');
    const html = renderToStaticMarkup(
      createElement(CheckSystemChip, { engineMode: 'litrpg', unread: 3, onOpen: () => {} }),
    );
    expect(html).toContain('Check System (3)');
    expect(html).toMatch(/data-testid="check-system-chip"/);
  });

  it('hides chip when unread is 0', async () => {
    const { CheckSystemChip } = await import('../components/CheckSystemChip');
    const html = renderToStaticMarkup(
      createElement(CheckSystemChip, { engineMode: 'litrpg', unread: 0, onOpen: () => {} }),
    );
    expect(html).toBe('');
  });

  it('renders System window with Character sheet button', async () => {
    const { SystemNoticeWindow } = await import('../components/SystemNoticeWindow');
    const onSheet = vi.fn();
    const html = renderToStaticMarkup(
      createElement(SystemNoticeWindow, {
        open: true,
        lines: ['Level up — level 2.', 'XP — +25 (combat).'],
        engineMode: 'litrpg',
        onClose: () => {},
        onOpenCharacterSheet: onSheet,
      }),
    );
    expect(html).toContain('System window');
    expect(html).toContain('Level up — level 2.');
    expect(html).toContain('Character sheet');
    expect(html).toMatch(/data-testid="system-notice-window"/);
  });
});
