# For Cloudflare Pages
curl -fsSL https://deno.land/x/install/install.sh | sh
export DENO_INSTALL="/opt/buildhome/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
./web_bundle.sh
cd site
npm install
npm run build
