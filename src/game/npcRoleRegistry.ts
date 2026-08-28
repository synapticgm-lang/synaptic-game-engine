/**
 * WS-2 Wave 1 Batch 1A — NPC Role Registry
 * 
 * Based on: Manus WS-2 Complete Package
 * Tasks: NPC-001, NPC-002
 * 
 * 24 typed NPC roles with obligations, deadlines, and genre variants.
 */

export type NpcRole =
  // Core roles (existing from B022-B025)
  | 'guide'
  | 'quest-patron'
  | 'merchant'
  | 'faction-envoy'
  | 'companion'
  | 'rival'
  | 'herald'
  | 'keeper'
  
  // Expanded roles (WS-2)
  | 'mentor'
  | 'antagonist'
  | 'informant'
  | 'captive'
  | 'ruler'
  | 'traitor'
  | 'witness'
  | 'gatekeeper'
  | 'artisan'
  | 'courier'
  | 'refugee'
  | 'oracle'
  | 'bounty-target'
  | 'debt-holder'
  | 'conspirator'
  | 'sacrifice';

export type NpcGenre = 'litrpg' | 'dnd' | 'rpg' | 'pyoa';

export type DeadlineKind = 'hard' | 'soft' | 'story-beat' | 'quota';

export interface RoleDeadline {
  readonly kind: DeadlineKind;
  readonly turnOffset?: number; // Hard deadline: T_entry + offset
  readonly warning?: number; // Soft deadline: warning turns before hard
  readonly milestoneId?: string; // Story-beat: quest stage, faction event, etc.
  readonly quotaSuccess?: number; // Quota: min interactions for success
  readonly quotaFailure?: number; // Quota: conditions before escalation
}

export interface RoleObligationContract {
  readonly roleId: NpcRole;
  readonly description: string;
  readonly entrance: {
    readonly when: string; // Narrative condition (e.g., "opening cover", "quest accepted")
    readonly genericSpawn?: boolean; // Can spawn generically vs named only
  };
  readonly timeline: {
    readonly deadlines: readonly RoleDeadline[];
    readonly exitWindow: number; // Turns after debt satisfied before must exit
  };
  readonly exit: {
    readonly onSuccess: 'graceful' | 'transform' | 'relocate' | 'remain';
    readonly onFailure: 'escalate' | 'disappear' | 'turnover' | 'conflict';
  };
  readonly transform?: {
    readonly toRole: NpcRole;
    readonly condition: string;
  };
  readonly obligations: {
    readonly successCriteria: readonly string[];
    readonly failureCriteria: readonly string[];
    readonly observableBehaviors: readonly string[];
  };
  readonly genreVariants: Readonly<Partial<Record<NpcGenre, {
    readonly name: string;
    readonly archetype: string;
    readonly example: string;
  }>>>;
}

/**
 * 24 NPC Role Definitions
 */
