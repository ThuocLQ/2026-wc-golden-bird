export const tableHeaders = {
  users: ["id", "email", "displayName", "pinHash", "role", "status", "createdAt", "updatedAt"],
  lunch_entries: ["id", "lunchDate", "userId", "status", "restaurantName", "foodName", "note", "createdAt", "updatedAt"],
  posts: ["id", "lunchDate", "authorId", "content", "status", "createdAt", "updatedAt"],
  comments: ["id", "postId", "authorId", "content", "status", "createdAt", "updatedAt"],
  reactions: ["id", "userId", "targetType", "targetId", "reactionType", "status", "createdAt", "updatedAt"],
  email_logs: ["id", "type", "recipientEmail", "subject", "body", "status", "errorMessage", "createdAt"],
  app_config: ["key", "value", "updatedAt"],
} as const;

export type TableName = keyof typeof tableHeaders;

export function headersFor(tableName: TableName): readonly string[] {
  return tableHeaders[tableName];
}

export function valuesFor<T extends Record<string, unknown>>(tableName: TableName, row: T): string[] {
  return headersFor(tableName).map((header) => String(row[header] ?? ""));
}

export function columnLetter(index: number): string {
  let value = index;
  let label = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}
