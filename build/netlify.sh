curl -fsSL https://deno.land/x/install/install.sh | sh
export DENO_INSTALL="/opt/buildhome/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
deno run --allow-net --allow-write scripts/fetch_registered_funds.ts
./web_bundle.sh
cp proxy/netlify.toml site/netlify.toml
cd site
npm install
npm run build
