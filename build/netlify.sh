curl -fsSL https://deno.land/install.sh | sh -s v1.41.3
export DENO_INSTALL="/opt/buildhome/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
npm install
npm run build
