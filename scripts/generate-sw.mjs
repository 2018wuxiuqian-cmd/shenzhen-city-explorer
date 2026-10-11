import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
async function scan(dir) {
  const result = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${e.name}`;
    if (e.isDirectory()) result.push(...(await scan(path)));
    else if (e.name !== "sw.js") result.push(path);
  }
  return result;
}
const files = await scan("dist");
const hash = createHash("sha256");
for (const file of files) hash.update(await readFile(file));
const name = "shenzhen-" + hash.digest("hex").slice(0, 12);
const paths = files.map((p) => "./" + p.slice(5));
await writeFile(
  "dist/sw.js",
  `const CACHE=${JSON.stringify(name)},FILES=${JSON.stringify(paths)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('shenzhen-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>{if(e.request.mode==='navigate'){try{return await fetch(e.request);}catch{return (await c.match('./index.html'))||Response.error();}}return (await c.match(e.request,{ignoreVary:true}))||fetch(e.request);}));});
`,
);
console.log(
  `Offline cache generated: ${files.length} local resources (${name})`,
);
