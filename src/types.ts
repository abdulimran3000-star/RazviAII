export interface Scholar {
  id: string;
  name: string;
  biography: string;
  books: string[];
  fatwas: string[];
  imageUrl?: string;
}

export interface Book {
  id: string;
  title: string;
  authorId: string;
  content: string;
  fileUrl?: string;
  uploadedAt: string;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  hasSearched?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  references?: { scholar: string; source: string }[];
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  format: 'bullet' | 'detailed' | 'summary';
  createdAt: string;
}
