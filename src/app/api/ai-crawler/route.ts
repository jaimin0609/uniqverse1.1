import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import * as cheerio from 'cheerio';

// Website Crawler API for automated content learning
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        const { action, data } = await req.json();

        switch (action) {
            case 'crawl_sitemap':
                return await crawlSitemap(data.sitemapUrl || data.baseUrl);
            case 'crawl_url':
                return await crawlSingleUrl(data.url, data.category);
            case 'auto_update':
                return await autoUpdateContent();
            case 'crawl_products':
                return await crawlProductPages();
            default:
                return NextResponse.json({
                    error: "Invalid action"
                }, { status: 400 });
        }

    } catch (error) {
        console.error("Website crawler error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

async function crawlSitemap(baseUrl: string) {
    try {
        const results = {
            crawled: 0,
            errors: 0,
            updated: 0
        };

        // Try common sitemap locations
        const sitemapUrls = [
            `${baseUrl}/sitemap.xml`,
            `${baseUrl}/sitemap_index.xml`,
            `${baseUrl}/robots.txt`
        ];

        let sitemapContent = '';

        for (const sitemapUrl of sitemapUrls) {
            try {
                const response = await fetch(sitemapUrl, {
                    headers: {
                        'User-Agent': 'Uniqverse-AI-Crawler/1.0'
                    }
                });

                if (response.ok) {
                    sitemapContent = await response.text();
                    break;
                }
            } catch (e) {
                console.log(`Failed to fetch ${sitemapUrl}`);
            }
        }

        // Extract URLs from sitemap or robots.txt
        let urls: string[] = [];

        if (sitemapContent.includes('<sitemap>') || sitemapContent.includes('<url>')) {
            // Parse XML sitemap
            const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);
            if (urlMatches) {
                urls = urlMatches.map(match =>
                    match.replace('<loc>', '').replace('</loc>', '').trim()
                );
            }
        } else if (sitemapContent.includes('Sitemap:')) {
            // Parse robots.txt
            const sitemapMatches = sitemapContent.match(/Sitemap: (.*)/g);
            if (sitemapMatches) {
                for (const sitemapMatch of sitemapMatches) {
                    const sitemapUrl = sitemapMatch.replace('Sitemap: ', '').trim();
                    try {
                        const sitemapResponse = await fetch(sitemapUrl);
                        if (sitemapResponse.ok) {
                            const nestedSitemapContent = await sitemapResponse.text();
                            const nestedUrlMatches = nestedSitemapContent.match(/<loc>(.*?)<\/loc>/g);
                            if (nestedUrlMatches) {
                                urls.push(...nestedUrlMatches.map(match =>
                                    match.replace('<loc>', '').replace('</loc>', '').trim()
                                ));
                            }
                        }
                    } catch (e) {
                        console.error('Error fetching nested sitemap:', e);
                    }
                }
            }
        }

        // If no sitemap found, crawl common pages
        if (urls.length === 0) {
            urls = [
                `${baseUrl}`,
                `${baseUrl}/about`,
                `${baseUrl}/contact`,
                `${baseUrl}/shipping`,
                `${baseUrl}/returns`,
                `${baseUrl}/faq`,
                `${baseUrl}/help`,
                `${baseUrl}/privacy`,
                `${baseUrl}/terms`
            ];
        }

        // Limit to important pages for AI context
        const importantUrls = urls.filter(url => {
            const path = new URL(url).pathname.toLowerCase();
            return (
                path === '/' ||
                path.includes('about') ||
                path.includes('contact') ||
                path.includes('shipping') ||
                path.includes('return') ||
                path.includes('faq') ||
                path.includes('help') ||
                path.includes('support') ||
                path.includes('policy') ||
                path.includes('terms') ||
                path.includes('privacy')
            );
        }).slice(0, 20); // Limit to 20 pages

        // Crawl each URL
        for (const url of importantUrls) {
            try {
                await crawlSingleUrl(url, categorizePage(url));
                results.crawled++;

                // Add delay to be respectful
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error crawling ${url}:`, error);
                results.errors++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Crawled ${results.crawled} pages, ${results.errors} errors`,
            results
        });

    } catch (error) {
        console.error("Sitemap crawl error:", error);
        throw error;
    }
}

async function crawlSingleUrl(url: string, category: string) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Uniqverse-AI-Crawler/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract title
        const title = $('title').text().trim() ||
            $('h1').first().text().trim() ||
            'Page Content';

        // Remove unwanted elements
        $('script, style, nav, footer, .nav, .navigation, .menu, .header, .footer').remove();

        // Extract main content
        let content = '';

        // Try to find main content areas
        const contentSelectors = [
            'main',
            '.main-content',
            '.content',
            'article',
            '.article',
            '[role="main"]',
            'body'
        ];

        for (const selector of contentSelectors) {
            const element = $(selector);
            if (element.length && element.text().trim().length > 100) {
                content = element.text().trim();
                break;
            }
        }

        // Clean up content
        content = content
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim()
            .substring(0, 3000); // Limit content length

        // Extract keywords
        const keywords = extractKeywords(content);        // Store in database - Check if record exists first
        const existingContext = await db.websiteContext.findFirst({
            where: { page: url }
        });

        if (existingContext) {
            await db.websiteContext.update({
                where: { id: existingContext.id },
                data: {
                    title,
                    content,
                    keywords,
                    category,
                    lastUpdated: new Date()
                }
            });
        } else {
            await db.websiteContext.create({
                data: {
                    page: url,
                    title,
                    content,
                    keywords,
                    category,
                    lastUpdated: new Date(),
                    isActive: true
                }
            });
        }

        return { url, title, contentLength: content.length, keywords: keywords.length };

    } catch (error) {
        console.error(`Error crawling ${url}:`, error);
        throw error;
    }
}

