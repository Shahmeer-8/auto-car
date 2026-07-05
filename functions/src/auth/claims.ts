import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { hasPermission } from '../lib/permissions';
import { writeAudit } from '../lib/audit';

interface SetUserRoleData {
  uid: string;
  roleId: string;
}

/**
 * Assigns a role to a user: sets Auth custom claims { roleId, permissions } and mirrors
 * the role onto the user document. This is the ONLY place claims are set — clients can
 * never self-escalate. Caller must hold `users.manage`.
 */
export const setUserRole = onCall<SetUserRoleData>(async (req) => {
  const caller = req.auth;
  if (!caller) throw new HttpsError('unauthenticated', 'You must be signed in.');

  const callerPerms = (caller.token['permissions'] as string[] | undefined) ?? [];
  if (!hasPermission(callerPerms, 'users.manage')) {
    throw new HttpsError('permission-denied', 'Missing permission: users.manage');
  }

  const { uid, roleId } = req.data;
  if (!uid || !roleId) throw new HttpsError('invalid-argument', 'uid and roleId are required.');

  const db = getFirestore();
  const roleSnap = await db.doc(`roles/${roleId}`).get();
  if (!roleSnap.exists) throw new HttpsError('not-found', `Role ${roleId} not found.`);

  const role = roleSnap.data() as { name: string; permissions: string[] };

  await getAuth().setCustomUserClaims(uid, { roleId, permissions: role.permissions });
  await db.doc(`users/${uid}`).set(
    { roleId, roleName: role.name, permissions: role.permissions },
    { merge: true },
  );

  const actorName = (caller.token['name'] as string | undefined) ?? caller.token.email ?? caller.uid;
  await writeAudit(db, caller.uid, actorName, 'user.roleChange', 'users', uid, null, { roleId });

  return { ok: true };
});
