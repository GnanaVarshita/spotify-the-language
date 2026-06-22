import { camisaNegra } from './curated/camisaNegra';
import { bellaCiao } from './curated/bellaCiao';
import { otherSongs } from './curated/otherSongs';

export interface SyncedLine {
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
  translation: string;
}

export interface CuratedSong {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  language: string;
  languageName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  thumbnailUrl: string;
  lyrics: SyncedLine[];
}

export const curatedSongs: CuratedSong[] = [
  camisaNegra,
  ...otherSongs,
  bellaCiao
];
