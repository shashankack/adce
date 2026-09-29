import { formatGreeting, hello } from "./index.js";

export function testHello(): void {
  const g = hello("adce");
  if (g.message !== "hello adce") throw new Error("hello failed");
  if (!formatGreeting(g).includes("hello adce")) {
    throw new Error("formatGreeting failed");
  }
}
