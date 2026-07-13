/** Duration of a drawing turn, in seconds. */
export const TURN_DURATION = 90;

/** Duration of the round-end interstitial, in seconds. */
export const ROUND_END_DURATION = 5;

/** How often (in seconds of elapsed turn time) a new letter is revealed. */
export const REVEAL_INTERVAL = 15;

/**
 * Grace period (seconds) added to a phase's duration before its state is
 * considered stale/left-over. Prevents flicker during the normal transition
 * at the end of a turn while still hiding leftover state from a past game.
 */
export const STALE_BUFFER = 15;
