import { RelationshipTypes } from "@adce/shared";

export class InvalidRelationshipTypeError extends Error {
  constructor(value: string) {
    super(
      `Invalid relationship type: ${value}. Allowed: ${RelationshipTypes.join(", ")}`,
    );
    this.name = "InvalidRelationshipTypeError";
  }
}

export class RelationshipNotFoundError extends Error {
  constructor(id: string) {
    super(`Relationship not found: ${id}`);
    this.name = "RelationshipNotFoundError";
  }
}

export class AmbiguousRelationshipIdError extends Error {
  readonly matches: string[];

  constructor(prefix: string, matches: string[]) {
    const preview = matches.slice(0, 5).join(", ");
    const more = matches.length > 5 ? `, … (+${matches.length - 5} more)` : "";
    super(
      `Ambiguous relationship id prefix "${prefix}" matches ${matches.length} relationships: ${preview}${more}`,
    );
    this.name = "AmbiguousRelationshipIdError";
    this.matches = matches;
  }
}

export class RelationshipExistsError extends Error {
  constructor(sourceId: string, targetId: string, type: string) {
    super(
      `Relationship already exists: ${sourceId} --${type}--> ${targetId}`,
    );
    this.name = "RelationshipExistsError";
  }
}

export class RelationshipSelfLinkError extends Error {
  constructor() {
    super("Cannot link an artifact to itself.");
    this.name = "RelationshipSelfLinkError";
  }
}
