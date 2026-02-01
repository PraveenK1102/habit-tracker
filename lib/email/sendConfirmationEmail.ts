// This function is used to send a confirmation email to a user when they sign up for an account.
// This function is used by frontend to send a confirmation email to a user when they sign up for an account


import {
  getAppName,
  getAppSupportEmail,
  getEmailJsServiceId,
  getEmailJsTemplateId,
  getEmailJsPublicKey,
  getEmailJsPrivateKey,
} from '@/lib/common';

export async function sendConfirmationEmail({
  to,
  confirmationLink,
}: {
  to: string;
  confirmationLink: string;
}) {
  const appName = getAppName();
  const supportEmail = getAppSupportEmail();
  const serviceId = getEmailJsServiceId();
  const templateId = getEmailJsTemplateId();
  const publicKey = getEmailJsPublicKey();
  const privateKey = getEmailJsPrivateKey();
  if (serviceId === '' || templateId === '' || publicKey === '') {
    throw new Error('EmailJS is not configured. Set NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, NEXT_PUBLIC_EMAILJS_PUBLIC_KEY.');
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    ...(privateKey ? { accessToken: privateKey } : {}),
    template_params: {
      to_email: to,
      confirmation_link: confirmationLink,
      app_name: appName,
      support_email: supportEmail,
    },
  };

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `EmailJS error (${response.status})`);
  }
  return true;
}
