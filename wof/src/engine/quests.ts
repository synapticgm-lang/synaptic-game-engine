import type { CharacterState, QuestDef, QuestProgress, WorldPack } from '../types';

export function startQuest(ch: CharacterState, quest: QuestDef): CharacterState {
  if (ch.quests.some((q) => q.questId === quest.id)) return ch;
  return {
    ...ch,
    quests: [...ch.quests, { questId: quest.id, objectiveIndex: 0, counts: {}, rewarded: false }],
    firstHour: { ...ch.firstHour, hasAcceptedFirstQuest: true },
  };
}

export function tickVisit(ch: CharacterState, pack: WorldPack, placeId: string): CharacterState {
  return tick(ch, pack, (obj) => obj.kind === 'visit_place' && obj.placeId === placeId);
}

export function tickTalk(ch: CharacterState, pack: WorldPack, npcId: string): CharacterState {
  return tick(ch, pack, (obj) => obj.kind === 'talk_to_npc' && obj.npcId === npcId);
}

export function tickKill(ch: CharacterState, pack: WorldPack, speciesId: string, n: number): CharacterState {
  return tick(ch, pack, (obj) => obj.kind === 'ledger_kill' && obj.speciesId === speciesId, n);
}

export function tickDeliver(ch: CharacterState, pack: WorldPack, itemId: string, npcId: string): CharacterState {
  return tick(ch, pack, (obj) => obj.kind === 'deliver_item' && obj.itemId === itemId && obj.npcId === npcId);
}

export function tickCollect(ch: CharacterState, pack: WorldPack, itemId: string, n = 1): CharacterState {
  return tick(ch, pack, (obj) => obj.kind === 'collect_item' && obj.itemId === itemId, n);
}

function tick(
  ch: CharacterState,
  pack: WorldPack,
  match: (obj: QuestDef['objectives'][number]) => boolean,
  add = 1
): CharacterState {
  const quests = ch.quests.map((prog) => {
    const def = pack.quests.find((q) => q.id === prog.questId);
    if (!def || prog.rewarded) return prog;
    const obj = def.objectives[prog.objectiveIndex];
    if (!obj || !match(obj)) return prog;
    const key = obj.id;
    const need = obj.count ?? 1;
    const nextCount = (prog.counts[key] ?? 0) + add;
    const counts = { ...prog.counts, [key]: nextCount };
    if (nextCount >= need) {
      const nextIndex = prog.objectiveIndex + 1;
      if (nextIndex >= def.objectives.length) {
        return { ...prog, counts, objectiveIndex: nextIndex };
      }
      return { ...prog, counts, objectiveIndex: nextIndex };
    }
    return { ...prog, counts };
  });
  return { ...ch, quests, firstHour: { ...ch.firstHour, hasSeenJournalTick: true } };
}

/** Code grants gold once. Prose cannot call this twice for the same quest. */
export function grantQuestReward(ch: CharacterState, pack: WorldPack, questId: string): CharacterState {
  const def = pack.quests.find((q) => q.id === questId);
  const prog = ch.quests.find((q) => q.questId === questId);
  if (!def || !prog || prog.rewarded) return ch;
  if (prog.objectiveIndex < def.objectives.length) return ch;
  const nextQuests: QuestProgress[] = ch.quests.map((q) =>
    q.questId === questId ? { ...q, rewarded: true } : q
  );
  let next = {
    ...ch,
    gold: ch.gold + def.rewardGold,
    xp: ch.xp + def.rewardXp,
    quests: nextQuests,
  };
  if (def.unlocksQuestId) {
    const follow = pack.quests.find((q) => q.id === def.unlocksQuestId);
    if (follow) next = startQuest(next, follow);
  }
  return next;
}

export function visibleJournal(ch: CharacterState, pack: WorldPack): string[] {
  return ch.quests
    .map((q) => pack.quests.find((d) => d.id === q.questId))
    .filter((d): d is QuestDef => !!d && !d.hidden)
    .map((d) => d.title);
}
