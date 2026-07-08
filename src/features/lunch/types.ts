export type LunchStatus = "BRING_LUNCH" | "EAT_OUT" | "NO_LUNCH" | "UNDECIDED";

export type LunchPerson = {
  userId: string;
  displayName: string;
  status: LunchStatus | "";
  restaurantName: string;
  foodName: string;
  note: string;
};

export type TodayDashboardData = {
  date: string;
  me: {
    status: LunchStatus;
    restaurantName: string;
    foodName: string;
    note: string;
  };
  summary: {
    totalMembers: number;
    updatedCount: number;
    notUpdatedCount: number;
    bringLunchCount: number;
    eatOutCount: number;
    noLunchCount: number;
    undecidedCount: number;
  };
  groups: {
    bringLunch: LunchPerson[];
    eatOut: LunchPerson[];
    noLunch: LunchPerson[];
    undecided: LunchPerson[];
    notUpdated: LunchPerson[];
  };
  topRestaurants: Array<{ name: string; count: number }>;
  topFoods: Array<{ name: string; count: number }>;
};
