import { createUser, getUser } from "./users.js";

/** Thin “handler” layer — pretend HTTP without a real server. */
export const handleGetUser = (id: string) => {
  const user = getUser(id);
  if (!user) return { status: 404 as const, body: { error: "not_found" } };
  return { status: 200 as const, body: user };
};

export const handleCreateUser = (body: { name: string }) => {
  const user = createUser(body);
  return { status: 201 as const, body: user };
};
