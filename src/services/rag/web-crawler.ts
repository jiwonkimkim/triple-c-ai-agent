import { extractTextFromHtml } from './text-chunker';

// Brand assets extracted from HTML
export interface BrandAssets {
  colors: {
    all: string[];
    primary?: string;
    secondary?: string;
    themeColor?: string;
  };
  images: {
    logo?: string;
    ogImage?: string;
    favicon?: string;
    hero?: string;
    all: string[];
  };
  fonts: {
    primary?: string;
    all: string[];
  };
}

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
  brandAssets: BrandAssets;
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
    const brandAssets = extractBrandAssets(html, url);

    return {
      url,
      title,
      text,
      html,
      statusCode: response.status,
      crawledAt: new Date(),
      links,
      metadata,
      brandAssets,
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

// ============================================
// Brand Asset Extraction Functions
// ============================================

/**
 * Extract all brand assets from HTML
 */
function extractBrandAssets(html: string, baseUrl: string): BrandAssets {
  return {
    colors: extractColors(html),
    images: extractImages(html, baseUrl),
    fonts: extractFonts(html),
  };
}

/**
 * Extract colors from HTML (CSS, inline styles, meta tags)
 */
function extractColors(html: string): BrandAssets['colors'] {
  const colorCounts = new Map<string, number>();

  // Extract meta theme-color
  const themeColorMatch = html.match(
    /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i
  );
  const themeColor = themeColorMatch ? normalizeColor(themeColorMatch[1]) ?? undefined : undefined;

  // Extract colors from inline styles and CSS
  // Match color, background-color, background, border-color properties
  const colorPatterns = [
    // HEX colors (#fff, #ffffff)
    /#([0-9A-Fa-f]{3}){1,2}\b/g,
    // RGB/RGBA colors
    /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)/gi,
    // HSL/HSLA colors
    /hsla?\s*\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+)?\s*\)/gi,
  ];

  for (const pattern of colorPatterns) {
    const matches = html.match(pattern) || [];
    for (const match of matches) {
      const normalized = normalizeColor(match);
      if (normalized && !isCommonColor(normalized)) {
        colorCounts.set(normalized, (colorCounts.get(normalized) || 0) + 1);
      }
    }
  }

  // Sort by frequency and get top colors
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);

  return {
    all: sortedColors.slice(0, 20),
    primary: sortedColors[0],
    secondary: sortedColors[1],
    themeColor,
  };
}

/**
 * Normalize color to HEX format
 */
function normalizeColor(color: string): string | null {
  const trimmed = color.trim().toLowerCase();

  // Already HEX
  if (trimmed.startsWith('#')) {
    // Convert short HEX to full HEX
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    }
    return trimmed;
  }

  // RGB/RGBA
  const rgbMatch = trimmed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  return null;
}

/**
 * Check if a color is too common (black, white, grays)
 */
function isCommonColor(hex: string): boolean {
  const common = [
    '#000000', '#ffffff', '#000', '#fff',
    '#333333', '#666666', '#999999', '#cccccc',
    '#111111', '#222222', '#444444', '#555555',
    '#777777', '#888888', '#aaaaaa', '#bbbbbb',
    '#dddddd', '#eeeeee', '#f5f5f5', '#fafafa',
  ];
  return common.includes(hex.toLowerCase());
}

/**
 * Extract images from HTML (logo, favicon, og:image, hero)
 */
