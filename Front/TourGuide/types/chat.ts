export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  imageUri?: string;
}

