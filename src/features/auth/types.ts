export type Role = "ADMIN" | "MEMBER";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
};
