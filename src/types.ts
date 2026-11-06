export interface Sentence {
  id: number;
  speaker: string;
  text: string;
  korean: string;
  stress: string[];
  start: number;
  end: number;
}

export type SelfCheckRating = 'great' | 'good' | 'needs_work' | null;

export interface SentenceProgress {
  id: number;
  plays: number;
  recordings: number;
  selfCheck: [SelfCheckRating, SelfCheckRating, SelfCheckRating];
  status: 'new' | 'practiced' | 'done';
  recordedAudioUrl?: string;
  lastRecordedAt?: number;
}

export type AppScreen = 'start' | 'list' | 'practice' | 'edit' | 'finish';

export type ShadowingStepId = 1 | 2 | 3 | 4;

export interface ShadowingStepInfo {
  id: ShadowingStepId;
  nameEn: string;
  nameKo: string;
  shortDescEn: string;
  shortDescKo: string;
  defaultTextHidden: boolean;
}
