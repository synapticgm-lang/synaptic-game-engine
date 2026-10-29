/**
 * T10DIR — build identity generated at prebuild / read at runtime.
 * Vite define may overwrite __SGM_GIT_SHA__ / __SGM_BUILD_TIME__; vitest uses git fallback.
 */
declare const __SGM_GIT_SHA__: string | undefined;
declare const __SGM_BUILD_TIME__: string | undefined;

export const GENERATED_GIT_SHA: string =
  (typeof __SGM_GIT_SHA__ !== 'undefined' && __SGM_GIT_SHA__) || 'dev';
export const GENERATED_BUILD_TIME: string =
  (typeof __SGM_BUILD_TIME__ !== 'undefined' && __SGM_BUILD_TIME__) || '';
