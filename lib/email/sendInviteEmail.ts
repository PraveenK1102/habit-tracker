import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail({
  to,
  senderName,
  inviteId,
}: {
  to: string;
  senderName: string;
  inviteId: string;
}) {
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
