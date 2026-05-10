export const ELECTION_TYPES = {
  LEADERSHIP: "LEADERSHIP",
  SPORTS: "SPORTS",
  HOUSE: "HOUSE",
} as const;

export type ElectionType = (typeof ELECTION_TYPES)[keyof typeof ELECTION_TYPES];

export const ROLE_LABELS: Record<string, string> = {
  HEAD_BOY: "Head Boy",
  DEPUTY_HEAD_BOY: "Deputy Head Boy",
  HEAD_GIRL: "Head Girl",
  DEPUTY_HEAD_GIRL: "Deputy Head Girl",
  SPORTS_CAPTAIN: "Sports Captain",
  SPORTS_VICE_CAPTAIN: "Sports Vice-Captain",
  HOUSE_CAPTAIN: "House Captain",
  HOUSE_VICE_CAPTAIN: "House Vice Captain",
};

export const STUDENT_COUNCIL_ROLE_ORDER = [
  "HEAD_BOY",
  "DEPUTY_HEAD_BOY",
  "HEAD_GIRL",
  "DEPUTY_HEAD_GIRL",
];

export const SPORTS_ROLE_ORDER = ["SPORTS_CAPTAIN", "SPORTS_VICE_CAPTAIN"];

export const HOUSE_ROLE_ORDER = ["HOUSE_CAPTAIN", "HOUSE_VICE_CAPTAIN"];

export const ALL_ROLE_ORDER = [
  ...STUDENT_COUNCIL_ROLE_ORDER,
  ...SPORTS_ROLE_ORDER,
  ...HOUSE_ROLE_ORDER,
];

export const ROLE_OPTIONS_BY_ELECTION_TYPE: Record<ElectionType, string[]> = {
  LEADERSHIP: STUDENT_COUNCIL_ROLE_ORDER,
  SPORTS: SPORTS_ROLE_ORDER,
  HOUSE: HOUSE_ROLE_ORDER,
};

export function getRolesForElectionType(type: string): string[] {
  return ROLE_OPTIONS_BY_ELECTION_TYPE[type as ElectionType] ?? [];
}

export function isRoleValidForElectionType(role: string, type: string): boolean {
  const roles = getRolesForElectionType(type);
  return roles.includes(role);
}

export function orderRoles(roles: string[], preferredOrder: string[] = ALL_ROLE_ORDER) {
  const unique = [...new Set(roles)];
  return unique.sort((a, b) => {
    const aIdx = preferredOrder.indexOf(a);
    const bIdx = preferredOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}
