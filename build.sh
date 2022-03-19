# For Cloudflare Pages
curl -fsSL https://deno.land/x/install/install.sh | sh
./web_bundle.sh
cd site
npm run build
