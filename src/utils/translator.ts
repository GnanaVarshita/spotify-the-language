const translationCache: Record<string, string> = {};

/**
 * Translates a single text segment using the free MyMemory translation API.
 * Caches results in memory to minimize API queries.
 */
export async function translateText(
  text: string,
  fromLang: string,
  toLang: string = 'en'
): Promise<string> {
  const cleanText = text.trim();
  if (!cleanText) return '';

  const cacheKey = `${fromLang}|${toLang}:${cleanText}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  // Do not translate instrumental indicators, timestamps or single numbers
  if (
    (/^[\(\[\{].*[\)\]\}]$/.test(cleanText)) ||
    /^\d+$/.test(cleanText)
  ) {
    return cleanText;
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      cleanText
    )}&langpair=${fromLang}|${toLang}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`MyMemory API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data && data.responseData && data.responseData.translatedText) {
      const translated = data.responseData.translatedText
        .replace(/<[^>]*>/g, '') // Strip any HTML tags returned by translation engine
        .trim();
      
      translationCache[cacheKey] = translated;
      return translated;
    }
    
    return cleanText;
  } catch (error) {
    console.error('Translation error:', error);
    return cleanText; // Fallback to original text if API fails
  }
}
