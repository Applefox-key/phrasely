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

export interface SelectBarConfig {
  selectedCount: number;
  batchAction: "delete" | "label" | "status" | "queue" | "download";
  batchLabel: number | null;
  batchStatus: string;
  batchQueueAction: "add" | "remove";
  labels: { id: number; name: string }[];
  onCancel: () => void;
  onSelectAll: () => void;
  onUnselectAll: () => void;
  onExecute: () => void;
  onChangeBatchAction: (a: "delete" | "label" | "status" | "queue" | "download") => void;
  onChangeBatchLabel: (id: number | null) => void;
  onChangeBatchStatus: (s: string) => void;
  onChangeBatchQueueAction: (a: "add" | "remove") => void;
}

interface MobileNavStore {
  expressionsActions: ExpressionsActions | null;
  selectBar: SelectBarConfig | null;
  setExpressionsActions: (actions: ExpressionsActions) => void;
  clearExpressionsActions: () => void;
  setSelectBar: (config: SelectBarConfig | null) => void;
}

export const useMobileNavStore = create<MobileNavStore>((set) => ({
  expressionsActions: null,
  selectBar: null,
  setExpressionsActions: (actions) => set({ expressionsActions: actions }),
  clearExpressionsActions: () => set({ expressionsActions: null }),
  setSelectBar: (config) => set({ selectBar: config }),
}));
