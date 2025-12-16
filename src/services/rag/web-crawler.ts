import { extractTextFromHtml } from './text-chunker';

export interface CrawlResult {
  url: string;
  title: string;
  text: string;
  html: string;
  statusCode: number;
  crawledAt: Date;
  links: string[];
  metadata: {
    description?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
}

export interface CrawlOptions {
  // Maximum pages to crawl (for site crawling)
  maxPages?: number;
  // Only crawl pages within the same domain
  sameDomain?: boolean;
  // Include subdomains
  includeSubdomains?: boolean;
  // URL patterns to exclude
  excludePatterns?: RegExp[];
  // Request timeout in milliseconds
  timeout?: number;
  // User agent string
  userAgent?: string;
}

const DEFAULT_OPTIONS: Required<CrawlOptions> = {
  maxPages: 50,
  sameDomain: true,
  includeSubdomains: true,
  excludePatterns: [
    /\.(jpg|jpeg|png|gif|svg|webp|ico|pdf|zip|tar|gz)$/i,
    /\.(css|js|json|xml)$/i,
    /\/api\//i,
    /\/admin\//i,
    /\?/,
  ],
  timeout: 10000,
  userAgent: 'Triple-C-Bot/1.0 (Marketing Content Agent)',
};

/**
 * Crawl a single URL
 */
export async function crawlUrl(
  url: string,
  options?: Partial<CrawlOptions>
): Promise<CrawlResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': opts.userAgent,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    const html = await response.text();
    const text = extractTextFromHtml(html);
    const metadata = extractMetadata(html);
    const links = extractLinks(html, url, opts);
    const title = extractTitle(html) || new URL(url).hostname;

    return {
      url,
      title,
      text,
      html,
      statusCode: response.status,
      crawledAt: new Date(),
      links,
      metadata,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Crawl multiple pages from a starting URL
 */
export async function crawlSite(
  startUrl: string,
  options?: Partial<CrawlOptions>
): Promise<CrawlResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: CrawlResult[] = [];
  const visited = new Set<string>();
  const queue: string[] = [normalizeUrl(startUrl)];
  const baseUrl = new URL(startUrl);

  while (queue.length > 0 && results.length < opts.maxPages) {
    const url = queue.shift()!;

    if (visited.has(url)) continue;
    visited.add(url);

    // Check if URL should be crawled
    if (!shouldCrawl(url, baseUrl, opts)) continue;

    try {
      const result = await crawlUrl(url, opts);
      results.push(result);

      // Add new links to queue
      for (const link of result.links) {
        const normalizedLink = normalizeUrl(link);
        if (!visited.has(normalizedLink)) {
          queue.push(normalizedLink);
        }
      }

      // Rate limiting - wait 500ms between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.warn(`Failed to crawl ${url}:`, error);
    }
  }

  return results;
}

/**
 * Extract page title from HTML
 */
function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Extract metadata from HTML
 */
function extractMetadata(html: string): CrawlResult['metadata'] {
  const metadata: CrawlResult['metadata'] = {};

  // Meta description
  const descMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
  );
  if (descMatch) metadata.description = descMatch[1];

  // Meta keywords
  const keywordsMatch = html.match(
    /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i
  );
  if (keywordsMatch) {
    metadata.keywords = keywordsMatch[1].split(',').map((k) => k.trim());
  }

  // Open Graph
  const ogTitleMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  );
  if (ogTitleMatch) metadata.ogTitle = ogTitleMatch[1];

  const ogDescMatch = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
  );
  if (ogDescMatch) metadata.ogDescription = ogDescMatch[1];

  const ogImageMatch = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  );
  if (ogImageMatch) metadata.ogImage = ogImageMatch[1];

  return metadata;
}

/**
 * Extract links from HTML
 */
function extractLinks(
  html: string,
  baseUrl: string,
  options: Required<CrawlOptions>
): string[] {
  const links: string[] = [];
  const base = new URL(baseUrl);

  // Find all href attributes
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    try {
      const href = match[1];

      // Skip anchors and javascript
      if (href.startsWith('#') || href.startsWith('javascript:')) continue;

      // Resolve relative URLs
      const absoluteUrl = new URL(href, baseUrl).href;
      const urlObj = new URL(absoluteUrl);

      // Check if should crawl
      if (shouldCrawl(absoluteUrl, base, options)) {
        links.push(absoluteUrl);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  // Remove duplicates
  return Array.from(new Set(links));
}

/**
 * Check if a URL should be crawled
 */
function shouldCrawl(
  url: string,
  baseUrl: URL,
  options: Required<CrawlOptions>
): boolean {
  try {
    const urlObj = new URL(url);

    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) return false;

    // Check domain
    if (options.sameDomain) {
      if (options.includeSubdomains) {
        // Allow subdomains
        if (
          !urlObj.hostname.endsWith(baseUrl.hostname) &&
          urlObj.hostname !== baseUrl.hostname
        ) {
          return false;
        }
      } else {
        // Exact domain match
        if (urlObj.hostname !== baseUrl.hostname) return false;
      }
    }

    // Check exclude patterns
    for (const pattern of options.excludePatterns) {
      if (pattern.test(url)) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize a URL for comparison
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash, fragment, and normalize
    urlObj.hash = '';
    let pathname = urlObj.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    urlObj.pathname = pathname;
    return urlObj.href;
  } catch {
    return url;
  }
}
