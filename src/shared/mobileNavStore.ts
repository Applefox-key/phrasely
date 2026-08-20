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

interface MobileNavStore {
  expressionsActions: ExpressionsActions | null;
  setExpressionsActions: (actions: ExpressionsActions) => void;
  clearExpressionsActions: () => void;
}

export const useMobileNavStore = create<MobileNavStore>((set) => ({
  expressionsActions: null,
  setExpressionsActions: (actions) => set({ expressionsActions: actions }),
  clearExpressionsActions: () => set({ expressionsActions: null }),
}));
