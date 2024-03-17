# For Cloudflare Pages
curl -fsSL https://deno.land/install.sh | sh -s v1.40.2
export DENO_INSTALL="/opt/buildhome/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
./web_bundle.sh
cd site
npm install
npm run build
