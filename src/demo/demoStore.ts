import { create } from 'zustand';
import { DEMO_EXPRESSIONS, DEMO_LABELS, DEMO_USER } from './demoData';
import type { ExpressionData, ExpressionUpdate, Label } from '../types';

interface DemoState {
  user: typeof DEMO_USER;
  expressions: ExpressionData[];
  labels: Label[];

  getUnread: () => ExpressionData[];

  addExpression: (data: Partial<ExpressionData>) => ExpressionData;
  updateExpression: (update: ExpressionUpdate) => void;
  deleteExpression: (id: number) => void;
  deleteSomeExpressions: (ids: number[]) => void;
  addLabel: (name: string) => Label;
  updateLabel: (id: number, name: string) => void;
  deleteLabel: (id: number) => void;
}

export const useDemoStore = create<DemoState>((set, get) => ({
  user: DEMO_USER,
  expressions: JSON.parse(JSON.stringify(DEMO_EXPRESSIONS)) as ExpressionData[],
  labels: JSON.parse(JSON.stringify(DEMO_LABELS)) as Label[],

  getUnread: () => {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const cutoff = todayEnd.getTime() + tzOffsetMs;

    return get().expressions.filter(
      (e) =>
        e.status === 'active' &&
        (e.stage ?? 0) < 9 &&
        !e.inQueue &&
        new Date(e.nextDate).getTime() <= cutoff
    );
  },

  addExpression: (data) => {
    const newExp: ExpressionData = {
      id: Date.now(),
      phrase: data.phrase ?? '',
      expression: data.expression ?? '',
      note: data.note ?? null,
      stage: 0,
      status: 'new',
      nextDate: new Date().setHours(12, 0, 0, 0),
      history: JSON.stringify([{ action: 'add', date: Date.now() }]),
      inQueue: false,
      labelid: data.labelid ?? null,
      label: data.labelid
        ? get().labels.find((l) => l.id === data.labelid)?.name ?? null
        : null,
    };
    set((s) => ({ expressions: [...s.expressions, newExp] }));
    return newExp;
  },

  updateExpression: (update) =>
    set((s) => ({
      expressions: s.expressions.map((e) => {
        if (e.id !== update.id) return e;
        const next = { ...e };
        if (update.stage !== undefined) next.stage = update.stage;
        if (update.nextDate !== undefined) next.nextDate = update.nextDate;
        if (update.history !== undefined) next.history = update.history;
        if (update.status !== undefined) next.status = update.status as ExpressionData['status'];
        if (update.inQueue !== undefined) next.inQueue = update.inQueue;
        if (update.phrase !== undefined) next.phrase = update.phrase;
        if (update.expression !== undefined) next.expression = update.expression;
        if ('note' in update) next.note = update.note;
        if ('labelid' in update) {
          next.labelid = update.labelid;
          next.label = update.labelid
            ? s.labels.find((l) => l.id === update.labelid)?.name ?? null
            : null;
        }
        return next;
      }),
    })),

  deleteExpression: (id) =>
    set((s) => ({ expressions: s.expressions.filter((e) => e.id !== id) })),

  deleteSomeExpressions: (ids) =>
    set((s) => ({ expressions: s.expressions.filter((e) => !ids.includes(e.id)) })),

  addLabel: (name) => {
    const newLabel: Label = { id: Date.now(), name };
    set((s) => ({ labels: [...s.labels, newLabel] }));
    return newLabel;
  },

  updateLabel: (id, name) =>
    set((s) => ({
      labels: s.labels.map((l) => (l.id === id ? { ...l, name } : l)),
    })),

  deleteLabel: (id) =>
    set((s) => ({
      labels: s.labels.filter((l) => l.id !== id),
      expressions: s.expressions.map((e) =>
        e.labelid === id ? { ...e, labelid: null, label: null } : e
      ),
    })),
}));
