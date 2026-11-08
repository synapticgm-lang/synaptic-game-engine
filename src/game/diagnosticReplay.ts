/**
 * One companion replay may ask the hosted default writer without a training request.
 * This does not opt a player in, does not admit a row, and does not change lab sessions
 * that did not ask for it.
 */
let diagnosticReplay = false;

export function enableDiagnosticReplay(): void {
  diagnosticReplay = true;
}

export function disableDiagnosticReplay(): void {
  diagnosticReplay = false;
}

export function isDiagnosticReplay(): boolean {
  return diagnosticReplay;
}
