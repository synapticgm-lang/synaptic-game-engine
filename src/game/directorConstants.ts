/**
 * T10DIR — stall threshold shared without importing director.ts (avoids init cycles).
 * Must stay in sync with director.STALL_N.
 *
 * Chosen = 2: fires before harness LOOP STOP (5) and one beat earlier than the old OPT-5
 * STALL_N=3 so the director can inject a world development before inspect/travel ping-pong locks.
 */
export const STALL_N = 2;
