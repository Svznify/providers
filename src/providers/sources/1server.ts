import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const query = {
    type: ctx.media.type,
    title: ctx.media.title,
    tmdbId: ctx.media.tmdbId.toString(),
    ...(ctx.media.type === 'show' && {
      season: ctx.media.season.number,
      episode: ctx.media.episode.number,
    }),
  };

  const embeds = [
    {
      embedId: '1server-autoembed',
      url: JSON.stringify(query),
    },
    {
      embedId: '1server-embedsu',
      url: JSON.stringify(query),
    },
    {
      embedId: '1server-vidsrcsu',
      url: JSON.stringify(query),
    },
    {
      embedId: '1server-2embed',
      url: JSON.stringify(query),
    },
  ];

  return { embeds };
}

export const oneServerScraper = makeSourcerer({
  id: '1server',
  name: '1Server',
  rank: 270,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
