export type Member = {
  id: string;
  email: string;
  displayName: string;
  role: "ADMIN" | "MEMBER";
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
};

export type EmailLog = {
  id: string;
  type: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: "PENDING" | "SENT" | "FAILED";
  errorMessage: string;
  createdAt: string;
};
