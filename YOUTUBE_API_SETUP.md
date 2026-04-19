# Instructions to get YouTube Data API v3 Key

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Navigate to **APIs & Services > Library**.
4.  Search for **YouTube Data API v3** and enable it.
5.  Go to **APIs & Services > Credentials**.
6.  Click **Create Credentials > API Key**.
7.  Copy the generated API Key and add it to your `.env.local` file:
    ```env
    NEXT_PUBLIC_YOUTUBE_API_KEY=your_api_key_here
    ```
