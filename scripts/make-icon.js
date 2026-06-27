// Generate app icons (build/icon.ico + build/icon.png) by rasterizing an SVG
// with Electron's Chromium, then packing the PNGs into a multi-size ICO.
// Run with:  node_modules/electron/dist/electron.exe scripts/make-icon.js
// (No native image libraries required.)

const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

app.disableHardwareAcceleration(); // keeps transparent capturePage from going black

const OUT_DIR = path.join(__dirname, '..', 'build');
const ICO_SIZES = [16, 32, 48, 64, 128, 256];
const PNG_SIZE = 1024; // high-res source for macOS/Linux

// Public-domain "Markdown mark" (by Dustin Curtis) on a blue rounded square.
function svg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4F8DF5"/>
      <stop offset="1" stop-color="#1E40AF"/>
    </linearGradient>
  </defs>
  <rect x="64" y="64" width="896" height="896" rx="208" fill="url(#g)"/>
  <g transform="translate(192,315) scale(3.08)">
    <rect x="5" y="5" width="198" height="118" rx="14" fill="none" stroke="#fff" stroke-width="13"/>
    <path fill="#fff" d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zM155 98l-30-33h20V30h20v35h20z"/>
  </g>
</svg>`;
}

// Render the icon once at high resolution and return the NativeImage so we can
// downscale it to every required size without spawning more windows.
async function renderBase(size) {
  const win = new BrowserWindow({
    width: size,
    height: size,
    x: -4000, // parked far offscreen; visible to Chromium, not to the user
    y: -4000,
    show: true,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    useContentSize: true,
    webPreferences: { offscreen: false }
  });
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}svg{display:block}</style>
    </head><body>${svg(size)}</body></html>`;
  const tmp = path.join(os.tmpdir(), `md-icon-${Date.now()}.html`);
  try {
    fs.writeFileSync(tmp, html, 'utf-8');
    await win.loadFile(tmp);
    await new Promise((r) => setTimeout(r, 500)); // let it paint
    const image = await win.webContents.capturePage();
    if (image.isEmpty()) throw new Error('capturePage returned empty image');
    return image;
  } finally {
    win.destroy();
    fs.unlink(tmp, () => {});
  }
}

// Minimal ICO writer; embeds PNG payloads (supported on Windows Vista+).
function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dir = [];
  const blobs = [];
  for (const { size, buf } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 => 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    dir.push(e);
    blobs.push(buf);
  }
  return Buffer.concat([header, ...dir, ...blobs]);
}

app.whenReady().then(async () => {
  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const base = await renderBase(PNG_SIZE); // one high-res capture
    console.log(`captured ${PNG_SIZE}x${PNG_SIZE}`);

    const icoEntries = ICO_SIZES.map((size) => ({
      size,
      buf: base.resize({ width: size, height: size, quality: 'best' }).toPNG()
    }));
    fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), buildIco(icoEntries));
    console.log(`wrote build/icon.ico (${ICO_SIZES.join(', ')})`);

    fs.writeFileSync(path.join(OUT_DIR, 'icon.png'), base.toPNG());
    console.log(`wrote build/icon.png (${PNG_SIZE}x${PNG_SIZE})`);

    app.exit(0);
  } catch (err) {
    console.error('icon generation failed:', err);
    app.exit(1);
  }
});
