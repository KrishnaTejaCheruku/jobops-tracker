import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const packageZips = process.argv.includes("--zip");
const targets = ["chrome", "edge", "firefox"];
const runtimeFiles = [
  "capture-utils.js",
  "content.js",
  "extension-api.js",
  "popup.css",
  "popup.html",
  "popup.js",
];
const iconSizes = [16, 32, 48, 128];

async function main() {
  const baseManifest = JSON.parse(await fs.readFile(path.join(rootDir, "manifest.json"), "utf8"));
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });

  for (const target of targets) {
    await buildTarget(target, baseManifest);
  }

  if (packageZips) {
    for (const target of targets) {
      zipTarget(target, baseManifest.version);
    }
  }

  console.log(`Built JobOps Capture extension packages in ${path.relative(rootDir, distDir)}`);
}

async function buildTarget(target, baseManifest) {
  const targetDir = path.join(distDir, target);
  await fs.mkdir(path.join(targetDir, "icons"), { recursive: true });

  for (const file of runtimeFiles) {
    await fs.copyFile(path.join(rootDir, file), path.join(targetDir, file));
  }

  for (const size of iconSizes) {
    await fs.writeFile(path.join(targetDir, "icons", `icon-${size}.png`), createIconPNG(size));
  }

  const manifest = createTargetManifest(target, baseManifest);
  await fs.writeFile(path.join(targetDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

function createTargetManifest(target, baseManifest) {
  const manifest = structuredClone(baseManifest);
  const icons = Object.fromEntries(iconSizes.map((size) => [String(size), `icons/icon-${size}.png`]));

  manifest.icons = icons;
  manifest.action = {
    ...manifest.action,
    default_icon: icons,
  };

  if (target === "firefox") {
    manifest.browser_specific_settings = {
      gecko: {
        id: "capture@jobops.me",
        strict_min_version: "128.0",
        data_collection_permissions: {
          required: ["websiteActivity", "websiteContent"],
        },
      },
    };
  } else {
    delete manifest.browser_specific_settings;
  }

  return manifest;
}

function zipTarget(target, version) {
  const targetDir = path.join(distDir, target);
  const zipPath = path.join(distDir, `jobops-capture-${version}-${target}.zip`);

  if (!existsSync(targetDir)) {
    throw new Error(`Missing build directory: ${targetDir}`);
  }

  execFileSync("zip", ["-qr", zipPath, "."], { cwd: targetDir, stdio: "inherit" });
}

function createIconPNG(size) {
  const width = size;
  const height = size;
  const pixels = Buffer.alloc(width * height * 4);

  fillRect(pixels, width, height, 0, 0, width, height, [15, 23, 42, 255]);
  fillRect(pixels, width, height, scale(18, size), scale(24, size), scale(92, size), scale(80, size), [255, 255, 255, 255]);
  fillRect(pixels, width, height, scale(38, size), scale(40, size), scale(52, size), Math.max(1, scale(7, size)), [20, 100, 244, 255]);
  fillRect(pixels, width, height, scale(38, size), scale(56, size), scale(38, size), Math.max(1, scale(7, size)), [20, 100, 244, 255]);
  fillRect(pixels, width, height, scale(38, size), scale(72, size), scale(52, size), Math.max(1, scale(7, size)), [20, 100, 244, 255]);
  drawLine(pixels, width, height, scale(84, size), scale(84, size), scale(96, size), scale(96, size), [22, 163, 74, 255], Math.max(1, scale(8, size)));
  drawLine(pixels, width, height, scale(96, size), scale(96, size), scale(114, size), scale(72, size), [22, 163, 74, 255], Math.max(1, scale(8, size)));

  return encodePNG(width, height, pixels);
}

function scale(value, size) {
  return Math.max(0, Math.round((value / 128) * size));
}

function fillRect(pixels, width, height, x, y, rectWidth, rectHeight, color) {
  const xEnd = Math.min(width, x + rectWidth);
  const yEnd = Math.min(height, y + rectHeight);
  for (let row = Math.max(0, y); row < yEnd; row += 1) {
    for (let column = Math.max(0, x); column < xEnd; column += 1) {
      setPixel(pixels, width, height, column, row, color);
    }
  }
}

function drawLine(pixels, width, height, x1, y1, x2, y2, color, thickness) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const x = Math.round(x1 + (x2 - x1) * t);
    const y = Math.round(y1 + (y2 - y1) * t);
    fillRect(
      pixels,
      width,
      height,
      x - Math.floor(thickness / 2),
      y - Math.floor(thickness / 2),
      thickness,
      thickness,
      color,
    );
  }
}

function setPixel(pixels, width, height, x, y, color) {
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return;
  }

  const offset = (y * width + x) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3];
}

function encodePNG(width, height, pixels) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let row = 0; row < height; row += 1) {
    raw[row * (stride + 1)] = 0;
    pixels.copy(raw, row * (stride + 1) + 1, row * stride, row * stride + stride);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", Buffer.concat([uint32(width), uint32(height), Buffer.from([8, 6, 0, 0, 0])])),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  return Buffer.concat([
    uint32(data.length),
    typeBuffer,
    data,
    uint32(crc32(Buffer.concat([typeBuffer, data]))),
  ]);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
