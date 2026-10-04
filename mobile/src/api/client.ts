import Constants from 'expo-constants';

import type {
  AdminHelperResponse,
  AuthResponse,
  BookingResponse,
  CreateBookingRequest,
  DeleteAccountRequest,
  HelperProfileRequest,
  HelperResponse,
  LoginRequest,
  MeResponse,
  Page,
  MessageResponse,
  NotificationResponse,
  RegisterRequest,
  ResetPasswordRequest,
  SendMessageRequest,
  ServiceType,
  UnreadCountResponse,
} from './types';

/**
 * The backend's SERVER_PORT. Note this is also Metro's default port, so when both
 * run on one machine the bundler shifts itself to 8082 and this stays correct —
 * we only borrow the *host* from Expo, never its port.
 */
const API_PORT = 8081;

/**
 * A phone on the LAN cannot reach the laptop's `localhost`, so derive the dev
 * machine's address from the URI Expo is already serving the bundle over. Set
 * `extra.apiUrl` in app.json to point at a deployed backend instead.
 */
function resolveBaseUrl(): string {
  // Set at build time for release builds (EAS profile / website build). Expo
  // inlines EXPO_PUBLIC_* variables into the bundle.
  const fromBuild = process.env.EXPO_PUBLIC_API_URL;
  if (fromBuild) return fromBuild.replace(/\/+$/, '');

  const configured = Constants.expoConfig?.extra?.apiUrl;
  if (typeof configured === 'string' && configured.length > 0) {
    return configured.replace(/\/+$/, '');
  }

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:${API_PORT}`;

  // Only reached in a production build with no apiUrl configured.
  return `http://localhost:${API_PORT}`;
}

export const BASE_URL = resolveBaseUrl();

/**
 * A non-2xx response from the API. `fieldErrors` is present only on 400s raised
 * by bean validation, keyed by the DTO field name.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/**
 * Resolves once AuthContext has read the stored token back at launch. Requests wait
 * on it: a screen opened straight from a link mounts before that read finishes,
 * and would otherwise call the API without its token, get a 401, and sign a user
 * out who was in fact signed in.
 */
let markSessionRestored: () => void = () => {};
const sessionRestored = new Promise<void>((resolve) => {
  markSessionRestored = resolve;
});
export { markSessionRestored };

