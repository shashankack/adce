import { add, subtract } from "./math.js";

export function testMath(): void {
  if (add(1, 2) !== 3) throw new Error("add failed");
  if (subtract(5, 2) !== 3) throw new Error("subtract failed");
}
