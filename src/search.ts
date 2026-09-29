import "server-only";

const BRAVE_WEB_SEARCH_ENDPOINT =
  "https://api.search.brave.com/res/v1/web/search";

export const JOB_SEARCH_QUERIES = [
  '"HubSpot Developer" remote jobs',
  '"HubSpot CRM" remote jobs',
  '"HubSpot Implementation" remote jobs',
  '"HubSpot Consultant" remote jobs',
  '"HubSpot RevOps" remote jobs',
  '"HubSpot Administrator" remote jobs',
  '"HubSpot Marketing Operations" remote jobs',
] as const;

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  sourceQuery: string;
}

interface BraveWebResult {
  title?: string;
  url?: string;
  description?: string;
}

interface BraveWebSearchResponse {
  web?: {
    results?: BraveWebResult[];
  };
}

function cleanText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;(?:amp;)?/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchQuery(
  query: string,
  apiKey: string,
): Promise<SearchResult[]> {
  const url = new URL(BRAVE_WEB_SEARCH_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("count", "20");
  url.searchParams.set("freshness", "pm");
  url.searchParams.set("search_lang", "en");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Brave Search returned ${response.status} ${response.statusText} for query: ${query}`,
    );
  }

  const data = (await response.json()) as BraveWebSearchResponse;

  return (data.web?.results ?? [])
    .filter(
      (result): result is BraveWebResult & { title: string; url: string } =>
        Boolean(result.title && result.url),
    )
    .map((result) => ({
      title: cleanText(result.title),
      url: result.url,
      description: cleanText(result.description ?? ""),
      sourceQuery: query,
    }));
}

export async function searchJobs(apiKey: string): Promise<SearchResult[]> {
  const uniqueResults = new Map<string, SearchResult>();

  for (const query of JOB_SEARCH_QUERIES) {
    const results = await searchQuery(query, apiKey);

    for (const result of results) {
      if (!uniqueResults.has(result.url)) {
        uniqueResults.set(result.url, result);
      }
    }
  }

  return [...uniqueResults.values()];
}
