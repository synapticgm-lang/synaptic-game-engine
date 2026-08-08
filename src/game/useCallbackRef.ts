import { useCallback, useRef } from 'react';

type AnyFn = (...args: never[]) => unknown;

/**
 * Stable callback ref — always call unconditionally at the top level of a hook/component.
 * Updates the ref during render so the stable callback always invokes the latest fn.
 */
export function useCallbackRef<T extends AnyFn>(fn: T): T {
  const ref = useRef<T>(fn);
  ref.current = fn;
  return useCallback(
    ((...args: Parameters<T>) => (ref.current as T)(...args)) as T,
    []
  );
}
