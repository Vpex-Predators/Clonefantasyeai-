import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { DEFAULT_LEAGUE_ID } from '../../shared/espnLeague.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admins only.' }, { status: 403 });

    const body = await req.json();
    const action = String(body.action || '');

    if (action === 'list') {
      const locks = await base44.asServiceRole.entities.TeamLock.list();
      const users = await base44.asServiceRole.entities.User.list();
      const emailById = {};
      for (const u of users) emailById[u.id] = u.email;
      return Response.json({
        locks: locks.map(l => ({
          id: l.id,
          user_id: l.user_id,
          email: emailById[l.user_id] || l.user_id,
          league_id: l.league_id,
          team_id: l.team_id,
          team_name: l.team_name,
          espn_email: l.espn_email,
          birthday: l.birthday
        }))
      });
    }

    if (action === 'update') {
      const lockId = String(body.lock_id || '');
      if (!lockId) return Response.json({ error: 'Missing lock id.' }, { status: 400 });
      const updates = {};
      if (body.team_id !== undefined) {
        updates.team_id = String(body.team_id);
        updates.team_name = String(body.team_name || '');
      }
      if (body.espn_email !== undefined) updates.espn_email = String(body.espn_email);
      if (body.birthday !== undefined) updates.birthday = String(body.birthday);
      await base44.asServiceRole.entities.TeamLock.update(lockId, updates);
      return Response.json({ ok: true });
    }

    if (action === 'delete') {
      const lockId = String(body.lock_id || '');
      if (!lockId) return Response.json({ error: 'Missing lock id.' }, { status: 400 });
      await base44.asServiceRole.entities.TeamLock.delete(lockId);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}