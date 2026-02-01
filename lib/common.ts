export function getAppBaseUrl() {
  return process.env.APP_BASE_URL || '';
}
export function getAppName() {
  return process.env.APP_NAME || 'Habit Tracer';
}
export function getAppSupportEmail() {
  return process.env.APP_SUPPORT_EMAIL || '';
}
export function getEmailJsServiceId() {
  return process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
}
export function getEmailJsTemplateId() {
  return process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
}
export function getEmailJsPublicKey() {
  return process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';
}
export function getEmailJsPrivateKey() {
  return process.env.NEXT_PUBLIC_EMAILJS_PRIVATE_KEY || '';
}
