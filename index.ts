import axios, {AxiosResponse} from "axios";
import parse, {HTMLElement} from "node-html-parser";
import {URL} from "url";

const execute = async (url: string): Promise<void> => {
    await crawler(url).crawl(["/"]);
}

interface Crawler {
    crawl: (paths: string[]) => void;
}

const crawler = (startUrl: string): Crawler => {
    const stack: string[] = [];
    const visited: Set<string> = new Set<string>();

    const crawl = async (paths: string[]) => {
        paths.forEach(path => {
            if (visited.has(path)) return;
            stack.push(path);
            visited.add(path);
        });

        const path = stack.pop();
        if (path === undefined) return;
        await crawl(await getLinks(new URL(path, startUrl)));
    }

    return {crawl}
}

const getLinks = async (url: URL): Promise<string[]> => {
    return axios.get(url.href)
        .then(response => getLinkPathsOnPage(response, url))
        .catch(error => {
            console.warn(`${error.response.status}! ${url.href} is inaccessible!`);
            return [];
        });
}

const getLinkPathsOnPage = (response: AxiosResponse, url: URL) => {
    const paths = parse(response.data)
        .getElementsByTagName("a")
        .reduce((paths: Set<string>, anchor: HTMLElement) => {
            const href = anchor.getAttribute("href");
            if (!href) {
                return paths;
            }
            const currentUrl = new URL(href, url);
            if (sameDomain(currentUrl, url)) {
                paths.add(currentUrl.pathname);
                return paths;
            } else {
                return paths;
            }
        }, new Set());

    const pathsOnPage: string[] = Array.from(paths.values());
    console.log(`${url} has links to: ${pathsOnPage.map(path => new URL(path, url).href).join(", ")}`);
    console.log(``);
    return pathsOnPage;
};

const sameDomain = (url1: URL, url2: URL) => url1.hostname.replace("www.", "") === url2.hostname.replace("www.", "");

execute(process.argv[2]).catch(console.error);