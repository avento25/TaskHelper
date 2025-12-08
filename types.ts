export enum ViewMode {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH'
}

export enum EventType {
  FIXED = 'FIXED', // Classes, meetings
  TASK_SESSION = 'TASK_SESSION', // Generated study blocks
  DEADLINE = 'DEADLINE' // Assignment due dates
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: EventType;
  description?: string;
  location?: string;
  isCompleted?: boolean;
  taskId?: string; // Link back to parent task if applicable
  color?: string;
}

export interface Task {
  id: string;
  title: string;
  totalDurationMinutes: number;
  deadline: Date;
  sessions: number;
  maxSessionsPerDay?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  generatedEvents: string[]; // IDs of CalendarEvents
  isCompleted: boolean;
}

export interface UserPreferences {
  workStartHour: number; // 0-23
  workEndHour: number; // 0-23
  preferredLocation: string;
  theme: 'light' | 'dark';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  relatedData?: any;
}