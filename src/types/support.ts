export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSupportTicketInput {
  subject: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  order_id?: string | null;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at?: string;
}

export interface SendChatMessageInput {
  order_id: string;
  recipient_id: string;
  message: string;
}
