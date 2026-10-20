import { env } from '../config/env.js';
import { AppError } from './errors.js';

export function paymentsEnabled() {
  return Boolean(env.chapa.secretKey);
}

function describe(message) {
  if (!message) return null;
  if (typeof message === 'string') return message;
  return Object.values(message).flat().filter((item) => typeof item === 'string').join(' ') || null;
}

async function chapaRequest(path, init = {}) {
  let response;
  try {
    response = await fetch(`${env.chapa.apiUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${env.chapa.secretKey}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new AppError(502, 'Chapa did not respond. Try again in a moment.');
  }
  const payload = await response.json().catch(() => null);
  return { ok: response.ok && payload?.status === 'success', status: response.status, payload };
}

/** Starts a hosted Chapa checkout and returns its URL. */
export async function initializePayment({ amount, currency, email, firstName, lastName, txRef, returnUrl, callbackUrl }) {
  const { ok, payload } = await chapaRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      amount: amount.toFixed(2),
      currency,
      email,
      first_name: firstName,
      last_name: lastName,
      tx_ref: txRef,
      return_url: returnUrl,
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
      customization: { title: 'AILG Academy', description: 'Course enrollment' },
    }),
  });
  const checkoutUrl = payload?.data?.checkout_url;
  if (!ok || !checkoutUrl) {
    throw new AppError(502, describe(payload?.message) || 'Chapa could not start the payment.');
  }
  return checkoutUrl;
}

/** Asks Chapa for the transaction. Returns its data when Chapa knows it, otherwise null. */
export async function verifyPayment(txRef) {
  const { ok, payload } = await chapaRequest(`/transaction/verify/${encodeURIComponent(txRef)}`);
  return ok ? payload.data ?? null : null;
}
