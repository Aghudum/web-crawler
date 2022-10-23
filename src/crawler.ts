import {URL} from "url";
import axios, {AxiosResponse} from "axios";
import parse, {HTMLElement} from "node-html-parser";

export interface Crawler {
    crawl: (paths?: URL[]) => Promise<void>;
}

export interface Logger {
    log: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
}

export const crawler = (startUrl: URL, logger: Logger): Crawler => {
    const stack: URL[] = [];
    const visited: Set<string> = new Set<string>();

    const crawl = async (urls: URL[] = [startUrl]) => {
        urls.forEach(path => {
            if (visited.has(path.href)) return;
            stack.push(path);
            visited.add(path.href);
        });

        const url = stack.pop();
        if (url === undefined) return;
        await crawl(await getLinksOnPageAt(url));
    }

    const getLinksOnPageAt = async (url: URL): Promise<URL[]> => {
        return axios.get(url.href)
            .then(response => processLinks(response, url))
            .catch(error => {
                logger.warn(`${error.response.status}! ${url.href} is inaccessible!`);
                return [];
            });
    }

    const processLinks = (response: AxiosResponse, url: URL): URL[] => {
        const linksMap = parse(response.data)
            .getElementsByTagName("a")
            .reduce((linksMap: Map<string, URL>, anchor: HTMLElement) => {
                const href = anchor.getAttribute("href");
                if (!href) return linksMap;
                const linkOnPage = new URL(href, url);
                return isRelevant(linkOnPage, url) ? linksMap.set(linkOnPage.href, linkOnPage) : linksMap;
            }, new Map());

        const links: URL[] = Array.from(linksMap.values());
        print(url, links);
        return links;
    };

    const print = (url: URL, links: URL[]) => {
        if (links.length) {
            logger.log(`${url} has links to: ${links.map(path => path.href).join(", ")}`);
        } else {
            logger.log(`${url} has no relevant links`);
        }
        logger.log(``);
    };

    const isRelevant = (childUrl: URL, parentUrl: URL) => {
        return isSameDomain(childUrl, parentUrl) && isPage(childUrl);
    };

    const isPage = (url: URL) => {
        return ![".mp3", ".pdf", ".mp4", ".mov"].includes(url.pathname.slice(-4));
    };

    const isSameDomain = (url1: URL, url2: URL) => url1.hostname.replace("www.", "")
        === url2.hostname.replace("www.", "");


    return {crawl}
}