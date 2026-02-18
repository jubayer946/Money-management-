import { useState, useRef, useCallback, useEffect } from 'react';

export function useUndo<T>(timeoutMs = 8000) {
  const [undoItem, setUndoItem] = useState<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerUndo = useCallback(
    (item: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setUndoItem(item);

      timerRef.current = setTimeout(() => {
        setUndoItem(null);
        timerRef.current = null;
      }, timeoutMs);
    },
    [timeoutMs]
  );

  const clearUndo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setUndoItem(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { undoItem, triggerUndo, clearUndo };
}