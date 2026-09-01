const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const {
  decodeDocument,
  encodeDocument,
  readDocument,
  atomicWriteFile,
  writeDocument
} = require('../lib/file-utils');

test('preserves UTF-8 BOM and CRLF line endings', () => {
  const original = Buffer.concat([
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from('first\r\nsecond\r\n', 'utf8')
  ]);
  const decoded = decodeDocument(original);
  assert.equal(decoded.content, 'first\nsecond\n');
  assert.deepEqual(decoded.format, { encoding: 'utf8', bom: true, eol: '\r\n' });
  assert.deepEqual(encodeDocument(decoded.content, decoded.format), original);
});

test('round-trips UTF-16 little-endian and big-endian documents', () => {
  for (const encoding of ['utf16le', 'utf16be']) {
    const format = { encoding, bom: true, eol: '\n' };
    const encoded = encodeDocument('标题\ncontent', format);
    const decoded = decodeDocument(encoded);
    assert.equal(decoded.content, '标题\ncontent');
    assert.deepEqual(decoded.format, format);
  }
});

test('detects the dominant line ending', () => {
  assert.equal(decodeDocument(Buffer.from('a\r\nb\r\nc\n')).format.eol, '\r\n');
  assert.equal(decodeDocument(Buffer.from('a\nb\nc')).format.eol, '\n');
  assert.equal(decodeDocument(Buffer.from('a\rb\rc')).format.eol, '\r');
});

test('atomically writes and reads a document without leaving temp files', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'markdown-editor-test-'));
  try {
    const filePath = path.join(directory, 'document.md');
    await fs.writeFile(filePath, 'old');
    const format = { encoding: 'utf8', bom: false, eol: '\r\n' };
    await writeDocument(filePath, 'new\ncontent\n', format);
    assert.deepEqual(await readDocument(filePath), { content: 'new\ncontent\n', format });
    assert.deepEqual(await fs.readdir(directory), ['document.md']);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('keeps the destination and cleans up when atomic rename fails', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'markdown-editor-test-'));
  try {
    const filePath = path.join(directory, 'document.md');
    await fs.writeFile(filePath, 'original');
    const rename = fs.rename;
    fs.rename = async () => { throw new Error('simulated rename failure'); };
    try {
      await assert.rejects(() => atomicWriteFile(filePath, Buffer.from('changed')), /simulated rename failure/);
    } finally {
      fs.rename = rename;
    }
    assert.equal(await fs.readFile(filePath, 'utf8'), 'original');
    assert.deepEqual(await fs.readdir(directory), ['document.md']);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
