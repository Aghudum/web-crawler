import axios, {AxiosResponse} from "axios";
import parse, {HTMLElement} from "node-html-parser";
import {URL} from "url";

const execute = async (url: string): Promise<void> => {
    await crawler(url).crawl(["/"]);

    // console.log(tree);
}

interface Crawler {
    crawl: (paths: string[]) => void;
}

const crawler = (startUrl: string): Crawler => {
    const stack: string[] = [];
    const visited: Set<string> = new Set<string>();
    const tree = new Node(startUrl);

    const crawl = async (paths: string[]) => {
        paths.forEach(path => {
            if (!visited.has(path)) {
                stack.push(path);
                visited.add(path);
                tree.addChild(new Node(path))
            }
        });

        const path = stack.pop();

        if (path === undefined) {
            return;
        }

        const url_ = new URL(path, startUrl);
        const links = await getLinks(url_);
        await crawl(links);
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
    const root: HTMLElement = parse(response.data);
    const paths = root.getElementsByTagName("a")
        .reduce((paths: Set<string>, anchor: HTMLElement) => {
            const href = anchor.getAttribute("href");
            if (!href) {
                return paths;
            }
            const u = new URL(href, url);
            if (sameDomain(u, url)) {
                paths.add(u.pathname);
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

class Node {
    private value: string;
    private children: Node[] = [];
    private parent: Node | null = null;

    constructor(value: string) {
        this.value = value;
    }

    public addChild(child: Node) {
        child.setParent(this);
        this.children.push(child);
    }

    private setParent(parent: Node) {
        this.parent = parent;
    }
}

execute(process.argv[2]).catch(console.error);