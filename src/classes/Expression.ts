import type { ExpressionData, ExpressionUpdate, HistoryEntry } from '../types';

// status  string  "new", "active", "paused", "completed"
// inQueue boolean user added phrase to the potential tasks queue
export class Expression {
  #expression: string;
  #phrase: string;
  #nextDate: Date;
  #stage: number;
  #id: number;
  #history: HistoryEntry[];
  #labelid: number | null | undefined;
  #label: string | null | undefined;
  #note: string | null | undefined;
  #status: string;
  #inQueue: boolean;

  constructor(e: ExpressionData) {
    this.#expression = e.expression;
    this.#phrase = e.phrase;
    this.#nextDate = new Date(e.nextDate);
    this.#stage = e.stage;
    this.#id = e.id;
    this.#labelid = e.labelid;
    this.#label = e.label;
    this.#note = e.note;
    this.#status = e.status || 'new';
    this.#inQueue = !!e.inQueue;
    if (e.history === undefined) {
      this.#history = [];
      this.#history.push({ action: 'add', date: new Date() });
    } else if (Array.isArray(e.history)) {
      this.#history = e.history;
    } else {
      this.#history = JSON.parse(e.history as string);
    }
  }

  #getHistoryEvent(key: string): HistoryEntry {
    const templates: Record<string, string> = {
      readLate: 'read late',
      readByPlan: 'read by the plan',
      finished: 'the training is completed',
      paused: 'paused by user',
      resumeAndContinue: 'resumed by user (continue)',
      resumeAndNewTry: 'resumed by user (new try)',
      activated: 'activated by user',
    };
    if (!templates[key]) {
      throw new Error(`Unknown history event key: "${key}"`);
    }
    return { action: templates[key], date: Date.now() };
  }

  #gethistorySkipRow(): HistoryEntry | string {
    const skipDays = this.exceededSkipsDays;
    if (skipDays === 0) return '';
    const ending = skipDays === 1 ? '' : 's';
    return {
      action: `${skipDays > 2 ? 'excessive skips' : ' training skipped'} (${skipDays} day${ending})`,
      date: this.nextDate.getTime(),
    };
  }

  get expression() { return this.#expression; }
  get id() { return this.#id; }
  get history() { return this.#history; }
  get labelid() { return this.#labelid; }
  get label() { return this.#label; }
  get note() { return this.#note; }
  get status() { return this.#status; }
  get inQueue() { return this.#inQueue; }

  get historySort() {
    const history_ = [...this.#history];
    history_.sort((a, b) => {
      const a_ = typeof a.date === 'number' ? a.date : new Date(a.date).getTime();
      const b_ = typeof b.date === 'number' ? b.date : new Date(b.date).getTime();
      return b_ - a_ === 0 ? (a.action > b.action ? -1 : 1) : b_ - a_;
    });
    return history_;
  }

  get phrase() { return this.#phrase; }
  get stage() { return this.#stage; }
  get nextDate() { return this.#nextDate; }

  get exceededSkipsDays(): number {
    if (
      !this.started ||
      this.stage === 9 ||
      (this.status !== 'active' && this.status !== undefined)
    )
      return 0;
    const today = new Date();
    const nextDay = new Date(this.#nextDate);
    const oneDayinMs = 1000 * 60 * 60 * 24;
    const diffInTime = today.getTime() - nextDay.getTime();
    const diffInDays = Math.round(diffInTime / oneDayinMs);
    return diffInDays < 0 ? 0 : diffInDays;
  }

  get exceededSkipsCount(): boolean {
    const st = this.#stage;
    if (
      !this.started ||
      this.stage === 9 ||
      (this.status !== 'active' && this.status !== undefined)
    )
      return false;
    const diffInDays = this.exceededSkipsDays;
    switch (diffInDays) {
      case 0:
        return false;
      case 1: {
        if (st > 7) return false;
        const his = this.historySort;
        let count = 0;
        for (let i = 0; i < st; i++) {
          const act = his[i].action;
          if (act.includes('late')) count++;
          else if (act.includes('new try')) break;
        }
        return count > 0;
      }
      case 2: {
        if (st <= 7) return true;
        const his = this.historySort;
        let count = 0;
        for (let i = 0; i < st; i++) {
          const act = his[i].action;
          if (act.includes('late')) count++;
          else if (act.includes('new try')) break;
        }
        return count > 0;
      }
      default:
        return true;
    }
  }

  get started() { return !!this.stage; }

  get hintForReading(): [string, boolean, number] {
    if (this.status !== 'active') {
      return ['⏸ Expression is not active', false, 0];
    }
    let result: [string, boolean, number] = [
      `read the text ${this.stage < 7 ? 'twice ' : 'thrice '}`,
      false,
      this.stage < 7 ? 2 : 3,
    ];
    if (this.exceededSkipsDays > 2) {
      result = [
        ` ☹ The number of deviations from the study plan has been exceeded. The study will be started from the beginning! Read the text twice`,
        true,
        2,
      ];
    }
    return result;
  }

  get userHistory(): string[] {
    const result: string[] = [];
    try {
      const history_ = this.historySort;
      history_.forEach((item) => {
        const day = new Date(item.date).toString().slice(0, 10);
        result.push(`${item.action}: ${day}`);
      });
      return result;
    } catch (_) {
      return result;
    }
  }

  get notStartedActive() {
    const stat = this.status === 'active';
    if (!stat) return false;
    return !this.#stage;
  }

  get studyPlan(): string[] {
    try {
      const stage_ = this.#stage;
      const result: string[] = [];
      let nextDate_ = new Date(this.#nextDate);
      if (stage_ > 0) {
        const history_ = this.historySort;
        // Build an array indexed by day position so gaps can be filled
        const pastEntries: (string | null)[] = new Array(stage_).fill(null);
        let count = 0;
        for (let i = 0; i < history_.length; i++) {
          if (history_[i].action.includes('read')) {
            const day = new Date(history_[i].date).toString().slice(0, 10);
            const isToday =
              new Date().setHours(0, 0, 0, 0) ===
              new Date(history_[i].date).setHours(0, 0, 0, 0);
            // Most-recent read event → highest day number (stage_ - count)
            pastEntries[stage_ - 1 - count] = `🟢: Day ${stage_ - count}:${day} ✔${
              isToday ? ':Today' : ''
            }`;
            count++;
          }
          if (count === stage_) break;
        }
        // Push all past days in order; fill any gaps (incomplete history)
        for (let j = 0; j < stage_; j++) {
          result.push(
            pastEntries[j] ??
              `🟢: Day ${j + 1}:${new Date().toString().slice(0, 10)} ✔`
          );
        }
      }
      if (!this.started || this.#status === 'new' || this.#status === 'paused')
        nextDate_ = new Date();
      const ShowDate = new Date(nextDate_);
      for (let i = stage_; i < 9; i++) {
        const nd = new Date().setHours(0, 0, 0, 0);
        const sd = new Date(ShowDate).setHours(0, 0, 0, 0);
        const ico = stage_ - 1 >= i ? '🟢' : sd < nd ? '🔴' : '🔘';
        result.push(
          `${ico}: Day ${i + 1}:${ShowDate.toString().slice(0, 10)} ${
            stage_ - 1 >= i ? '✔' : sd < nd ? '☹' : ''
          }${sd === nd ? ':Today' : ''}`
        );
        ShowDate.setDate(ShowDate.getDate() + (i < 6 ? 1 : i < 7 ? 7 : 14));
      }
      return result;
    } catch (_) {
      return [];
    }
  }

  newDateFormat(dt: Date | string | number = new Date()): Date {
    if (typeof dt === 'string' && dt[10] === 'T') dt = dt.slice(0, 10);
    const nd = new Date(dt);
    nd.setHours(12, 0, 0, 0);
    return nd;
  }

  get setForUpdate(): ExpressionUpdate {
    const updates: ExpressionUpdate = {
      id: this.id,
      stage: this.stage,
      nextDate: this.nextDate.getTime(),
      history: this.history ? [...this.history] : [],
    };

    const oneDayMs = 1000 * 60 * 60 * 24;
    const todayMs = new Date().setHours(12, 0, 0, 0);
    const skipDays = this.exceededSkipsDays;
    let wasLate = skipDays !== 0;

    if (wasLate) {
      const skipRow = this.#gethistorySkipRow();
      if (skipRow) updates.history!.push(skipRow as HistoryEntry);
    }

    if (skipDays > 3) {
      updates.stage = 0;
      wasLate = false;
      updates.nextDate = todayMs;
      updates.history!.push({ action: 'new try', date: Date.now() });
    }

    updates.history!.push(this.#getHistoryEvent(wasLate ? 'readLate' : 'readByPlan'));

    if (updates.stage === 8) {
      updates.history!.push(this.#getHistoryEvent('finished'));
      updates.status = 'completed';
    }

    const nextDate = new Date(todayMs);
    if (updates.stage! < 6) {
      nextDate.setTime(nextDate.getTime() + oneDayMs);
    } else if (updates.stage! < 7) {
      nextDate.setTime(nextDate.getTime() + 7 * oneDayMs);
    } else if (updates.stage! < 8) {
      nextDate.setTime(nextDate.getTime() + 14 * oneDayMs);
    }

    updates.nextDate = nextDate.getTime();
    updates.stage! += 1;

    return updates;
  }

  getUpdatedFields(newData: Partial<ExpressionData> & { id: number }): ExpressionUpdate {
    const changed: ExpressionUpdate = { id: this.id };
    let statusChanged = false;
    let statusData: ExpressionUpdate = { id: this.id };

    for (const key of Object.keys(newData) as (keyof ExpressionData)[]) {
      if (key === 'id') continue;
      const oldVal = (this as unknown as Record<string, unknown>)[key];
      const updatedData = newData[key];
      if (key === 'status' && oldVal !== updatedData) {
        statusChanged = true;
        statusData = this.setStatus(updatedData as string);
        continue;
      }
      if (
        JSON.stringify(oldVal) !== JSON.stringify(updatedData) &&
        !['history', 'nextDate', 'stage'].includes(key)
      ) {
        (changed as unknown as Record<string, unknown>)[key] = updatedData;
      }
    }

    if (statusChanged) {
      return { ...changed, ...statusData };
    }
    return changed;
  }

  setStatus(newStatus: string): ExpressionUpdate {
    const updates: ExpressionUpdate = {
      id: this.id,
      status: newStatus,
      history: [...this.history],
    };

    if (newStatus === 'paused') {
      const skipDays = this.exceededSkipsDays;
      if (skipDays > 2 && this.stage > 0) {
        const skipRow = this.#gethistorySkipRow();
        if (skipRow) updates.history!.push(skipRow as HistoryEntry);
        updates.stage = 0;
      }
      updates.history!.push(this.#getHistoryEvent('paused'));
    }

    if (newStatus === 'active' && this.status === 'paused') {
      updates.nextDate = new Date().setHours(12, 0, 0, 0);
      updates.history!.push(
        this.#getHistoryEvent(this.stage > 0 ? 'resumeAndContinue' : 'resumeAndNewTry')
      );
      if (this.inQueue) updates.inQueue = false;
    }

    if (newStatus === 'active' && this.status === 'new') {
      updates.nextDate = new Date().setHours(12, 0, 0, 0);
      updates.history!.push(this.#getHistoryEvent('activated'));
      if (this.inQueue) updates.inQueue = false;
    }

    return updates;
  }
}
