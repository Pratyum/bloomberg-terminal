export interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  source: string;
}

export async function fetchFinancialNews(query = "stock market"): Promise<NewsItem[] | null> {
  try {
    const res = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      console.warn(`Google News RSS error: ${res.status}`);
      return null;
    }

    const xml = await res.text();

    const items: NewsItem[] = [];
    const titleMatch = /<title>(.*?)<\/title>/g;
    const linkMatch = /<link>(.*?)<\/link>/g;
    const dateMatch = /<pubDate>(.*?)<\/pubDate>/g;
    const descMatch = /<description>(.*?)<\/description>/g;

    const titles = xml.match(titleMatch) || [];
    const links = xml.match(linkMatch) || [];
    const dates = xml.match(dateMatch) || [];
    const descs = xml.match(descMatch) || [];

    for (let i = 0; i < Math.min(titles.length, 20); i++) {
      items.push({
        title: titles[i]?.replace(/<[^>]+>/g, "").trim() || "",
        url: links[i]?.replace(/<[^>]+>/g, "").trim() || "",
        publishedAt: dates[i]?.replace(/<[^>]+>/g, "").trim() || "",
        summary: (descs[i]?.replace(/<[^>]+>/g, "").substring(0, 200) || "").trim(),
        source: "Google News",
      });
    }

    return items;
  } catch (error) {
    console.error("Error fetching financial news:", error);
    return null;
  }
}
