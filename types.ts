
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface StudySession {
  id: string;
  title: string;
  content: string;
  questions: Question[];
  summary: string;
  score: number;
  totalQuestions: number;
  createdAt: number;
  user_id?: string;
  isFavorite?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  sessionIds: string[];
  user_id?: string;
}

export interface AppState {
  sessions: StudySession[];
  folders: Folder[];
  activeView: 'dashboard' | 'uploader' | 'study-hub' | 'library';
  currentSessionId?: string;
  user?: any;
}
