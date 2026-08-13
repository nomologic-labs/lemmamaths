import type { AccountRole, AccountStatus } from "./permissions";

/**
 * Presentation labels for account enums. The stored values stay lowercase;
 * nothing user-facing should render them raw.
 */
export const ACCOUNT_ROLE_LABELS: Record<AccountRole, string> = {
  contributor: "Contributor",
  administrator: "Administrator",
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  pending: "Pending",
  active: "Active",
  suspended: "Suspended",
};
