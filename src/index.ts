import {URL} from "url";
import {crawler} from "./crawler";

const execute = async (url: string): Promise<void> => {
    await crawler(new URL(url), console).crawl();
}

execute(process.argv[2]).catch(console.error);