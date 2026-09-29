import { abs } from "./math.js";

/** Add two numbers. */
export const add = (a: number, b: number): number => a + b;

/** Clamp `n` into `[min, max]`. */
export const clamp = (n: number, min: number, max: number): number => {
  if (min > max) throw new Error("min must be <= max");
  if (n < min) return min;
  if (n > max) return max;
  return n;
};

/** Absolute value via internal helper (kept for graph / import edges). */
export const magnitude = (n: number): number => abs(n);
