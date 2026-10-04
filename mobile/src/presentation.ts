import type { BookingStatus, NotificationType, ServiceType } from './api/types';
import type { BadgeTone, IconName } from './components/ui';

/** One icon per kind of help, used everywhere a service is shown. */
export const SERVICE_ICONS: Record<ServiceType, IconName> = {
  HOSPITAL_VISIT: 'medkit-outline',
  GROCERY_SHOPPING: 'basket-outline',
  HOUSE_HELP: 'home-outline',
  COMPANIONSHIP: 'people-outline',
  MEDICATION_PICKUP: 'bandage-outline',
  TRANSPORT: 'car-outline',
};

export const STATUS_TONES: Record<BookingStatus, { tone: BadgeTone; icon: IconName }> = {
  REQUESTED: { tone: 'warning', icon: 'time-outline' },
  ACCEPTED: { tone: 'success', icon: 'checkmark-circle-outline' },
  IN_PROGRESS: { tone: 'info', icon: 'play-circle-outline' },
  COMPLETED: { tone: 'neutral', icon: 'checkmark-done-outline' },
  REJECTED: { tone: 'danger', icon: 'close-circle-outline' },
  CANCELLED: { tone: 'danger', icon: 'close-circle-outline' },
};

export const NOTIFICATION_ICONS: Record<NotificationType, { icon: IconName; tone: BadgeTone }> = {
  BOOKING_REQUESTED: { icon: 'calendar-outline', tone: 'warning' },
  BOOKING_ACCEPTED: { icon: 'checkmark-circle-outline', tone: 'success' },
  BOOKING_REJECTED: { icon: 'close-circle-outline', tone: 'danger' },
  BOOKING_STARTED: { icon: 'play-circle-outline', tone: 'info' },
  BOOKING_COMPLETED: { icon: 'checkmark-done-outline', tone: 'success' },
  BOOKING_CANCELLED: { icon: 'close-circle-outline', tone: 'danger' },
  MESSAGE_RECEIVED: { icon: 'chatbubble-ellipses-outline', tone: 'info' },
};
