export default async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const realPath = pathname.split("/yahoo_finance/")[1];
    const response = await fetch(`https://finance.yahoo.com/${realPath}${url.search}`, {
        "body": req.body,
    });
    return new Response(response.body);
}
