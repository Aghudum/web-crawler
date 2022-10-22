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
    // console.log(tree);
};
const crawler = (startUrl) => {
    const stack = [];
    const visited = new Set();
    const tree = new Node(startUrl);
    const crawl = async (paths) => {
        paths.forEach(path => {
            if (!visited.has(path)) {
                stack.push(path);
                visited.add(path);
                tree.addChild(new Node(path));
            }
        });
        const path = stack.pop();
        if (path === undefined) {
            return;
        }
        const url_ = new url_1.URL(path, startUrl);
        const links = await getLinks(url_);
        await crawl(links);
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
    const root = (0, node_html_parser_1.default)(response.data);
    const paths = root.getElementsByTagName("a")
        .reduce((paths, anchor) => {
        const href = anchor.getAttribute("href");
        if (!href) {
            return paths;
        }
        const u = new url_1.URL(href, url);
        if (sameDomain(u, url)) {
            paths.add(u.pathname);
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
class Node {
    constructor(value) {
        this.children = [];
        this.parent = null;
        this.value = value;
    }
    addChild(child) {
        child.setParent(this);
        this.children.push(child);
    }
    setParent(parent) {
        this.parent = parent;
    }
}
execute(process.argv[2]).catch(console.error);
