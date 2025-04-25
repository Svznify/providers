/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { EmbedOutput, makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://flix.1anime.app';

const languageMap: Record<string, string> = {
  'chinese - hong kong': 'zh',
  'chinese - traditional': 'zh',
  czech: 'cs',
  danish: 'da',
  dutch: 'nl',
  english: 'en',
  'english - sdh': 'en',
  finnish: 'fi',
  french: 'fr',
  german: 'de',
  greek: 'el',
  hungarian: 'hu',
  italian: 'it',
  korean: 'ko',
  norwegian: 'no',
  polish: 'pl',
  portuguese: 'pt',
  'portuguese - brazilian': 'pt',
  romanian: 'ro',
  'spanish - european': 'es',
  'spanish - latin american': 'es',
  swedish: 'sv',
  turkish: 'tr',
  اَلْعَرَبِيَّةُ: 'ar',
  বাংলা: 'bn',
  filipino: 'tl',
  indonesia: 'id',
  اردو: 'ur',
};

function createProxyUrl(originalUrl: string, referer: string): string {
  const encodedUrl = encodeURIComponent(originalUrl);
  const encodedHeaders = encodeURIComponent(
    JSON.stringify({
      referer,
    }),
  );

  return `https://proxy.fifthwit.net/m3u8-proxy?url=${encodedUrl}&headers=${encodedHeaders}`;
}

function processProxiedURL(url: string): string {
  // Handle orbitproxy URLs
  if (url.includes('orbitproxy')) {
    try {
      const urlParts = url.split(/orbitproxy\.[^/]+\//);
      if (urlParts.length >= 2) {
        const encryptedPart = urlParts[1].split('.m3u8')[0];
        try {
          const decodedData = Buffer.from(encryptedPart, 'base64').toString('utf-8');
          const jsonData = JSON.parse(decodedData);
          const originalUrl = jsonData.u;
          const referer = jsonData.r || '';

          return createProxyUrl(originalUrl, referer);
        } catch (jsonError) {
          console.error('Error decoding/parsing orbitproxy data:', jsonError);
        }
      }
    } catch (error) {
      console.error('Error processing orbitproxy URL:', error);
    }
  }

  // Handle other proxied URLs
  if (url.includes('/m3u8-proxy?url=')) {
    return url.replace(/https:\/\/[^/]+\/m3u8-proxy/, 'https://proxy.fifthwit.net/m3u8-proxy');
  }

  return url;
}

export const oneServerAutoembedEmbed = makeEmbed({
  id: '1server-autoembed',
  name: 'Autoembed',
  rank: 264,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);

    const apiUrl =
      query.type === 'movie'
        ? `${baseUrl}/movie/autoembed/${query.tmdbId}`
        : `${baseUrl}/tv/autoembed/${query.tmdbId}?s=${query.season}&e=${query.episode}`;

    const response = await ctx.fetcher(apiUrl);
    if (!response) throw new NotFoundError('No response received');
    if (!response[0]?.source?.files?.[0]?.file) throw new NotFoundError('No stream URL found in response');

    const captions =
      response[0].source.subtitles?.map((sub: { url: string; lang: string; type: string }) => ({
        type: sub.type,
        url: sub.url,
        language: languageMap[sub.lang.toLowerCase()] || 'unknown',
      })) || [];

    ctx.progress(90);

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: response[0].source.files[0].file,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});

export const oneServerEmbedsuEmbed = makeEmbed({
  id: '1server-embedsu',
  name: 'Embed.su',
  rank: 262,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);

    const apiUrl =
      query.type === 'movie'
        ? `${baseUrl}/movie/embedsu/${query.tmdbId}`
        : `${baseUrl}/tv/embedsu/${query.tmdbId}?s=${query.season}&e=${query.episode}`;

    const response = await ctx.fetcher(apiUrl);
    if (!response) throw new NotFoundError('No response received');
    if (!response[0]?.source?.files?.[0]?.file) throw new NotFoundError('No stream URL found in response');

    const playlistUrl = response[0].source.files[0].file.replace(/^.*\/viper\//, 'https://');

    const captions =
      response[0].source.subtitles?.map((sub: { url: string; lang: string }) => ({
        type: 'vtt',
        url: sub.url,
        language: languageMap[sub.lang.toLowerCase()] || 'unknown',
      })) || [];

    ctx.progress(90);

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: `https://proxy-m3u8.uira.live/m3u8-proxy?url=${encodeURIComponent(playlistUrl)}&headers=${encodeURIComponent(JSON.stringify({ referer: 'https://megacloud.store/', origin: 'https://megacloud.store' }))}`,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});

export const oneServerVidsrcsuEmbed = makeEmbed({
  id: '1server-vidsrcsu',
  name: 'Vidsrc.su',
  rank: 263,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);

    const apiUrl =
      query.type === 'movie'
        ? `${baseUrl}/movie/vidsrcsu/${query.tmdbId}`
        : `${baseUrl}/tv/vidsrcsu/${query.tmdbId}?s=${query.season}&e=${query.episode}`;

    const response = await ctx.fetcher(apiUrl);
    if (!response) throw new NotFoundError('No response received');
    if (!response[0]?.source?.files?.[0]?.file) throw new NotFoundError('No stream URL found in response');

    const captions =
      response[0].source.subtitles?.map((sub: { url: string; lang: string; type: string }) => ({
        type: sub.type,
        url: sub.url,
        language: sub.lang,
      })) || [];

    ctx.progress(90);

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: `${processProxiedURL(response[0].source.files[0].file)}`,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
        {
          id: 'backup',
          type: 'hls',
          playlist: `${processProxiedURL(response[0].source.files[2].file)}`,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});

export const oneServerTwoEmbedEmbed = makeEmbed({
  id: '1server-2embed',
  name: '2Embed',
  rank: 261,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);

    const apiUrl =
      query.type === 'movie'
        ? `${baseUrl}/movie/2embed/${query.tmdbId}`
        : `${baseUrl}/tv/2embed/${query.tmdbId}?s=${query.season}&e=${query.episode}`;

    const response = await ctx.fetcher(apiUrl);
    if (!response) throw new NotFoundError('No response received');
    if (!response[0]?.source?.files?.[0]?.file) throw new NotFoundError('No stream URL found in response');

    const captions =
      response[0].source.subtitles?.map((sub: { url: string; lang: string; type: string }) => ({
        type: sub.type,
        url: sub.url,
        language: sub.lang,
      })) || [];

    ctx.progress(90);

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: `https://proxy.fifthwit.net/m3u8-proxy?url=${encodeURIComponent(response[0].source.files[0].file)}&headers=${encodeURIComponent(JSON.stringify({ referer: 'https://uqloads.xyz/', origin: 'https://uqloads.xyz' }))}`,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});
