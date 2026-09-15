import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const plan = JSON.parse(await readFile("scripts/plans/slides.json", "utf8"));
if (plan.length !== 12) throw new Error("Expected six slides in each of two themes.");
const exports = [];
for (const shot of plan) {
  const bytes = await readFile(shot.out);
  if (bytes.subarray(1, 4).toString() !== "PNG") throw new Error(`${shot.out} is not a PNG.`);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== 2880 || height !== 1800) throw new Error(`${shot.out}: expected 2880 × 1800, got ${width} × ${height}.`);
  exports.push({ file: basename(shot.out), theme: shot.theme, width, height, sha256: createHash("sha256").update(bytes).digest("hex") });
}
await writeFile("docs/evidence/slides/manifest.json", JSON.stringify(exports, null, 2) + "\n");
console.log("Verified all 12 PNGs: 2880 × 1800 pixels.");
