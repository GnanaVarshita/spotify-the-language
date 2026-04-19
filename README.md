# Let's Spotify - Learn Languages Through Music

Let's Spotify is a language learning tool that uses the power of music to help you master new languages. Search for songs in any language, play the video, and follow along with synced, side-by-side original lyrics and English translations.

## Core Features

- **Language Search**: Easily find songs in Spanish, French, German, Italian, and more.
- **Synced Lyrics**: Watch the YouTube video while reading synced lyrics that highlight as the song plays.
- **Side-by-Side Translation**: Understand the meaning instantly with English translations displayed right next to the original lyrics.
- **Focus Mode**: When lyrics are shown, the video is blurred into the background to keep you focused on the text.
- **Clean UI**: A beautiful, distraction-free "Spanish Blue" theme.

## Prerequisites

To use the search functionality, you will need a **YouTube Data API v3 Key**.

1.  Follow the instructions in [YOUTUBE_API_SETUP.md](./YOUTUBE_API_SETUP.md) to get your key.
2.  Create a `.env.local` file in the root directory.
3.  Add your key:
    ```env
    NEXT_PUBLIC_YOUTUBE_API_KEY=your_api_key_here
    ```

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Video**: [react-youtube](https://github.com/tjallingt/react-youtube)
- **Lyrics**: [youtube-transcript](https://github.com/kakul/youtube-transcript)
