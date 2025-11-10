export type MessageType = 
  | "create_session"
  | "join_session"
  | "vibrate"
  | "partner_connected"
  | "partner_disconnected"
  | "session_created"
  | "session_joined"
  | "error";

export interface VibrateMessage {
  type: "vibrate";
  pattern: number;
}

export interface SessionMessage {
  type: "create_session" | "join_session";
  session_code?: string;
}

export interface StatusMessage {
  type: "partner_connected" | "partner_disconnected" | "session_created" | "session_joined" | "error";
  session_code?: string;
  message?: string;
  user_count?: number;
}

export type WebSocketMessage = VibrateMessage | SessionMessage | StatusMessage;

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