async function autoUpdateContent() {
    try {
        // Get existing website contexts that are older than 7 days
        const staleContexts = await db.websiteContext.findMany({
            where: {
                lastUpdated: {
                    lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                },
                isActive: true
            },
            take: 10
        });

        let updated = 0;
        let errors = 0;

        for (const context of staleContexts) {
            try {
                await crawlSingleUrl(context.page, context.category);
                updated++;

                // Add delay
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (error) {
                console.error(`Error updating ${context.page}:`, error);
                errors++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${updated} pages, ${errors} errors`,
            updated,
            errors
        });

    } catch (error) {
        console.error("Auto update error:", error);
        throw error;
    }
}

async function crawlProductPages() {
    try {
        // Get product URLs from database with category relation
        const products = await db.product.findMany({
            where: { isPublished: true },
            select: {
                id: true,
                name: true,
                description: true,
                category: { select: { name: true } }
            },
            take: 50
        });

        let processed = 0;

        for (const product of products) {
            try {
                // Create website context for product
                const categoryName = product.category?.name || 'General';
                const keywords = [
                    ...extractKeywords(product.name),
                    ...extractKeywords(product.description || ''),
                    categoryName.toLowerCase()
                ];

                // Check if context exists
                const existingContext = await db.websiteContext.findFirst({
                    where: { page: `/products/${product.id}` }
                });

                const productContent = `${product.name}. ${product.description || ''}. Category: ${categoryName}`;

                if (existingContext) {
                    await db.websiteContext.update({
                        where: { id: existingContext.id },
                        data: {
                            title: product.name,
                            content: productContent,
                            keywords: [...new Set(keywords)],
                            category: 'products',
                            lastUpdated: new Date()
                        }
                    });
                } else {
                    await db.websiteContext.create({
                        data: {
                            page: `/products/${product.id}`,
                            title: product.name,
                            content: productContent,
                            keywords: [...new Set(keywords)],
                            category: 'products',
                            lastUpdated: new Date(),
                            isActive: true
                        }
                    });
                }

                processed++;
            } catch (error) {
                console.error(`Error processing product ${product.id}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${processed} products`,
            processed
        });

    } catch (error) {
        console.error("Product crawl error:", error);
        throw error;
    }
}

function categorizePage(url: string): string {
    const path = new URL(url).pathname.toLowerCase();

    if (path.includes('shipping') || path.includes('delivery')) return 'shipping';
    if (path.includes('return') || path.includes('refund')) return 'returns';
    if (path.includes('contact') || path.includes('support')) return 'support';
    if (path.includes('about') || path.includes('company')) return 'company';
    if (path.includes('faq') || path.includes('help')) return 'help';
    if (path.includes('privacy')) return 'privacy';
    if (path.includes('terms')) return 'terms';
    if (path.includes('product')) return 'products';
    if (path.includes('payment') || path.includes('checkout')) return 'payment';
    if (path.includes('account') || path.includes('profile')) return 'account';
    if (path === '/') return 'homepage';

    return 'general';
}

function extractKeywords(text: string): string[] {
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = cleanText.split(/\s+/);

    const stopWords = new Set([
        'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
        'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with', 'about',
        'by', 'of', 'from', 'up', 'down', 'that', 'this', 'these', 'those',
        'them', 'they', 'their', 'i', 'me', 'my', 'mine', 'you', 'your',
        'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its',
        'we', 'us', 'our', 'ours', 'will', 'would', 'could', 'should',
        'may', 'might', 'can', 'must', 'shall', 'do', 'does', 'did',
        'have', 'has', 'had', 'get', 'got', 'go', 'goes', 'went'
    ]);

    const wordFreq = new Map<string, number>();

    words.forEach(word => {
        if (word.length > 2 && !stopWords.has(word)) {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
    });

    return Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([word]) => word);
}
