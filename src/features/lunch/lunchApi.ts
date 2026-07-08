import { apiGet, apiPost } from "../../lib/apiClient";
import type { LunchStatus, TodayDashboardData } from "./types";

export function getToday() {
  return apiGet<TodayDashboardData>("today-get");
}

export function upsertLunchEntry(input: { status: LunchStatus; restaurantName: string; foodName: string; note: string }) {
  return apiPost("lunch-entry-upsert", input);
}