export const NPC_ROLE_REGISTRY: Readonly<Record<NpcRole, RoleObligationContract>> = {
  // ========================================================================
  // CORE ROLES (8) — Existing from B022-B025
  // ========================================================================

  'guide': {
    roleId: 'guide',
    description: 'Temporary mentor who helps player through opening or crisis, then exits',
    entrance: {
      when: 'opening cover or early crisis (T < 8)',
      genericSpawn: true,
    },
    timeline: {
      deadlines: [
        {
          kind: 'story-beat',
          milestoneId: 'opening-establishment-complete',
        },
      ],
      exitWindow: 10,
    },
    exit: {
      onSuccess: 'graceful',
      onFailure: 'escalate',
    },
    obligations: {
      successCriteria: [
        'disposition recorded in GM turn',
        'exit hook offered',
        'player acknowledges guide presence',
      ],
      failureCriteria: [
        'still present at T18 after opening complete',
        'introduced but never speaks',
      ],
      observableBehaviors: [
        'speaks in opening scene',
        'offers quest or advice',
        'exits naturally',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'System Herald',
        archetype: 'Tutorial NPC',
        example: 'Aldous (Summoned Pact)',
      },
      dnd: {
        name: 'Grizzled Veteran',
        archetype: 'Mentor figure',
        example: 'Oskar (Cursed Keep)',
      },
      rpg: {
        name: 'Street Contact',
        archetype: 'Fixer / Guide',
        example: 'Marcus (Salt Road)',
      },
      pyoa: {
        name: 'Opening Witness',
        archetype: 'Crisis observer',
        example: 'Miller (Thornferry Road)',
      },
    },
  },

  'quest-patron': {
    roleId: 'quest-patron',
    description: 'NPC who gives quest, expects completion or disposition by deadline',
    entrance: {
      when: 'quest acceptance',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'hard',
          turnOffset: 10,
          warning: 3,
        },
      ],
      exitWindow: 10,
    },
    exit: {
      onSuccess: 'graceful',
      onFailure: 'escalate',
    },
    obligations: {
      successCriteria: [
        'quest completed or explicit disposition (refuse / defer / negotiate)',
        'disposition recorded by T10',
      ],
      failureCriteria: [
        'quest given but no disposition by T10',
        'player ignores patron entirely',
      ],
      observableBehaviors: [
        'offers quest',
        'records player decision',
        'exits after resolution',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Quest Giver',
        archetype: 'NPC with exclamation mark',
        example: 'Guild Master',
      },
      dnd: {
        name: 'Local Magistrate',
        archetype: 'Authority figure',
        example: 'Lord / Lady / Sheriff',
      },
      rpg: {
        name: 'Fixer',
        archetype: 'Job broker',
        example: 'Corporate handler',
      },
      pyoa: {
        name: 'Demanding Figure',
        archetype: 'Crisis stakeholder',
        example: 'Silas (Thornferry)',
      },
    },
  },

  'merchant': {
    roleId: 'merchant',
    description: 'Shopkeeper who exits after quota transactions or prolonged neglect',
    entrance: {
      when: 'hub arrival or commerce scene',
      genericSpawn: true,
    },
    timeline: {
      deadlines: [
        {
          kind: 'quota',
          quotaSuccess: 3, // 3 transactions = satisfied
        },
      ],
      exitWindow: 10,
    },
    exit: {
      onSuccess: 'remain',
      onFailure: 'disappear',
    },
    obligations: {
      successCriteria: [
        '3 transactions completed',
        'merchant acknowledged and used',
      ],
      failureCriteria: [
        'opened shop but never transacted',
        '20 turns with zero transactions',
      ],
      observableBehaviors: [
        'offers goods',
        'tracks transactions',
        'remains available',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'General Store NPC',
        archetype: 'Vendor',
        example: 'Blacksmith / Potions / Armor',
      },
      dnd: {
        name: 'Traveling Merchant',
        archetype: 'Peddler',
        example: 'Caravan trader',
      },
      rpg: {
        name: 'Fence',
        archetype: 'Black market dealer',
        example: 'Salvage broker',
      },
      pyoa: {
        name: 'Shop Keeper',
        archetype: 'Resource provider',
        example: 'Village merchant',
      },
    },
  },

  'faction-envoy': {
    roleId: 'faction-envoy',
    description: 'Representative who demands allegiance decision by deadline',
    entrance: {
      when: 'faction encounter or hub event',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'soft',
          turnOffset: 20,
          warning: 5,
        },
      ],
      exitWindow: 10,
    },
    exit: {
      onSuccess: 'graceful',
      onFailure: 'escalate',
    },
    transform: {
      toRole: 'rival',
      condition: 'player refuses allegiance after deadline',
    },
    obligations: {
      successCriteria: [
        'player makes faction choice (accept / refuse / defer)',
        'choice recorded in faction standings',
      ],
      failureCriteria: [
        'envoy ignored past deadline',
        'no faction interaction after introduction',
      ],
      observableBehaviors: [
        'introduces faction',
        'demands decision',
        'escalates if ignored',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Guild Recruiter',
        archetype: 'Faction rep',
        example: 'Circle emissary',
      },
      dnd: {
        name: 'Lord\'s Herald',
        archetype: 'Official messenger',
        example: 'King\'s envoy',
      },
      rpg: {
        name: 'Gang Envoy',
        archetype: 'Territorial rep',
        example: 'Syndicate operative',
      },
      pyoa: {
        name: 'Faction Broker',
        archetype: 'Alliance seeker',
        example: 'Rebel / Authority agent',
      },
    },
  },

  'companion': {
    roleId: 'companion',
    description: 'Party member who travels with player, no exit deadline unless betrayed',
    entrance: {
      when: 'recruitment quest or story beat',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'story-beat',
          milestoneId: 'companion-loyalty-test',
        },
      ],
      exitWindow: 0, // No auto-exit
    },
    exit: {
      onSuccess: 'remain',
      onFailure: 'turnover',
    },
    transform: {
      toRole: 'traitor',
      condition: 'betrayal or trust break',
    },
    obligations: {
      successCriteria: [
        'present in party roster',
        'speaks in party scenes',
        'loyalty tested and resolved',
      ],
      failureCriteria: [
        'recruited but never speaks again',
        'party disbanded without resolution',
      ],
      observableBehaviors: [
        'travels with player',
        'comments on story beats',
        'available for dialogue',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Party Member',
        archetype: 'Combat companion',
        example: 'Tank / Healer / DPS',
      },
      dnd: {
        name: 'Adventuring Companion',
        archetype: 'Fellow traveler',
        example: 'Ranger / Cleric / Rogue',
      },
      rpg: {
        name: 'Crew Member',
        archetype: 'Team specialist',
        example: 'Hacker / Muscle / Face',
      },
      pyoa: {
        name: 'Ally',
        archetype: 'Trusted friend',
        example: 'Silas (if trusted)',
      },
    },
  },

  'rival': {
    roleId: 'rival',
    description: 'Competitive NPC who recurs until confrontation or resolution',
    entrance: {
      when: 'conflict scene or faction split',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'story-beat',
          milestoneId: 'rival-confrontation',
        },
      ],
      exitWindow: 0, // Persists until resolved
    },
    exit: {
      onSuccess: 'transform',
      onFailure: 'conflict',
    },
    transform: {
      toRole: 'companion',
      condition: 'reconciliation or alliance',
    },
    obligations: {
      successCriteria: [
        'rivalry established in narrative',
        'confrontation scene occurs',
        'resolution recorded',
      ],
      failureCriteria: [
        'rival introduced but never recurs',
        'rivalry forgotten',
      ],
      observableBehaviors: [
        'opposes player',
        'recurs in key scenes',
        'forces confrontation',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Rival Adventurer',
        archetype: 'Competitive player',
        example: 'Guild rival',
      },
      dnd: {
        name: 'Opposing Champion',
        archetype: 'Mirror character',
        example: 'Knight of rival order',
      },
      rpg: {
        name: 'Corporate Rival',
        archetype: 'Competitor',
        example: 'Rival fixer / agent',
      },
      pyoa: {
        name: 'Antagonist',
        archetype: 'Opposing force',
        example: 'Faction enemy',
      },
    },
  },

  'herald': {
    roleId: 'herald',
    description: 'Messenger who delivers plot beat then exits',
    entrance: {
      when: 'plot advancement trigger',
      genericSpawn: true,
    },
    timeline: {
      deadlines: [
        {
          kind: 'hard',
          turnOffset: 3,
        },
      ],
      exitWindow: 3,
    },
    exit: {
      onSuccess: 'graceful',
      onFailure: 'disappear',
    },
    obligations: {
      successCriteria: [
        'message delivered',
        'player acknowledges message',
        'exits within 3 turns',
      ],
      failureCriteria: [
        'herald stays beyond delivery',
        'message never acknowledged',
      ],
      observableBehaviors: [
        'arrives',
        'delivers message',
        'exits',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'System Alert',
        archetype: 'Notification NPC',
        example: 'Messenger sprite',
      },
      dnd: {
        name: 'Royal Herald',
        archetype: 'Official messenger',
        example: 'King\'s herald',
      },
      rpg: {
        name: 'Courier',
        archetype: 'Message runner',
        example: 'Street kid / drone',
      },
      pyoa: {
        name: 'Messenger',
        archetype: 'Plot device',
        example: 'News bearer',
      },
    },
  },

  'keeper': {
    roleId: 'keeper',
    description: 'Location-bound NPC who persists at specific site',
    entrance: {
      when: 'arrive at kept location',
      genericSpawn: true,
    },
    timeline: {
      deadlines: [],
      exitWindow: 0, // Never auto-exits
    },
    exit: {
      onSuccess: 'remain',
      onFailure: 'remain',
    },
    obligations: {
      successCriteria: [
        'present at location',
        'responds to player presence',
      ],
      failureCriteria: [
        'location destroyed',
        'keeper displaced',
      ],
      observableBehaviors: [
        'guards location',
        'provides information',
        'remains at post',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Dungeon Keeper',
        archetype: 'Boss / Guardian',
        example: 'Crypt keeper',
      },
      dnd: {
        name: 'Tower Wizard',
        archetype: 'Resident',
        example: 'Sage / Hermit',
      },
      rpg: {
        name: 'Bartender',
        archetype: 'Hub anchor',
        example: 'Pub owner',
      },
      pyoa: {
        name: 'Gatekeeper',
        archetype: 'Threshold guardian',
        example: 'Bridge keeper',
      },
    },
  },

  // ========================================================================
  // EXPANDED ROLES (16) — WS-2 Addition
  // ========================================================================

  'mentor': {
    roleId: 'mentor',
    description: 'Long-term teacher who imparts skills or knowledge over time',
    entrance: {
      when: 'training request or story milestone',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'quota',
          quotaSuccess: 5, // 5 training sessions
        },
      ],
      exitWindow: 10,
    },
    exit: {
      onSuccess: 'graceful',
      onFailure: 'disappoint',
    },
    obligations: {
      successCriteria: [
        '5 training interactions',
        'skill or knowledge imparted',
        'graduation or completion beat',
      ],
      failureCriteria: [
        'training started but abandoned',
        'mentor ignored after introduction',
      ],
      observableBehaviors: [
        'teaches skills',
        'tracks progress',
        'offers final lesson',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Master Trainer',
        archetype: 'Skill NPC',
        example: 'Weapon master',
      },
      dnd: {
        name: 'Archmage',
        archetype: 'Magical mentor',
        example: 'Wizard teacher',
      },
      rpg: {
        name: 'Street Sensei',
        archetype: 'Combat trainer',
        example: 'Martial arts teacher',
      },
      pyoa: {
        name: 'Wise Elder',
        archetype: 'Knowledge keeper',
        example: 'Village elder',
      },
    },
  },

  'antagonist': {
    roleId: 'antagonist',
    description: 'Primary villain who drives main conflict, persists until final confrontation',
    entrance: {
      when: 'main plot revelation',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'story-beat',
          milestoneId: 'final-confrontation',
        },
      ],
      exitWindow: 0,
    },
    exit: {
      onSuccess: 'conflict',
      onFailure: 'remain',
    },
    obligations: {
      successCriteria: [
        'established as main villain',
        'opposes player throughout',
        'final battle occurs',
      ],
      failureCriteria: [
        'introduced but never opposes',
        'conflict never realized',
      ],
      observableBehaviors: [
        'threatens player',
        'advances evil plot',
        'forces confrontation',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Demon Lord',
        archetype: 'Final boss',
        example: 'Calamity King',
      },
      dnd: {
        name: 'Dark Lord',
        archetype: 'BBEG',
        example: 'Lich / Dragon',
      },
      rpg: {
        name: 'Crime Boss',
        archetype: 'Mastermind',
        example: 'Syndicate leader',
      },
      pyoa: {
        name: 'Oppressor',
        archetype: 'Authority villain',
        example: 'Corrupt official',
      },
    },
  },

  'informant': {
    roleId: 'informant',
    description: 'Information broker who provides intel for price, exits when dry',
    entrance: {
      when: 'information need or urban hub',
      genericSpawn: true,
    },
    timeline: {
      deadlines: [
        {
          kind: 'quota',
          quotaSuccess: 3, // 3 intel exchanges
        },
      ],
      exitWindow: 5,
    },
    exit: {
      onSuccess: 'disappear',
      onFailure: 'disappear',
    },
    obligations: {
      successCriteria: [
        '3 information exchanges',
        'intel relevant to plot',
      ],
      failureCriteria: [
        'informant introduced but never used',
        'intel ignored',
      ],
      observableBehaviors: [
        'offers information',
        'demands payment',
        'disappears when dry',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Information Broker',
        archetype: 'Guild spy',
        example: 'Rogue NPC',
      },
      dnd: {
        name: 'Tavern Rat',
        archetype: 'Street urchin',
        example: 'Pickpocket / spy',
      },
      rpg: {
        name: 'Hacker',
        archetype: 'Data broker',
        example: 'Net runner',
      },
      pyoa: {
        name: 'Whisperer',
        archetype: 'Secret keeper',
        example: 'Gossip / spy',
      },
    },
  },

  'captive': {
    roleId: 'captive',
    description: 'Prisoner or hostage who must be rescued by deadline',
    entrance: {
      when: 'rescue quest trigger',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'hard',
          turnOffset: 15,
          warning: 5,
        },
      ],
      exitWindow: 5,
    },
    exit: {
      onSuccess: 'graceful',
      onFailure: 'turnover', // Death or alternative fate
    },
    obligations: {
      successCriteria: [
        'rescue attempted',
        'captive freed or fate resolved',
      ],
      failureCriteria: [
        'deadline missed',
        'captive abandoned',
      ],
      observableBehaviors: [
        'suffers in captivity',
        'calls for help',
        'exits after rescue',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Captured Adventurer',
        archetype: 'Rescue target',
        example: 'Guild member',
      },
      dnd: {
        name: 'Princess',
        archetype: 'Damsel',
        example: 'Nobility / innocent',
      },
      rpg: {
        name: 'Hostage',
        archetype: 'Kidnap victim',
        example: 'Corporate exec',
      },
      pyoa: {
        name: 'Prisoner',
        archetype: 'Crisis victim',
        example: 'Wrongly accused',
      },
    },
  },

  'ruler': {
    roleId: 'ruler',
    description: 'Authority figure who issues major quests or faction decisions',
    entrance: {
      when: 'audience or royal summons',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'soft',
          turnOffset: 25,
          warning: 5,
        },
      ],
      exitWindow: 0, // Remains unless deposed
    },
    exit: {
      onSuccess: 'remain',
      onFailure: 'escalate',
    },
    obligations: {
      successCriteria: [
        'royal quest accepted or refused',
        'disposition recorded',
      ],
      failureCriteria: [
        'summoned but ignored',
        'ruler disrespected past deadline',
      ],
      observableBehaviors: [
        'issues commands',
        'expects obedience',
        'escalates if defied',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Kingdom Ruler',
        archetype: 'Authority NPC',
        example: 'King / Queen',
      },
      dnd: {
        name: 'Lord of the Realm',
        archetype: 'Noble',
        example: 'Duke / Baron',
      },
      rpg: {
        name: 'Corporate CEO',
        archetype: 'Powerful exec',
        example: 'Megacorp head',
      },
      pyoa: {
        name: 'Authority Figure',
        archetype: 'Power broker',
        example: 'Mayor / Governor',
      },
    },
  },

  'traitor': {
    roleId: 'traitor',
    description: 'Former ally who betrays player, triggers crisis',
    entrance: {
      when: 'betrayal trigger or story beat',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'story-beat',
          milestoneId: 'betrayal-confrontation',
        },
      ],
      exitWindow: 10,
    },
    exit: {
      onSuccess: 'conflict',
      onFailure: 'disappear',
    },
    transform: {
      toRole: 'rival',
      condition: 'betrayal incomplete',
    },
    obligations: {
      successCriteria: [
        'betrayal executed',
        'player confronts traitor',
        'resolution occurs',
      ],
      failureCriteria: [
        'betrayal never realized',
        'traitor ignored',
      ],
      observableBehaviors: [
        'enacts betrayal',
        'forces confrontation',
        'exits after resolution',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Backstabber',
        archetype: 'Party betrayer',
        example: 'Rival guild member',
      },
      dnd: {
        name: 'Judas',
        archetype: 'False friend',
        example: 'Corrupt paladin',
      },
      rpg: {
        name: 'Double Agent',
        archetype: 'Spy',
        example: 'Corp mole',
      },
      pyoa: {
        name: 'Betrayer',
        archetype: 'False ally',
        example: 'Silas (if betrays)',
      },
    },
  },

  'witness': {
    roleId: 'witness',
    description: 'Observer who saw key event, provides testimony',
    entrance: {
      when: 'investigation or legal scene',
      genericSpawn: true,
    },
    timeline: {
      deadlines: [
        {
          kind: 'hard',
          turnOffset: 5,
        },
      ],
      exitWindow: 5,
    },
    exit: {
      onSuccess: 'graceful',
      onFailure: 'disappear',
    },
    obligations: {
      successCriteria: [
        'testimony given',
        'evidence recorded',
      ],
      failureCriteria: [
        'witness never questioned',
        'testimony ignored',
      ],
      observableBehaviors: [
        'provides testimony',
        'answers questions',
        'exits after interrogation',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Event Observer',
        archetype: 'NPC with info',
        example: 'Bystander',
      },
      dnd: {
        name: 'Town Witness',
        archetype: 'Testimony giver',
        example: 'Village elder',
      },
      rpg: {
        name: 'Street Witness',
        archetype: 'Crime observer',
        example: 'Informant',
      },
      pyoa: {
        name: 'Bystander',
        archetype: 'Event witness',
        example: 'Innocent observer',
      },
    },
  },

  'gatekeeper': {
    roleId: 'gatekeeper',
    description: 'Blocks passage until condition met, then exits or remains',
    entrance: {
      when: 'arrive at gate / threshold',
      genericSpawn: true,
    },
    timeline: {
      deadlines: [
        {
          kind: 'story-beat',
          milestoneId: 'gate-condition-met',
        },
      ],
      exitWindow: 5,
    },
    exit: {
      onSuccess: 'graceful',
      onFailure: 'remain',
    },
    obligations: {
      successCriteria: [
        'condition presented',
        'player meets condition or negotiates',
        'passage granted',
      ],
      failureCriteria: [
        'gatekeeper ignored',
        'condition never met',
      ],
      observableBehaviors: [
        'blocks passage',
        'states condition',
        'allows passage when met',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Quest Gate NPC',
        archetype: 'Blocker',
        example: 'Guild receptionist',
      },
      dnd: {
        name: 'Bridge Troll',
        archetype: 'Riddle keeper',
        example: 'Sphinx / guard',
      },
      rpg: {
        name: 'Bouncer',
        archetype: 'Club security',
        example: 'Door guard',
      },
      pyoa: {
        name: 'Threshold Guardian',
        archetype: 'Test giver',
        example: 'Gate keeper',
      },
    },
  },

  'artisan': {
    roleId: 'artisan',
    description: 'Crafter who creates custom items for quests or payment',
    entrance: {
      when: 'crafting need or workshop visit',
      genericSpawn: true,
    },
    timeline: {
      deadlines: [
        {
          kind: 'quota',
          quotaSuccess: 2, // 2 crafting jobs
        },
      ],
      exitWindow: 10,
    },
    exit: {
      onSuccess: 'remain',
      onFailure: 'disappear',
    },
    obligations: {
      successCriteria: [
        '2 items crafted',
        'payment exchanged',
      ],
      failureCriteria: [
        'artisan introduced but never used',
        'no crafting occurred',
      ],
      observableBehaviors: [
        'offers crafting',
        'delivers items',
        'remains available',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Master Crafter',
        archetype: 'Profession NPC',
        example: 'Enchanter / Alchemist',
      },
      dnd: {
        name: 'Dwarven Smith',
        archetype: 'Master craftsman',
        example: 'Blacksmith',
      },
      rpg: {
        name: 'Tech Specialist',
        archetype: 'Modder',
        example: 'Cyberware installer',
      },
      pyoa: {
        name: 'Village Artisan',
        archetype: 'Skilled worker',
        example: 'Carpenter / Tailor',
      },
    },
  },

  'courier': {
    roleId: 'courier',
    description: 'Delivery NPC who brings items or messages, exits immediately',
    entrance: {
      when: 'delivery trigger',
      genericSpawn: true,
    },
    timeline: {
      deadlines: [
        {
          kind: 'hard',
          turnOffset: 1,
        },
      ],
      exitWindow: 1,
    },
    exit: {
      onSuccess: 'graceful',
      onFailure: 'disappear',
    },
    obligations: {
      successCriteria: [
        'delivery made',
        'player acknowledges',
      ],
      failureCriteria: [
        'delivery ignored',
      ],
      observableBehaviors: [
        'delivers item/message',
        'exits immediately',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'System Mailbox',
        archetype: 'Auto-delivery',
        example: 'Mail NPC',
      },
      dnd: {
        name: 'Courier',
        archetype: 'Message runner',
        example: 'Mounted messenger',
      },
      rpg: {
        name: 'Drone Delivery',
        archetype: 'Package drop',
        example: 'Automated courier',
      },
      pyoa: {
        name: 'Post Rider',
        archetype: 'Letter bearer',
        example: 'Mail carrier',
      },
    },
  },

  'refugee': {
    roleId: 'refugee',
    description: 'Displaced person seeking aid or shelter, exits after help or refusal',
    entrance: {
      when: 'crisis or humanitarian scene',
      genericSpawn: true,
    },
    timeline: {
      deadlines: [
        {
          kind: 'hard',
          turnOffset: 8,
          warning: 3,
        },
      ],
      exitWindow: 5,
    },
    exit: {
      onSuccess: 'graceful',
      onFailure: 'disappear',
    },
    obligations: {
      successCriteria: [
        'aid given or refused',
        'disposition recorded',
      ],
      failureCriteria: [
        'refugee ignored',
        'no decision made',
      ],
      observableBehaviors: [
        'seeks help',
        'records player response',
        'exits after resolution',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Displaced NPC',
        archetype: 'Quest starter',
        example: 'Village survivor',
      },
      dnd: {
        name: 'Fleeing Villager',
        archetype: 'War victim',
        example: 'Homeless peasant',
      },
      rpg: {
        name: 'Displaced Person',
        archetype: 'Social crisis',
        example: 'Evicted tenant',
      },
      pyoa: {
        name: 'Seeker',
        archetype: 'Help requester',
        example: 'Homeless stranger',
      },
    },
  },

  'oracle': {
    roleId: 'oracle',
    description: 'Prophecy giver who reveals future, exits after revelation',
    entrance: {
      when: 'mystical encounter or quest',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'hard',
          turnOffset: 3,
        },
      ],
      exitWindow: 3,
    },
    exit: {
      onSuccess: 'disappear',
      onFailure: 'disappear',
    },
    obligations: {
      successCriteria: [
        'prophecy delivered',
        'player acknowledges',
      ],
      failureCriteria: [
        'oracle ignored',
      ],
      observableBehaviors: [
        'gives prophecy',
        'vanishes',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'System Prophet',
        archetype: 'Lore NPC',
        example: 'Ancient AI',
      },
      dnd: {
        name: 'Seer',
        archetype: 'Mystic',
        example: 'Blind prophet',
      },
      rpg: {
        name: 'Precog',
        archetype: 'Psychic',
        example: 'Future reader',
      },
      pyoa: {
        name: 'Soothsayer',
        archetype: 'Fortune teller',
        example: 'Mystic guide',
      },
    },
  },

  'bounty-target': {
    roleId: 'bounty-target',
    description: 'Hunted NPC who player must capture or kill for reward',
    entrance: {
      when: 'bounty quest accepted',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'hard',
          turnOffset: 20,
          warning: 5,
        },
      ],
      exitWindow: 0,
    },
    exit: {
      onSuccess: 'conflict', // Captured/killed
      onFailure: 'disappear', // Escaped
    },
    obligations: {
      successCriteria: [
        'bounty confronted',
        'capture or kill attempted',
      ],
      failureCriteria: [
        'bounty never found',
        'deadline missed',
      ],
      observableBehaviors: [
        'flees or fights',
        'resists capture',
        'exits after resolution',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Wanted Monster',
        archetype: 'Boss target',
        example: 'Elite mob',
      },
      dnd: {
        name: 'Outlaw',
        archetype: 'Criminal',
        example: 'Bandit leader',
      },
      rpg: {
        name: 'Fugitive',
        archetype: 'Wanted person',
        example: 'Corp defector',
      },
      pyoa: {
        name: 'Hunted',
        archetype: 'Pursued target',
        example: 'Accused criminal',
      },
    },
  },

  'debt-holder': {
    roleId: 'debt-holder',
    description: 'Creditor who demands payment by deadline, escalates if unpaid',
    entrance: {
      when: 'debt trigger or loan scene',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'hard',
          turnOffset: 15,
          warning: 5,
        },
      ],
      exitWindow: 5,
    },
    exit: {
      onSuccess: 'graceful',
      onFailure: 'escalate',
    },
    transform: {
      toRole: 'antagonist',
      condition: 'debt unpaid past deadline',
    },
    obligations: {
      successCriteria: [
        'debt repaid or renegotiated',
        'disposition recorded',
      ],
      failureCriteria: [
        'debt unpaid past deadline',
        'creditor ignored',
      ],
      observableBehaviors: [
        'demands payment',
        'issues warnings',
        'escalates if unpaid',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Loan Shark',
        archetype: 'Debt collector',
        example: 'Shady merchant',
      },
      dnd: {
        name: 'Moneylender',
        archetype: 'Usurer',
        example: 'Corrupt banker',
      },
      rpg: {
        name: 'Fixer',
        archetype: 'Debt holder',
        example: 'Gang creditor',
      },
      pyoa: {
        name: 'Creditor',
        archetype: 'Debt enforcer',
        example: 'Ruthless lender',
      },
    },
  },

  'conspirator': {
    roleId: 'conspirator',
    description: 'Secret plotter who involves player in scheme, exits after reveal',
    entrance: {
      when: 'conspiracy scene or intrigue',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'story-beat',
          milestoneId: 'conspiracy-revealed',
        },
      ],
      exitWindow: 10,
    },
    exit: {
      onSuccess: 'graceful',
      onFailure: 'turnover',
    },
    obligations: {
      successCriteria: [
        'conspiracy presented',
        'player chooses side',
        'plot resolved',
      ],
      failureCriteria: [
        'conspirator exposed but plot forgotten',
        'no resolution',
      ],
      observableBehaviors: [
        'recruits player',
        'advances plot',
        'exits after reveal',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Schemer',
        archetype: 'Plot NPC',
        example: 'Guild conspirator',
      },
      dnd: {
        name: 'Court Intriguer',
        archetype: 'Political plotter',
        example: 'Noble schemer',
      },
      rpg: {
        name: 'Shadow Broker',
        archetype: 'Conspiracy leader',
        example: 'Corp infiltrator',
      },
      pyoa: {
        name: 'Plotter',
        archetype: 'Secret schemer',
        example: 'Hidden traitor',
      },
    },
  },

  'sacrifice': {
    roleId: 'sacrifice',
    description: 'NPC who must be sacrificed or saved for critical choice',
    entrance: {
      when: 'moral dilemma or crisis beat',
      genericSpawn: false,
    },
    timeline: {
      deadlines: [
        {
          kind: 'hard',
          turnOffset: 10,
          warning: 3,
        },
      ],
      exitWindow: 0,
    },
    exit: {
      onSuccess: 'turnover', // Saved or sacrificed
      onFailure: 'turnover', // Fate decided
    },
    obligations: {
      successCriteria: [
        'choice presented',
        'player decides',
        'outcome recorded',
      ],
      failureCriteria: [
        'dilemma ignored',
        'no choice made',
      ],
      observableBehaviors: [
        'presents moral choice',
        'suffers fate',
        'exits after resolution',
      ],
    },
    genreVariants: {
      litrpg: {
        name: 'Chosen Vessel',
        archetype: 'Sacrifice target',
        example: 'Ritual victim',
      },
      dnd: {
        name: 'Virgin Sacrifice',
        archetype: 'Classic trope',
        example: 'Cult target',
      },
      rpg: {
        name: 'Hostage',
        archetype: 'Moral lever',
        example: 'Collateral',
      },
      pyoa: {
        name: 'Martyr',
        archetype: 'Crisis victim',
        example: 'Innocent in danger',
      },
    },
  },
};

