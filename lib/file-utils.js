const path = require('path');
const crypto = require('crypto');
const fs = require('fs/promises');

const DEFAULT_FORMAT = Object.freeze({ encoding: 'utf8', bom: false, eol: '\n' });

function normalizeFormat(value) {
  const encoding = ['utf8', 'utf16le', 'utf16be'].includes(value?.encoding) ? value.encoding : 'utf8';
  const eol = ['\n', '\r\n', '\r'].includes(value?.eol) ? value.eol : '\n';
  return { encoding, bom: !!value?.bom, eol };
}

function detectEol(text) {
  const crlf = (text.match(/\r\n/g) || []).length;
  const withoutCrlf = text.replace(/\r\n/g, '');
  const lf = (withoutCrlf.match(/\n/g) || []).length;
  const cr = (withoutCrlf.match(/\r/g) || []).length;
  if (crlf >= lf && crlf >= cr && crlf > 0) return '\r\n';
  if (cr > lf && cr > 0) return '\r';
  return '\n';
}

function swapUtf16Bytes(buffer) {
  const result = Buffer.alloc(buffer.length);
  for (let i = 0; i + 1 < buffer.length; i += 2) {
    result[i] = buffer[i + 1];
    result[i + 1] = buffer[i];
  }
  return result;
}

function decodeDocument(buffer) {
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  let encoding = 'utf8';
  let bom = false;
  let offset = 0;

  if (data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) {
    bom = true;
    offset = 3;
  } else if (data.length >= 2 && data[0] === 0xff && data[1] === 0xfe) {
    encoding = 'utf16le';
    bom = true;
    offset = 2;
  } else if (data.length >= 2 && data[0] === 0xfe && data[1] === 0xff) {
    encoding = 'utf16be';
    bom = true;
    offset = 2;
  }

  const body = data.subarray(offset);
  const decoded = encoding === 'utf16be'
    ? swapUtf16Bytes(body).toString('utf16le')
    : body.toString(encoding);
  const eol = detectEol(decoded);
  return {
    content: decoded.replace(/\r\n|\r/g, '\n'),
    format: { encoding, bom, eol }
  };
}

function encodeDocument(content, value) {
  const format = normalizeFormat(value);
  const text = String(content).replace(/\r\n|\r/g, '\n').replace(/\n/g, format.eol);
  let body = Buffer.from(text, format.encoding === 'utf16be' ? 'utf16le' : format.encoding);
  if (format.encoding === 'utf16be') body = swapUtf16Bytes(body);
  if (!format.bom) return body;
  const prefix = format.encoding === 'utf8'
    ? Buffer.from([0xef, 0xbb, 0xbf])
    : format.encoding === 'utf16le'
      ? Buffer.from([0xff, 0xfe])
      : Buffer.from([0xfe, 0xff]);
  return Buffer.concat([prefix, body]);
}

async function readDocument(filePath) {
  return decodeDocument(await fs.readFile(filePath));
}

async function atomicWriteFile(filePath, data) {
  const directory = path.dirname(filePath);
  const tempPath = path.join(directory, `.${path.basename(filePath)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  let handle = null;
  try {
    let mode;
    try { mode = (await fs.stat(filePath)).mode; } catch { /* New file. */ }
    handle = await fs.open(tempPath, 'wx', mode);
    await handle.writeFile(data);
    await handle.sync();
    await handle.close();
    handle = null;
    await fs.rename(tempPath, filePath);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await fs.unlink(tempPath).catch(() => {});
    throw error;
  }
}

async function writeDocument(filePath, content, format) {
  await atomicWriteFile(filePath, encodeDocument(content, format));
  return normalizeFormat(format);
}

module.exports = {
  DEFAULT_FORMAT,
  normalizeFormat,
  detectEol,
  decodeDocument,
  encodeDocument,
  readDocument,
  atomicWriteFile,
  writeDocument
};