function extractImages(html: string, baseUrl: string): BrandAssets['images'] {
  const allImages: string[] = [];

  // Extract og:image
  const ogImageMatch = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  );
  const ogImage = ogImageMatch ? resolveUrl(ogImageMatch[1], baseUrl) : undefined;
  if (ogImage) allImages.push(ogImage);

  // Extract favicon
  const faviconPatterns = [
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i,
  ];
  let favicon: string | undefined;
  for (const pattern of faviconPatterns) {
    const match = html.match(pattern);
    if (match) {
      favicon = resolveUrl(match[1], baseUrl);
      break;
    }
  }
  if (favicon) allImages.push(favicon);

  // Extract logo (img with logo in class, id, alt, or src)
  const logoPatterns = [
    /<img[^>]+(?:class|id)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/gi,
    /<img[^>]+src=["']([^"']+)["'][^>]+(?:class|id)=["'][^"']*logo[^"']*["']/gi,
    /<img[^>]+alt=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/gi,
    /<img[^>]+src=["']([^"']*logo[^"']*)["']/gi,
  ];
  let logo: string | undefined;
  for (const pattern of logoPatterns) {
    const match = pattern.exec(html);
    if (match) {
      logo = resolveUrl(match[1], baseUrl);
      break;
    }
  }
  if (logo) allImages.push(logo);

  // Extract hero image (large images in header/hero sections)
  const heroPatterns = [
    /<(?:header|section|div)[^>]+(?:class|id)=["'][^"']*(?:hero|banner|main-image)[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/gi,
    /<img[^>]+(?:class|id)=["'][^"']*(?:hero|banner|main)[^"']*["'][^>]+src=["']([^"']+)["']/gi,
  ];
  let hero: string | undefined;
  for (const pattern of heroPatterns) {
    const match = pattern.exec(html);
    if (match) {
      hero = resolveUrl(match[1], baseUrl);
      break;
    }
  }
  if (hero) allImages.push(hero);

  // Extract all other images
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null && allImages.length < 20) {
    const src = resolveUrl(imgMatch[1], baseUrl);
    if (src && !allImages.includes(src) && isValidImageUrl(src)) {
      allImages.push(src);
    }
  }

  return {
    logo,
    ogImage,
    favicon,
    hero,
    all: Array.from(new Set(allImages)).slice(0, 20),
  };
}

/**
 * Check if URL is a valid image URL
 */
function isValidImageUrl(url: string): boolean {
  // Skip data URLs, tracking pixels, etc.
  if (url.startsWith('data:')) return false;
  if (url.includes('1x1') || url.includes('pixel')) return false;
  if (url.includes('tracking') || url.includes('analytics')) return false;

  // Check for common image extensions or image CDNs
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|ico)(\?|$)/i;
  const imageCDNs = /(cloudinary|imgix|unsplash|cloudfront|amazonaws)/i;

  return imageExtensions.test(url) || imageCDNs.test(url);
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(url: string, baseUrl: string): string | undefined {
  try {
    if (!url || url.startsWith('data:')) return undefined;
    return new URL(url, baseUrl).href;
  } catch {
    return undefined;
  }
}

/**
 * Extract fonts from HTML (CSS font-family, Google Fonts)
 */
function extractFonts(html: string): BrandAssets['fonts'] {
  const fontCounts = new Map<string, number>();

  // Extract from Google Fonts links
  const googleFontsMatch = html.match(
    /fonts\.googleapis\.com\/css[^"']+family=([^"'&]+)/gi
  );
  if (googleFontsMatch) {
    for (const match of googleFontsMatch) {
      const familyMatch = match.match(/family=([^"'&]+)/);
      if (familyMatch) {
        const families = decodeURIComponent(familyMatch[1]).split('|');
        for (const family of families) {
          const fontName = family.split(':')[0].replace(/\+/g, ' ').trim();
          if (fontName) {
            fontCounts.set(fontName, (fontCounts.get(fontName) || 0) + 10); // Higher weight for explicit fonts
          }
        }
      }
    }
  }

  // Extract from CSS font-family declarations
  const fontFamilyRegex = /font-family\s*:\s*([^;{}]+)/gi;
  let match;
  while ((match = fontFamilyRegex.exec(html)) !== null) {
    const fonts = match[1].split(',').map((f) => f.trim().replace(/["']/g, ''));
    for (const font of fonts) {
      const cleanFont = font.trim();
      if (cleanFont && !isGenericFont(cleanFont)) {
        fontCounts.set(cleanFont, (fontCounts.get(cleanFont) || 0) + 1);
      }
    }
  }

  // Sort by frequency
  const sortedFonts = Array.from(fontCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([font]) => font);

  return {
    primary: sortedFonts[0],
    all: Array.from(new Set(sortedFonts)).slice(0, 10),
  };
}

/**
 * Check if font is a generic CSS font
 */
function isGenericFont(font: string): boolean {
  const generic = [
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
    'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace',
    'inherit', 'initial', 'unset', 'revert',
  ];
  return generic.includes(font.toLowerCase());
}
