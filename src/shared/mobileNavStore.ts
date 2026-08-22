import { create } from "zustand";

interface ExpressionsActions {
  onAddSingle: () => void;
  onAddText: () => void;
  onAddFile: () => void;
  onDeleteMode: () => void;
  onExport: () => void;
  onOpenLabels: () => void;
  onOpenSettings: () => void;
}

export type BatchAction = "" | "delete" | "label" | "status" | "queue" | "download";

export interface SelectBarConfig {
  selectedCount: number;
  batchAction: BatchAction;
  batchLabel: number | null;
  batchStatus: string;
  batchQueueAction: "add" | "remove";
  labels: { id: number; name: string }[];
  onCancel: () => void;
  onSelectAll: () => void;
  onUnselectAll: () => void;
  onExecute: () => void;
  onChangeBatchAction: (a: BatchAction) => void;
  onChangeBatchLabel: (id: number | null) => void;
  onChangeBatchStatus: (s: string) => void;
  onChangeBatchQueueAction: (a: "add" | "remove") => void;
}

interface MobileNavStore {
  expressionsActions: ExpressionsActions | null;
  selectBar: SelectBarConfig | null;
  filterText: string;
  trainingPhrase: string;
  setExpressionsActions: (actions: ExpressionsActions) => void;
  clearExpressionsActions: () => void;
  setSelectBar: (config: SelectBarConfig | null) => void;
  setFilterText: (text: string) => void;
  setTrainingPhrase: (text: string) => void;
}

export const useMobileNavStore = create<MobileNavStore>((set) => ({
  expressionsActions: null,
  selectBar: null,
  filterText: "",
  trainingPhrase: "",
  setExpressionsActions: (actions) => set({ expressionsActions: actions }),
  clearExpressionsActions: () => set({ expressionsActions: null }),
  setSelectBar: (config) => set({ selectBar: config }),
  setFilterText: (text) => set({ filterText: text }),
  setTrainingPhrase: (text) => set({ trainingPhrase: text }),
}));
