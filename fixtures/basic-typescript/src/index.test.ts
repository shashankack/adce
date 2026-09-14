import { add } from "./index.js";

export function testAdd(): void {
  if (add(1, 2) !== 3) {
    throw new Error("add failed");
  }
}
