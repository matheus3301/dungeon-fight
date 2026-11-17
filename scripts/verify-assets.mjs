import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, ".."),
  pub = resolve(root, "public");
const packs = JSON.parse(
  await readFile(resolve(pub, "assets/packs/manifest.json"), "utf8"),
);
const games = JSON.parse(
  await readFile(resolve(root, "assets/catalog-games.json"), "utf8"),
);
let checks = 0;
const seen = new Set();
async function check(url, sha) {
  if (!url?.startsWith("/assets/"))
    throw new Error(`Invalid public asset URL: ${url}`);
  const file = resolve(pub, "." + url);
  if (!file.startsWith(pub + "/")) throw new Error("Invalid path");
  if (!seen.has(url)) {
    const b = await readFile(file);
    if (sha && createHash("sha256").update(b).digest("hex") !== sha)
      throw new Error(`Hash mismatch: ${url}`);
    seen.add(url);
    checks++;
  } else if (sha) {
    const b = await readFile(file);
    if (createHash("sha256").update(b).digest("hex") !== sha)
      throw new Error(`Hash mismatch: ${url}`);
  }
}
for (const item of [...packs.heroes, ...packs.bosses])
  for (const url of item.frames) await check(url);
for (const item of packs.audio) await check(item.url, item.sha256);
for (const item of packs.models3d) {
  await check(item.url);
  const b = await readFile(resolve(pub, "." + item.url));
  if (b.subarray(0, 4).toString() !== "glTF")
    throw new Error(`Invalid GLB: ${item.url}`);
  const jsonLength = b.readUInt32LE(12);
  const data = JSON.parse(
    b
      .subarray(20, 20 + jsonLength)
      .toString()
      .trim(),
  );
  for (const image of data.images ?? [])
    if (image.uri && !image.uri.startsWith("data:"))
      await stat(resolve(pub, "." + item.url, "..", image.uri));
}
for (const item of games.assets) {
  if (!item.license || !item.author || !item.sourceUrl)
    throw new Error(`Missing provenance: ${item.id}`);
  await check(item.url, item.sha256);
}
for (const name of [
  "knight_m",
  "elf_f",
  "goblin",
  "dwarf_f",
  "lizard_m",
  "doc",
  "elf_m",
  "wizzard_m",
])
  for (const action of ["idle", "run"])
    for (let i = 0; i < 4; i++)
      await check(`/assets/packs/0x72/frames/${name}_${action}_anim_f${i}.png`);
for (const name of [
  "floor_1",
  "wall_top_mid",
  "wall_mid",
  "column",
  "column_wall",
  "chest_full_open_anim_f0",
])
  await check(`/assets/packs/0x72/frames/${name}.png`);
console.log(
  `Verified ${checks} public assets, actor frames, hashes, license provenance and GLB texture references.`,
);
