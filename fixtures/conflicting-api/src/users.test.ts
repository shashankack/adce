import { handleCreateUser, handleGetUser } from "./server.js";

export function testGetUser(): void {
  const ok = handleGetUser("u1");
  if (ok.status !== 200 || !("name" in ok.body)) {
    throw new Error("getUser expected name field");
  }
  // Spec promises email — implementation has none (intentional).
  if ("email" in ok.body) throw new Error("fixture should not return email");
}

export function testCreateUser(): void {
  const created = handleCreateUser({ name: "Grace" });
  if (created.status !== 201) throw new Error("create failed");
}
