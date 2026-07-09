import { v4 as uuid } from "uuid";

const prefixes = {
  user: "u",
  lunch: "l",
  post: "p",
  comment: "c",
  reaction: "r",
  email: "e",
  wc: "wc",
} as const;

export function createId(kind: keyof typeof prefixes): string {
  return `${prefixes[kind]}_${uuid()}`;
}
