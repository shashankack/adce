/**
 * Public math helpers for the fixture “billing” toy module.
 * Note: tests still import `subtract` which is missing on purpose.
 */
export const add = (a: number, b: number): number => a + b;

export const sum = (values: number[]): number =>
  values.reduce((acc, n) => add(acc, n), 0);
