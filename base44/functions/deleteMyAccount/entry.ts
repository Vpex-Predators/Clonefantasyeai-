import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Account deletion. The platform has no dedicated "delete account" API, so
// this does the equivalent job for everything the app stores: all per-user
// records are wiped server-side, the app's User record removal is attempted,
// and the client then signs the user out locally.
// dryRun=true validates auth + wiring without deleting anything (for tests).
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let dryRun = false;
    try {
      const body = await req.json();
      dryRun = Boolean(body && body.dryRun);
    } catch { /* empty body = real run */ }

    if (dryRun) {
      return Response.json({
        dryRun: true,
        user: { id: user.id, email: user.email },
        wouldWipe: ['PlayerAnalysis', 'RefreshState', 'TeamLock'],
      });
    }

    // Wipe every trace of this user's data. These entities key records by
    // user_id (and carry created_by_id), so the queries stay narrowly scoped.
    await base44.asServiceRole.entities.PlayerAnalysis.deleteMany({ user_id: user.id });
    await base44.asServiceRole.entities.PlayerAnalysis.deleteMany({ created_by_id: user.id });
    await base44.asServiceRole.entities.RefreshState.deleteMany({ user_id: user.id });
    await base44.asServiceRole.entities.RefreshState.deleteMany({ created_by_id: user.id });
    await base44.asServiceRole.entities.TeamLock.deleteMany({ user_id: user.id });
    await base44.asServiceRole.entities.TeamLock.deleteMany({ created_by_id: user.id });

    // Best effort: also remove the app's User record. Auth itself lives with
    // the identity provider, so a later sign-in simply starts fresh.
    let userRecordDeleted = false;
    try {
      await base44.asServiceRole.entities.User.delete(user.id);
      userRecordDeleted = true;
    } catch { /* platform may refuse; the data wipe above already succeeded */ }

    return Response.json({
      ok: true,
      wiped: ['PlayerAnalysis', 'RefreshState', 'TeamLock'],
      userRecordDeleted,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Account deletion failed.' }, { status: 500 });
  }
}