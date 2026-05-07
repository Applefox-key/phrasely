import type { ExpressionData, Label, User } from '../../shared/types';

export const DEMO_USER: User = {
  id: 999,
  name: 'Demo User',
  email: 'demo@phrasely.app',
};

export const DEMO_LABELS: Label[] = [
  { id: 1, name: 'common verbs' },
  { id: 2, name: 'since terms' },
  { id: 3, name: 'advanced vocabulary' },
];

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(12, 0, 0, 0);
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
twoDaysAgo.setHours(12, 0, 0, 0);
const today = new Date();
today.setHours(12, 0, 0, 0);

const makeHistory = (note = 'add') => JSON.stringify([{ action: note, date: Date.now() }]);

export const DEMO_EXPRESSIONS: ExpressionData[] = [
  // ── label 1: common verbs ────────────────────────────────────────────────
  {
    id: 1,
    phrase: "I can't wrap my head around this concept.",
    expression: 'wrap my head around',
    note: 'to understand something difficult',
    stage: 2,
    status: 'active',
    nextDate: yesterday.getTime(),
    history: makeHistory(),
    inQueue: false,
    labelid: 1,
    label: 'common verbs',
  },
  {
    id: 2,
    phrase: 'She really hit the nail on the head with that idea.',
    expression: 'hit the nail on the head',
    note: 'to be exactly right',
    stage: 1,
    status: 'active',
    nextDate: yesterday.getTime(),
    history: makeHistory(),
    inQueue: false,
    labelid: 1,
    label: 'common verbs',
  },
  {
    id: 3,
    phrase: "We need to get the ball rolling on this project.",
    expression: 'get the ball rolling',
    note: 'to start something',
    stage: 0,
    status: 'active',
    nextDate: today.getTime(),
    history: makeHistory(),
    inQueue: false,
    labelid: 1,
    label: 'common verbs',
  },
  {
    id: 4,
    phrase: "Don't let the opportunity slip through your fingers.",
    expression: 'slip through your fingers',
    note: 'to lose a chance',
    stage: 3,
    status: 'active',
    nextDate: twoDaysAgo.getTime(),
    history: makeHistory(),
    inQueue: false,
    labelid: 1,
    label: 'common verbs',
  },

  // ── label 2: since terms ─────────────────────────────────────────────────
  {
    id: 5,
    phrase: "I've been learning Spanish on and off since childhood.",
    expression: 'on and off',
    note: 'intermittently, not regularly',
    stage: 4,
    status: 'active',
    nextDate: yesterday.getTime(),
    history: makeHistory(),
    inQueue: false,
    labelid: 2,
    label: 'since terms',
  },
  {
    id: 6,
    phrase: 'She has been working at the company ever since she graduated.',
    expression: 'ever since',
    note: 'from that time until now',
    stage: 1,
    status: 'active',
    nextDate: today.getTime(),
    history: makeHistory(),
    inQueue: false,
    labelid: 2,
    label: 'since terms',
  },
  {
    id: 7,
    phrase: "It's been ages since we last caught up properly.",
    expression: "it's been ages",
    note: 'a very long time has passed',
    stage: 0,
    status: 'active',
    nextDate: yesterday.getTime(),
    history: makeHistory(),
    inQueue: false,
    labelid: 2,
    label: 'since terms',
  },
  {
    id: 8,
    phrase: 'Since time immemorial, people have gathered around fire.',
    expression: 'since time immemorial',
    note: 'since ancient times, longer than anyone can remember',
    stage: 2,
    status: 'active',
    nextDate: twoDaysAgo.getTime(),
    history: makeHistory(),
    inQueue: false,
    labelid: 2,
    label: 'since terms',
  },

  // ── label 3: advanced vocabulary ────────────────────────────────────────
  {
    id: 9,
    phrase: 'Her serendipitous discovery changed the field of medicine forever.',
    expression: 'serendipitous',
    note: 'happening by fortunate accident',
    stage: 1,
    status: 'active',
    nextDate: yesterday.getTime(),
    history: makeHistory(),
    inQueue: false,
    labelid: 3,
    label: 'advanced vocabulary',
  },
  {
    id: 10,
    phrase: 'The politician gave an equivocal answer to avoid controversy.',
    expression: 'equivocal',
    note: 'deliberately vague or ambiguous',
    stage: 0,
    status: 'active',
    nextDate: today.getTime(),
    history: makeHistory(),
    inQueue: false,
    labelid: 3,
    label: 'advanced vocabulary',
  },
  {
    id: 11,
    phrase: "The CEO's hubris led to the company's downfall.",
    expression: 'hubris',
    note: 'excessive pride or self-confidence',
    stage: 3,
    status: 'active',
    nextDate: yesterday.getTime(),
    history: makeHistory(),
    inQueue: false,
    labelid: 3,
    label: 'advanced vocabulary',
  },
  {
    id: 12,
    phrase: 'The old professor spoke with perspicacity on every topic.',
    expression: 'perspicacity',
    note: 'ability to notice and understand things clearly',
    stage: 2,
    status: 'active',
    nextDate: twoDaysAgo.getTime(),
    history: makeHistory(),
    inQueue: false,
    labelid: 3,
    label: 'advanced vocabulary',
  },
];
