export type WcSlot = {
  slotNumber: number;
  userId: string;
  displayName: string;
  updatedAt: string;
};

export type WcRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  status: "OPEN" | "CLOSED";
  joinedUsers: Array<{ id: string; displayName: string }>;
  createdAt: string;
  expiresAt: string;
};

export type WcState = {
  slots: WcSlot[];
  activeRequest: WcRequest | null;
};
