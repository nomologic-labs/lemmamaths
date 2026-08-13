"use client";

import { useActionState } from "react";
import {
  approveAccountAction,
  demoteAccountAction,
  promoteAccountAction,
  restoreAccountAction,
  suspendAccountAction,
  updateUserHandleAction,
  updateUserNameAction,
  type AccountActionState,
} from "@/lib/auth/admin-actions";
import type { ManagedUser } from "@/lib/auth/account-management";
import { ACCOUNT_ROLE_LABELS, ACCOUNT_STATUS_LABELS } from "@/lib/auth/account-labels";
import { StatusPill } from "@/components/ui/StatusPill";
import styles from "./AdminUsers.module.css";

const INITIAL_STATE: AccountActionState = {};

type UserAccountRowProps = {
  user: ManagedUser;
  currentUserId: string;
};

function ActionForm({
  userId,
  action,
  label,
  disabled,
}: {
  userId: string;
  action: (prev: AccountActionState, formData: FormData) => Promise<AccountActionState>;
  label: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className={styles.inlineForm}>
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" className={styles.button} disabled={disabled || pending}>
        {label}
      </button>
      {state.error || state.success ? (
        <p className={styles.feedback}>{state.error ?? state.success}</p>
      ) : null}
    </form>
  );
}

function UserAccountRow({ user, currentUserId }: UserAccountRowProps) {
  const [nameState, nameAction, namePending] = useActionState(updateUserNameAction, INITIAL_STATE);
  const [handleState, handleAction, handlePending] = useActionState(
    updateUserHandleAction,
    INITIAL_STATE,
  );

  const isSelf = user.id === currentUserId;
  const feedback = nameState.error ?? nameState.success ?? handleState.error ?? handleState.success;

  return (
    <tr>
      <td className={styles.cell}>
        <span className={styles.handle}>{user.handle ? `@${user.handle}` : "—"}</span>
        <span className={styles.email}>{user.email}</span>
        {user.name ? <span className={styles.email}>{user.name}</span> : null}
      </td>
      <td className={styles.cell}>
        <StatusPill>{ACCOUNT_ROLE_LABELS[user.accountRole]}</StatusPill>
      </td>
      <td className={styles.cell}>
        <StatusPill tone={user.accountStatus === "pending" ? "accent" : "default"}>
          {ACCOUNT_STATUS_LABELS[user.accountStatus]}
        </StatusPill>
      </td>
      <td className={styles.cell}>
        <div className={styles.actions}>
          {user.accountStatus === "pending" && user.accountRole === "contributor" ? (
            <ActionForm userId={user.id} action={approveAccountAction} label="Approve" disabled={isSelf} />
          ) : null}
          {user.accountStatus === "active" && user.accountRole === "contributor" ? (
            <>
              <ActionForm userId={user.id} action={suspendAccountAction} label="Suspend" />
              <ActionForm
                userId={user.id}
                action={promoteAccountAction}
                label="Promote"
                disabled={isSelf}
              />
            </>
          ) : null}
          {user.accountStatus === "active" && user.accountRole === "administrator" ? (
            <ActionForm
              userId={user.id}
              action={demoteAccountAction}
              label="Demote"
              disabled={isSelf}
            />
          ) : null}
          {user.accountStatus === "suspended" ? (
            <ActionForm userId={user.id} action={restoreAccountAction} label="Restore" />
          ) : null}
          <form action={nameAction} className={styles.inlineForm}>
            <input type="hidden" name="userId" value={user.id} />
            <input
              name="name"
              className={styles.input}
              defaultValue={user.name ?? ""}
              placeholder="Display name"
              aria-label="Display name"
            />
            <button type="submit" className={styles.button} disabled={namePending}>
              Save name
            </button>
          </form>
          <form action={handleAction} className={styles.inlineForm}>
            <input type="hidden" name="userId" value={user.id} />
            <input
              name="handle"
              className={styles.input}
              defaultValue={user.handle ?? ""}
              placeholder="handle"
              aria-label="Handle"
            />
            <button type="submit" className={styles.button} disabled={handlePending}>
              Save handle
            </button>
          </form>
        </div>
        {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
        {isSelf ? (
          <p className={styles.hint}>
            You cannot approve or promote your own account.
          </p>
        ) : null}
      </td>
    </tr>
  );
}

type AdminUsersTableProps = {
  users: ManagedUser[];
  currentUserId: string;
};

export function AdminUsersTable({ users, currentUserId }: AdminUsersTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">User</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Manage</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserAccountRow key={user.id} user={user} currentUserId={currentUserId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