/**
 * NPC-001 — Get role definition
 */
export function getNpcRole(roleId: NpcRole): RoleObligationContract {
  return NPC_ROLE_REGISTRY[roleId];
}

/**
 * NPC-002 — Validate role registry completeness
 */
export function assertRoleRegistryComplete(): void {
  const expectedRoles = 24;
  const actualRoles = Object.keys(NPC_ROLE_REGISTRY).length;

  if (actualRoles !== expectedRoles) {
    throw new Error(
      `Role registry incomplete: expected ${expectedRoles} roles, found ${actualRoles}`,
    );
  }

  // Validate each role has required fields
  for (const [roleId, contract] of Object.entries(NPC_ROLE_REGISTRY)) {
    if (!contract.roleId) {
      throw new Error(`Role ${roleId} missing roleId field`);
    }
    if (!contract.description) {
      throw new Error(`Role ${roleId} missing description field`);
    }
    if (!contract.entrance.when) {
      throw new Error(`Role ${roleId} missing entrance.when field`);
    }
    if (!contract.exit.onSuccess || !contract.exit.onFailure) {
      throw new Error(`Role ${roleId} missing exit conditions`);
    }
    if (contract.obligations.successCriteria.length === 0) {
      throw new Error(`Role ${roleId} has no success criteria`);
    }
  }
}

