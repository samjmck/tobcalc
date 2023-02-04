import { serve } from "https://deno.land/std@0.130.0/http/server.ts";

async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;
    if(pathname.startsWith("/investing_com/")) {
        const realPath = pathname.split("/investing_com/")[1];
        const response = await fetch(`https://www.investing.com/${realPath}`, {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en-GB,en;q=0.9,nl;q=0.8,en-US;q=0.7",
                "content-type": "application/x-www-form-urlencoded",
                "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"99\", \"Google Chrome\";v=\"99\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-gpc": "1",
                "x-requested-with": "XMLHttpRequest",
            },
            "referrer": "https://www.investing.com/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": req.body,
            "method": req.method,
            "mode": "cors",
            "credentials": "include",
        });
        return new Response(response.body);
    } else if(pathname.startsWith("/ecb/")) {
        const realPath = pathname.split("/ecb/")[1];
        const response = await fetch(`https://sdw-wsrest.ecb.europa.eu/${realPath}`, {
            "body": req.body,
            "method": req.method,
        });
        return new Response(response.body);
    }
    return Promise.resolve(new Response(null, { status: 500 }));
}

await serve(handler);
