import {setupServer} from 'msw/node'
import {rest} from "msw";

export const server = setupServer(
    rest.get('https://www.google.com/error/:statusCode', (req, res, ctx) => {
        return res(ctx.status(Number(req.params.statusCode)));
    }),
    rest.get('https://google.com/error/404', (req, res, ctx) => {
        return res(ctx.status(404));
    }),
    rest.get('https://www.google.com/one-link-to-different-domain', (req, res, ctx) => {
        return res(ctx.xml(
            "<html><body><a href='https://www.monzo.com'></a></body><html>"
        ));
    }),
    rest.get('https://www.google.com/one-link-to-different-sub-domain', (req, res, ctx) => {
        return res(ctx.xml(
            "<html><body><a href='https://www.mail.google.com'></a></body><html>"
        ));
    }),
    rest.get('https://www.google.com/one-link-to-different-domain-and-one-to-same-domain', (req, res, ctx) => {
        return res(ctx.xml(
            "<html><body><a href='https://www.mail.google.com'></a><a href='https://www.google.com/one-link-to-different-domain'></a></body><html>"
        ));
    }),
    rest.get('https://www.google.com/one-non-www-link-to-same-domain', (req, res, ctx) => {
        return res(ctx.xml(
            "<html><body><a href='https://google.com/error/404'></a></body><html>"
        ));
    }),
    rest.get('https://www.google.com/duplicate-links-on-page', (req, res, ctx) => {
        return res(ctx.xml(
            "<html><body><a href='https://www.google.com/duplicate'></a><a href='https://www.google.com/duplicate'></a></body><html>"
        ));
    }),
    rest.get('https://www.google.com/duplicate', (req, res, ctx) => {
        return res(ctx.xml(
            "<html><body>https://www.google.com/duplicate</body><html>"
        ));
    }),
    rest.get('https://www.google.com/only-links-to-files', (req, res, ctx) => {
        return res(ctx.xml(
            "<html><body><a href='https://www.google.com/file1.mp3'></a><a href='https://www.google.com/file2.pdf'></a><a href='https://www.google.com/file2.mp4'></a><a href='https://www.google.com/file2.mov'></a></body><html>"
        ));
    })
);