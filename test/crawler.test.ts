import {crawler, Logger} from "../src/crawler";
import {mock} from "jest-mock-extended";
import {server} from './mocks/server'

const mockLogger = mock<Logger>()

describe('crawler tests', () => {
    beforeAll(() => server.listen());

    afterEach(() => {
        server.resetHandlers();
        jest.resetAllMocks();
    });

    afterAll(() => server.close());

    it.each([
        [401],
        [403],
        [404],
        [500]
    ])('should print a warning when calling the supplied URL results in a %i error', async (errorCode: number) => {
        await crawler(new URL(`https://www.google.com/error/${errorCode}`), mockLogger).crawl();
        expect(mockLogger.log).not.toHaveBeenCalled();
        expect(mockLogger.warn).toHaveBeenCalledWith(`${errorCode}! https://www.google.com/error/${errorCode} is inaccessible!`);
    });

    it('should print once when start url page has one link to a different domain', async () => {
        await crawler(new URL(`https://www.google.com/one-link-to-different-domain`), mockLogger).crawl();
        expect(mockLogger.log).toHaveBeenCalledWith("https://www.google.com/one-link-to-different-domain has no relevant links");
    });

    it('should print once when start url page has one link to a different sub domain', async () => {
        await crawler(new URL(`https://www.google.com/one-link-to-different-sub-domain`), mockLogger).crawl();
        expect(mockLogger.log).toHaveBeenCalledWith("https://www.google.com/one-link-to-different-sub-domain has no relevant links");
    });

    it('should print twice when start url page has one link to a different domain and another to the same domain', async () => {
        await crawler(new URL(`https://www.google.com/one-link-to-different-domain-and-one-to-same-domain`), mockLogger).crawl();
        expect(mockLogger.log).toHaveBeenCalledWith(
                "https://www.google.com/one-link-to-different-domain-and-one-to-same-domain has links to: https://www.google.com/one-link-to-different-domain"
        );

        expect(mockLogger.log).toHaveBeenCalledWith(
            "https://www.google.com/one-link-to-different-domain has no relevant links"
        );
    });

    it('should not treat www as a different sub domain', async() => {
        await crawler(new URL(`https://www.google.com/one-non-www-link-to-same-domain`), mockLogger).crawl();
        expect(mockLogger.log).toHaveBeenCalledWith(
            "https://www.google.com/one-non-www-link-to-same-domain has links to: https://google.com/error/404"
        );

        expect(mockLogger.warn).toHaveBeenCalledWith(`404! https://google.com/error/404 is inaccessible!`);
    });

    it('should ignore duplicate links', async() => {
        await crawler(new URL(`https://www.google.com/duplicate-links-on-page`), mockLogger).crawl();
        expect(mockLogger.log).toHaveBeenCalledWith(
            "https://www.google.com/duplicate-links-on-page has links to: https://www.google.com/duplicate"
        );

        expect(mockLogger.log).toHaveBeenCalledWith(
            "https://www.google.com/duplicate has no relevant links"
        );
    });

    it('should ignore links to files', async() => {
        await crawler(new URL(`https://www.google.com/only-links-to-files`), mockLogger).crawl();

        expect(mockLogger.log).toHaveBeenCalledWith(
            "https://www.google.com/only-links-to-files has no relevant links"
        );
    });
});