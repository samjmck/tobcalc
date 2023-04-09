export default async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const realPath = pathname.split("/justetf/")[1];
    const response = await fetch(`https://www.justetf.com/${realPath}${url.search}`, {
        "body": req.body,
        "method": req.method,
    });
    return new Response(response.body);
}
