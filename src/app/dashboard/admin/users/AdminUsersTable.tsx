"use client";

import { useActionState } from "react";
import { LEMMA_ROLES } from "@/lib/auth/permissions";
import {
  grantRoleAction,
  revokeRoleAction,
  type RoleActionState,
} from "@/lib/auth/admin-actions";
import type { ManagedUser } from "@/lib/auth/role-management";
import styles from "./AdminUsers.module.css";

const INITIAL_STATE: RoleActionState = {};

type UserRoleRowProps = {
  user: ManagedUser;
  currentUserId: string;
};

function UserRoleRow({ user, currentUserId }: UserRoleRowProps) {
  const [grantState, grantAction, grantPending] = useActionState(grantRoleAction, INITIAL_STATE);
  const [revokeState, revokeAction, revokePending] = useActionState(revokeRoleAction, INITIAL_STATE);

  const feedback = grantState.error ?? grantState.success ?? revokeState.error ?? revokeState.success;
  const isSelf = user.id === currentUserId;

  return (
    <tr>
      <td className={styles.cell}>
        <span className={styles.handle}>{user.handle ? `@${user.handle}` : "—"}</span>
        <span className={styles.email}>{user.email}</span>
      </td>
      <td className={styles.cell}>
        {user.roles.length > 0 ? user.roles.join(", ") : "none"}
      </td>
      <td className={styles.cell}>
        <div className={styles.actions}>
          <form action={grantAction} className={styles.inlineForm}>
            <input type="hidden" name="userId" value={user.id} />
            <select name="role" className={styles.select} defaultValue="author" disabled={isSelf}>
              {LEMMA_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button type="submit" className={styles.button} disabled={grantPending || isSelf}>
              Grant
            </button>
          </form>
          <form action={revokeAction} className={styles.inlineForm}>
            <input type="hidden" name="userId" value={user.id} />
            <select name="role" className={styles.select} defaultValue="author">
              {LEMMA_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button type="submit" className={styles.button} disabled={revokePending}>
              Revoke
            </button>
          </form>
        </div>
        {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
        {isSelf ? <p className={styles.hint}>You cannot grant roles to your own account.</p> : null}
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
            <th scope="col">Roles</th>
            <th scope="col">Manage</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRoleRow key={user.id} user={user} currentUserId={currentUserId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
