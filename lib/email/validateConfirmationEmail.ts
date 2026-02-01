import { getAppBaseUrl, getAppName, getAppSupportEmail } from "../common";
import { fail, ok } from '@/lib/api/http';

const appName = getAppName();
const supportEmail = getAppSupportEmail();

export function validateConfirmationEmail(error: Error, actionLink: string) {
	if (!error) {
		if (actionLink) {
			return ok(
				{
					sent: false,
					message: 'Confirmation email sent. Check your inbox and follow the link to confirm your account',
					action_link: actionLink,
					app_name: appName,
					support_email: supportEmail,
				},
				200
			);
		}
		return fail('Unable to generate confirmation link.', 500, 'MISSING_LINK');
	}

	const message = error.message || 'Failed to send confirmation email';
	const msg = message.toLowerCase();
	if (msg.includes('already confirmed')) {
		return fail('Email already confirmed. Please sign in.', 409, 'ALREADY_CONFIRMED');
	}
	if (msg.includes('rate') || msg.includes('too many')) {
		return fail('Please wait before requesting another email.', 429, 'RATE_LIMITED');
	}
	if (msg.includes('not found') || msg.includes('no user')) {
		return ok({ sent: true, message: 'If an account exists, a confirmation email was sent.' }, 200);
	}
	return fail(message, 400, 'CONFIRMATION_LINK_FAILED');
}