import { add, clamp, magnitude } from "./index.js";

export function testAdd(): void {
  if (add(1, 2) !== 3) throw new Error("add failed");
}

export function testClamp(): void {
  if (clamp(5, 0, 3) !== 3) throw new Error("clamp high failed");
  if (clamp(-1, 0, 3) !== 0) throw new Error("clamp low failed");
}

export function testMagnitude(): void {
  if (magnitude(-4) !== 4) throw new Error("magnitude failed");
}
