export type Role = "ADMIN" | "MEMBER";
export type UserStatus = "ACTIVE" | "DISABLED";
export type LunchStatus = "BRING_LUNCH" | "EAT_OUT" | "NO_LUNCH" | "UNDECIDED";
export type ContentStatus = "ACTIVE" | "DELETED";
export type TargetType = "POST" | "COMMENT";
export type ReactionType = "LIKE" | "LOVE" | "ANGRY";
export type EmailType = "REMINDER" | "DAILY_SUMMARY" | "MANUAL";
export type EmailStatus = "PENDING" | "SENT" | "FAILED";

export type RowMeta = { rowNumber: number };

export type UserRow = {
  id: string;
  email: string;
  displayName: string;
  pinHash: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export type LunchEntryRow = {
  id: string;
  lunchDate: string;
  userId: string;
  status: LunchStatus;
  restaurantName: string;
  foodName: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type PostRow = {
  id: string;
  lunchDate: string;
  authorId: string;
  content: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

export type CommentRow = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReactionRow = {
  id: string;
  userId: string;
  targetType: TargetType;
  targetId: string;
  reactionType: ReactionType | "";
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

export type EmailLogRow = {
  id: string;
  type: EmailType;
  recipientEmail: string;
  subject: string;
  body: string;
  status: EmailStatus;
  errorMessage: string;
  createdAt: string;
};

export type AppConfigRow = {
  key: string;
  value: string;
  updatedAt: string;
};
