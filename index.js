"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const node_html_parser_1 = __importDefault(require("node-html-parser"));
const url_1 = require("url");
const execute = async (url) => {
    await crawler(url).crawl(["/"]);
};
const crawler = (startUrl) => {
    const stack = [];
    const visited = new Set();
    const crawl = async (paths) => {
        paths.forEach(path => {
            if (visited.has(path))
                return;
            stack.push(path);
            visited.add(path);
        });
        const path = stack.pop();
        if (path === undefined)
            return;
        await crawl(await getLinks(new url_1.URL(path, startUrl)));
    };
    return { crawl };
};
const getLinks = async (url) => {
    return axios_1.default.get(url.href)
        .then(response => getLinkPathsOnPage(response, url))
        .catch(error => {
        console.warn(`${error.response.status}! ${url.href} is inaccessible!`);
        return [];
    });
};
const getLinkPathsOnPage = (response, url) => {
    const paths = (0, node_html_parser_1.default)(response.data)
        .getElementsByTagName("a")
        .reduce((paths, anchor) => {
        const href = anchor.getAttribute("href");
        if (!href) {
            return paths;
        }
        const currentUrl = new url_1.URL(href, url);
        if (sameDomain(currentUrl, url)) {
            paths.add(currentUrl.pathname);
            return paths;
        }
        else {
            return paths;
        }
    }, new Set());
    const pathsOnPage = Array.from(paths.values());
    console.log(`${url} has links to: ${pathsOnPage.map(path => new url_1.URL(path, url).href).join(", ")}`);
    console.log(``);
    return pathsOnPage;
};
const sameDomain = (url1, url2) => url1.hostname.replace("www.", "") === url2.hostname.replace("www.", "");
execute(process.argv[2]).catch(console.error);
