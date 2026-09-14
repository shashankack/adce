export const log = {
  step(msg: string): void {
    console.log(`→ ${msg}`);
  },
  ok(msg: string): void {
    console.log(`✓ ${msg}`);
  },
  warn(msg: string): void {
    console.log(`! ${msg}`);
  },
  error(msg: string): void {
    console.error(`✗ ${msg}`);
  },
};
