export type Greeting = {
  message: string;
  at: string;
};

export function hello(name = "world"): Greeting {
  return {
    message: `hello ${name}`,
    at: new Date(0).toISOString(),
  };
}

export function formatGreeting(g: Greeting): string {
  return `${g.message} (${g.at})`;
}
