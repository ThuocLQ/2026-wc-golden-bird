import { apiGet, apiPost } from "../../lib/apiClient";
import type { WcState } from "./types";

export function getWcState() {
  return apiGet<WcState>("wc-state-get");
}

export function claimWcSlot(slotNumber: number) {
  return apiPost("wc-slot-claim", { slotNumber });
}

export function createWcRequest() {
  return apiPost("wc-request-create");
}

export function joinWcRequest(requestId: string) {
  return apiPost("wc-request-join", { requestId });
}

export function closeWcRequest(requestId: string) {
  return apiPost("wc-request-close", { requestId });
}
