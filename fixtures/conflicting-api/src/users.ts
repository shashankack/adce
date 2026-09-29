/** Runtime shape — diverges from OpenAPI `User` (email). */
export type User = {
  id: string;
  name: string;
};

export type NewUser = {
  name: string; // OpenAPI NewUser requires email instead
};

const users = new Map<string, User>([
  ["u1", { id: "u1", name: "Ada" }],
  ["u2", { id: "u2", name: "Lin" }],
]);

export const getUser = (id: string): User | null => users.get(id) ?? null;

export const createUser = (input: NewUser): User => {
  const id = `u${users.size + 1}`;
  const user = { id, name: input.name };
  users.set(id, user);
  return user;
};
