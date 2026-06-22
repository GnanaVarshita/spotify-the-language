import type { CuratedSong } from '../curatedSongs';

export const bellaCiao: CuratedSong = {
  id: 'bella-ciao',
  title: 'Bella Ciao',
  artist: 'Traditional / Various Artists',
  videoId: '4CI3lhyg154',
  language: 'it',
  languageName: 'Italian',
  difficulty: 'Easy',
  thumbnailUrl: 'https://images.unsplash.com/photo-1522158673376-3c85112f803b?w=400&q=80',
  lyrics: [
    { startTime: 0, endTime: 6, text: '(Guitar Intro)', translation: '(Guitar Intro)' },
    { startTime: 6, endTime: 10, text: 'Una mattina mi son svegliato', translation: 'One morning I woke up' },
    { startTime: 10, endTime: 14, text: 'O bella ciao, bella ciao, bella ciao, ciao, ciao', translation: 'Oh beautiful, goodbye! Beautiful, goodbye!' },
    { startTime: 14, endTime: 18, text: 'Una mattina mi son svegliato', translation: 'One morning I woke up' },
    { startTime: 18, endTime: 23, text: "E ho trovato l'invasore", translation: 'And I found the invader' },
    { startTime: 23, endTime: 27, text: 'O partigiano, portami via', translation: 'Oh partisan, carry me away' },
    { startTime: 27, endTime: 31, text: 'O bella ciao, bella ciao, bella ciao, ciao, ciao', translation: 'Oh beautiful, goodbye! Beautiful, goodbye!' },
    { startTime: 31, endTime: 35, text: 'O partigiano, portami via', translation: 'Oh partisan, carry me away' },
    { startTime: 35, endTime: 40, text: 'Ché mi sento di morir', translation: "Because I feel like I'm going to die" }
  ]
};