/**
 * NPC-002 — Get genre variant for role
 */
export function getRoleGenreVariant(
  roleId: NpcRole,
  genre: NpcGenre,
): { name: string; archetype: string; example: string } | undefined {
  const contract = getNpcRole(roleId);
  return contract.genreVariants[genre];
}

/**
 * NPC-002 — Get all roles with specific entrance condition
 */
export function getRolesByEntranceCondition(condition: string): NpcRole[] {
  return (Object.entries(NPC_ROLE_REGISTRY) as Array<[NpcRole, RoleObligationContract]>)
    .filter(([_, contract]) => contract.entrance.when.includes(condition))
    .map(([roleId]) => roleId);
}

/**
 * NPC-002 — Get all roles that can transform
 */
export function getTransformableRoles(): Array<{
  roleId: NpcRole;
  toRole: NpcRole;
  condition: string;
}> {
  return (Object.entries(NPC_ROLE_REGISTRY) as Array<[NpcRole, RoleObligationContract]>)
    .filter(([_, contract]) => contract.transform !== undefined)
    .map(([roleId, contract]) => ({
      roleId,
      toRole: contract.transform!.toRole,
      condition: contract.transform!.condition,
    }));
}

// ============================================================================
// ROLE UTILITY FUNCTIONS (for npcLifecycleFsm)
// ============================================================================

