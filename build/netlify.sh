curl -fsSL https://deno.land/x/install/install.sh | sh
./web_bundle.sh
cp proxy/netlify.toml site/netlify.toml
cd site
npm install
npm run build
