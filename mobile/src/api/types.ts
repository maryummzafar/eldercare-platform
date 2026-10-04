/**
 * Mirrors the backend DTOs in com.eldercare_platform.dto. Kept hand-written rather
 * than generated so the field names stay reviewable against the Java source; if a
 * DTO changes, change it here in the same commit.
 *
 * BigDecimal serialises as a JSON number and Instant as an ISO-8601 string, per
 * spring.jackson.serialization.write-dates-as-timestamps=false.
 */

export type UserRole = 'ELDER' | 'HELPER' | 'ADMIN';

export type ServiceType =
  | 'HOSPITAL_VISIT'
  | 'GROCERY_SHOPPING'
  | 'HOUSE_HELP'
  | 'COMPANIONSHIP'
  | 'MEDICATION_PICKUP'
  | 'TRANSPORT';

export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

/** Wording shown to users. The enum names themselves are not user-facing. */
export const SERVICE_LABELS: Record<ServiceType, string> = {
  HOSPITAL_VISIT: 'Hospital visit',
  GROCERY_SHOPPING: 'Grocery shopping',
  HOUSE_HELP: 'House help',
  COMPANIONSHIP: 'Companionship',
  MEDICATION_PICKUP: 'Medication pickup',
  TRANSPORT: 'Transport',
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  REQUESTED: 'Waiting for helper',
  ACCEPTED: 'Confirmed',
  REJECTED: 'Declined',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ALL_SERVICES = Object.keys(SERVICE_LABELS) as ServiceType[];

export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  /** False until the user enters the code emailed at signup. Elders cannot book until then. */
  emailVerified: boolean;
}

/** Mirrors MeResponse: the signed-in user as the server sees them now. */
export interface MeResponse {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: Extract<UserRole, 'ELDER' | 'HELPER'>;
  phone?: string;
  address?: string;
  /** Active consent to the Privacy Policy and Terms. The server refuses false. */
  acceptedTerms: boolean;
  /** Confirms the person is 18 or older. The server refuses false. */
  confirmedAdult: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface HelperResponse {
  helperId: number;
  name: string;
  bio: string | null;
  city: string | null;
  hourlyRate: number;
  offeredServices: ServiceType[];
  averageRating: number | null;
  completedBookings: number;
  acceptingBookings: boolean;
  /** Only meaningful on the helper's own profile; search returns verified helpers only. */
  verified: boolean;
}

/** Mirrors AdminHelperResponse: the vetting view, with contact details. */
export interface AdminHelperResponse {
  helperId: number;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  bio: string | null;
  hourlyRate: number;
  offeredServices: ServiceType[];
  verified: boolean;
  /** Must be true before the helper can be approved. */
  emailVerified: boolean;
  joinedAt: string;
}

export interface DeleteAccountRequest {
  password: string;
}

export interface HelperProfileRequest {
  bio?: string;
  hourlyRate: number;
  city?: string;
  offeredServices: ServiceType[];
  acceptingBookings?: boolean;
}

export interface BookingResponse {
  id: number;
  elderId: number;
  elderName: string;
  helperId: number;
  helperName: string;
  serviceType: ServiceType;
  status: BookingStatus;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  hourlyRate: number;
  estimatedTotal: number | null;
  finalTotal: number | null;
  serviceAddress: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateBookingRequest {
  helperId: number;
  serviceType: ServiceType;
  scheduledStart: string;
  scheduledEnd: string;
  serviceAddress?: string;
  notes?: string;
}

/** Spring Data's Page envelope, narrowed to the fields the app reads. */
export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type NotificationType =
  | 'BOOKING_REQUESTED'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_STARTED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_CANCELLED'
  | 'MESSAGE_RECEIVED';

export interface NotificationResponse {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  bookingId: number | null;
  read: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  unread: number;
}

/**
 * A chat message. Threads are keyed by booking — there is no conversation id,
 * because the booking is the conversation.
 */
export interface MessageResponse {
  id: number;
  bookingId: number;
  senderId: number;
  senderName: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface SendMessageRequest {
  body: string;
}
