export default async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const realPath = pathname.split("/ecb/")[1];
    const response = await fetch(`https://sdw-wsrest.ecb.europa.eu/${realPath}`, {
        "body": req.body,
        "method": req.method,
    });
    return new Response(response.body);
}