/**
 * Export ROLE_OBLIGATIONS as alias for NPC_ROLE_REGISTRY
 */
export const ROLE_OBLIGATIONS = NPC_ROLE_REGISTRY;

/**
 * Infer NPC role from keywords or context
 * Returns null if role cannot be inferred
 */
export function inferNpcRole(keywords: string[]): NpcRole | null {
  const keywordLower = keywords.map(k => k.toLowerCase());
  
  // Check for quest-related keywords
  if (keywordLower.some(k => k.includes('quest') || k.includes('patron') || k.includes('job'))) {
    return 'quest-patron';
  }
  
  // Check for merchant keywords
  if (keywordLower.some(k => k.includes('merchant') || k.includes('shop') || k.includes('trade') || k.includes('sell'))) {
    return 'merchant';
  }
  
  // Check for guide keywords
  if (keywordLower.some(k => k.includes('guide') || k.includes('help') || k.includes('tutorial'))) {
    return 'guide';
  }
  
  // Check for keeper/gatekeeper keywords
  if (keywordLower.some(k => k.includes('gate') || k.includes('guard') || k.includes('keeper') || k.includes('door'))) {
    return 'gatekeeper';
  }
  
  // Default: cannot infer
  return null;
}

/**
 * Calculate role deadline based on contract
 * Returns null if no deadline applies
 */
