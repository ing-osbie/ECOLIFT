export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at?: string;
}

export type CreateNotificationInput = Omit<
  NotificationItem,
  "id" | "user_id" | "is_read" | "created_at"
>;
