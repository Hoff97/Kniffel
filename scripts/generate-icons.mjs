import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const outDir = fileURLToPath(new URL("../public/icons/", import.meta.url));
mkdirSync(outDir, { recursive: true });

const iconSource = fileURLToPath(new URL("./icon-source.svg", import.meta.url));
const maskableSource = fileURLToPath(new URL("./icon-maskable-source.svg", import.meta.url));

const sizes = [64, 192, 512];

for (const size of sizes) {
  await sharp(iconSource)
    .resize(size, size)
    .png()
    .toFile(`${outDir}icon-${size}.png`);
}

await sharp(maskableSource).resize(512, 512).png().toFile(`${outDir}icon-maskable-512.png`);

await sharp(iconSource).resize(180, 180).png().toFile(`${outDir}apple-touch-icon.png`);

console.log("Icons generated.");