export function calculateRoleDeadline(
  role: NpcRole,
  currentTurn: number,
  state: { openingEstablishment?: { complete?: boolean } }
): number | null {
  const contract = getNpcRole(role);
  
  if (!contract.timeline || contract.timeline.deadlines.length === 0) {
    return null;
  }
  
  // Use first deadline (hard deadlines take priority)
  const deadline = contract.timeline.deadlines[0];
  
  if (deadline.kind === 'hard' && deadline.turnOffset !== undefined) {
    return currentTurn + deadline.turnOffset;
  }
  
  if (deadline.kind === 'soft' && deadline.turnOffset !== undefined) {
    return currentTurn + deadline.turnOffset;
  }
  
  if (deadline.kind === 'story-beat') {
    // Check if milestone is complete
    if (deadline.milestoneId === 'opening-establishment-complete') {
      return state.openingEstablishment?.complete ? currentTurn + 10 : null;
    }
    return null;
  }
  
  // Quota deadlines don't have turn-based deadlines
  if (deadline.kind === 'quota') {
    return null;
  }
  
  return null;
}

/**
 * Check if role obligation is satisfied
 */
export function isRoleSatisfied(
  role: NpcRole,
  npcId: string,
  state: {
    openingEstablishment?: { complete?: boolean };
    quests?: Array<{ source?: string; status?: string }>;
    turn: number;
  }
): boolean {
  const contract = getNpcRole(role);
  
  // Special case: guide role satisfied when opening complete
  if (role === 'guide' && state.openingEstablishment?.complete) {
    return true;
  }
  
  // Special case: quest-patron satisfied when quest has disposition
  if (role === 'quest-patron') {
    const hasQuest = state.quests?.some(q => 
      q.source === npcId && (q.status === 'active' || q.status === 'complete' || q.status === 'failed')
    );
    return hasQuest ?? false;
  }
  
  // Special case: merchant with quota
  if (role === 'merchant') {
    const quotaDeadline = contract.timeline?.deadlines.find(d => d.kind === 'quota');
    if (quotaDeadline?.quotaSuccess) {
      // Would need transaction count from state
      return false; // Not satisfied by default
    }
  }
  
  // Default: not satisfied
  return false;
}

/**
 * Format role obligation for GM mandate
 */
export function formatRoleObligation(
  role: NpcRole,
  npcId: string,
  deadline: number | null
): string {
  const contract = getNpcRole(role);
  const deadlineText = deadline !== null ? ` (deadline: T${deadline})` : '';
  
  return `NPC ROLE (${npcId}): ${contract.description}${deadlineText}`;
}

/**
 * Format exit mandate
 */
export function formatExitMandate(
  role: NpcRole,
  npcId: string,
  reason: 'success' | 'failure' | 'deadline' | 'transform'
): string {
  const contract = getNpcRole(role);
  const exitBehavior = reason === 'success' ? contract.exit.onSuccess : contract.exit.onFailure;
  
  return `NPC EXIT (${npcId}): ${reason} - ${exitBehavior}`;
}
