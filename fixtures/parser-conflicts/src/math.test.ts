import { add, subtract, sum } from "./math.js";

export function testMath(): void {
  if (add(1, 2) !== 3) throw new Error("add failed");
  if (sum([1, 2, 3]) !== 6) throw new Error("sum failed");
  // Structural mismatch: subtract is not exported from math.ts
  if (subtract(5, 2) !== 3) throw new Error("subtract failed");
}
