// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Transactional mail switches. SMTP is optional (docs/env-reference.md) —
 * when unconfigured, no mails can go out, so email verification must stay
 * off too (otherwise nobody could ever activate an account in dev).
 */
export const smtpConfigured = !!process.env.SMTP_HOST

/** Registration requires clicking the activation mail iff SMTP is configured. */
export const emailVerificationEnabled = smtpConfigured
