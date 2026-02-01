import { Resend } from 'resend';

export async function sendInviteEmail({
  to,
  senderName,
  inviteId,
}: {
  to: string;
  senderName: string;
  inviteId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }
  const resend = new Resend(apiKey);
  const base = process.env.APP_BASE_URL;

  await resend.emails.send({
    from: 'Habit Tracker <noreply@yourdomain.com>',
    to,
    subject: `${senderName} invited you`,
    html: `
      <p>${senderName} invited you.</p>
      <a href="${base}/invites/accept?inviteId=${inviteId}">Accept</a>
      <br />
      <a href="${base}/invites/reject?inviteId=${inviteId}">Reject</a>
    `,
  });
}
