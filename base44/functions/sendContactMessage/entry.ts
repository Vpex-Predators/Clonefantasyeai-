import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public contact form handler: bounded input, fixed recipient (the app admin),
// plain-text email. Anonymous visitors can reach it, so nothing about the
// recipient comes from the request.
export default async function(req) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim().slice(0, 80);
    const email = String(body.email || '').trim().slice(0, 120);
    const message = String(body.message || '').trim().slice(0, 2000);

    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (message.length < 10) {
      return Response.json({ error: 'Please write a message of at least 10 characters.' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const users = await base44.asServiceRole.entities.User.list();
    const admin = (users || []).find(u => u.role === 'admin' && u.email);
    if (!admin) {
      return Response.json({ error: 'No contact recipient is configured yet.' }, { status: 500 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: admin.email,
      subject: `FantasyEdge AI contact — ${name || email}`,
      text: `From: ${name || '(no name)'} <${email}>\n\n${message}`
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not send your message.' }, { status: 500 });
  }
}