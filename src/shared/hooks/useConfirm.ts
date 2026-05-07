import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: (v: boolean) => void;
  }>({
    open: false,
    options: { title: '' },
    resolve: () => {},
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    setState((s) => ({ ...s, open: false }));
    state.resolve(true);
  };

  const handleCancel = () => {
    setState((s) => ({ ...s, open: false }));
    state.resolve(false);
  };

  return {
    confirm,
    dialogProps: {
      ...state.options,
      open: state.open,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