export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Registered by AuthContext so an expired token drops the user at login exactly
 * once, from wherever they were. 403 is deliberately not routed here — that means
 * "signed in, not allowed", which screens surface as an ordinary error.
 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, unknown> } = {},
): Promise<T> {
  const { method = 'GET', body, query } = options;

  await sessionRestored;
  // Captured now, not when the response lands: what matters is whether *this*
  // request carried a token, not whether one has been set since.
  const sentToken = authToken;

  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(sentToken ? { Authorization: `Bearer ${sentToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only rejects on transport failure, which on a phone almost always
    // means the dev server address is wrong or the backend is not running.
    throw new ApiError(0, `Could not reach the server at ${BASE_URL}. Check it is running.`);
  }

  // Only a request that carried a token can have an expired session. A 401 from
  // login itself means a wrong password and falls through to the server's message.
  if (response.status === 401 && sentToken) {
    // Only if that token is still the current one; a stale request finishing
    // after a fresh sign-in must not undo it.
    if (sentToken === authToken) onUnauthorized?.();
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  const payload = raw ? safeParse(raw) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : null) ?? `Request failed (${response.status})`;
    const fieldErrors =
      payload && typeof payload === 'object' && 'fieldErrors' in payload
        ? ((payload as { fieldErrors: Record<string, string> }).fieldErrors)
        : undefined;
    throw new ApiError(response.status, message, fieldErrors);
  }

  return payload as T;
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const api = {
  register: (body: RegisterRequest) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body }),

  login: (body: LoginRequest) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body }),

  // Always succeeds, whether or not the email has an account.
  forgotPassword: (email: string) =>
    request<void>('/api/auth/password/forgot', { method: 'POST', body: { email } }),

  resetPassword: (body: ResetPasswordRequest) =>
    request<AuthResponse>('/api/auth/password/reset', { method: 'POST', body }),

  me: () => request<MeResponse>('/api/account/me'),

  verifyEmail: (code: string) =>
    request<MeResponse>('/api/account/verify-email', { method: 'POST', body: { code } }),

  resendVerification: () =>
    request<void>('/api/account/verify-email/resend', { method: 'POST' }),

  searchHelpers: (query: {
    city?: string;
    maxRate?: number;
    service?: ServiceType;
    page?: number;
    size?: number;
  }) => request<Page<HelperResponse>>('/api/helpers', { query }),

  getHelper: (helperUserId: number) => request<HelperResponse>(`/api/helpers/${helperUserId}`),

  getMyHelperProfile: () => request<HelperResponse>('/api/helpers/me'),

  saveMyHelperProfile: (body: HelperProfileRequest) =>
    request<HelperResponse>('/api/helpers/me', { method: 'PUT', body }),

  createBooking: (body: CreateBookingRequest) =>
    request<BookingResponse>('/api/bookings', { method: 'POST', body }),

  listBookings: (query: { page?: number; size?: number } = {}) =>
    request<Page<BookingResponse>>('/api/bookings', { query }),

  getBooking: (id: number) => request<BookingResponse>(`/api/bookings/${id}`),

  // The lifecycle transitions. Which of these a given user may call is enforced
  // server-side by role and participation; the UI only hides what it knows.
  acceptBooking: (id: number) =>
    request<BookingResponse>(`/api/bookings/${id}/accept`, { method: 'POST' }),
  rejectBooking: (id: number) =>
    request<BookingResponse>(`/api/bookings/${id}/reject`, { method: 'POST' }),
  startBooking: (id: number) =>
    request<BookingResponse>(`/api/bookings/${id}/start`, { method: 'POST' }),
  completeBooking: (id: number) =>
    request<BookingResponse>(`/api/bookings/${id}/complete`, { method: 'POST' }),
  cancelBooking: (id: number) =>
    request<BookingResponse>(`/api/bookings/${id}/cancel`, { method: 'POST' }),

  // Chat. The booking id is the thread id; the server rejects non-participants.
  listMessages: (bookingId: number) =>
    request<MessageResponse[]>(`/api/bookings/${bookingId}/messages`),

  sendMessage: (bookingId: number, body: SendMessageRequest) =>
    request<MessageResponse>(`/api/bookings/${bookingId}/messages`, { method: 'POST', body }),

  markThreadRead: (bookingId: number) =>
    request<void>(`/api/bookings/${bookingId}/messages/read`, { method: 'POST' }),

  // Notification centre.
  listNotifications: (query: { page?: number; size?: number } = {}) =>
    request<Page<NotificationResponse>>('/api/notifications', { query }),

  unreadNotificationCount: () =>
    request<UnreadCountResponse>('/api/notifications/unread-count'),

  markNotificationRead: (id: number) =>
    request<NotificationResponse>(`/api/notifications/${id}/read`, { method: 'POST' }),

  markAllNotificationsRead: () =>
    request<void>('/api/notifications/read-all', { method: 'POST' }),

  // Account. Deletion is permanent; the server asks for the password again.
  deleteAccount: (body: DeleteAccountRequest) =>
    request<void>('/api/account/delete', { method: 'POST', body }),

  // Admin vetting queue.
  adminListHelpers: (query: { verified: boolean; page?: number; size?: number }) =>
    request<Page<AdminHelperResponse>>('/api/admin/helpers', { query }),

  adminSetVerified: (helperUserId: number, verified: boolean) =>
    request<AdminHelperResponse>(`/api/admin/helpers/${helperUserId}/verification`, {
      method: 'POST',
      query: { verified },
    }),
};
