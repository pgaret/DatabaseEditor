#!/usr/bin/env node
// Reader counterpart to build-pak.js — lists or extracts a legacy pak V3 file.
//
//   node mods/unpack-pak.js <file.pak>                 # list contents
//   node mods/unpack-pak.js <file.pak> mods/<name>     # extract into a mod folder
//
// Only handles what build-pak.js writes and what repak produces for these UI
// mods: pak V3, uncompressed, unencrypted. It refuses anything else rather than
// emitting garbage. IoStore containers (.utoc/.ucas) are a different format and
// still need retoc — see docs/modding/game-files-and-tooling.md.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PAK_MAGIC = 0x5a6f12e1;
const FOOTER_BYTES = 44;
const RECORD_BYTES = 53;

function readFString(buf, offset) {
  const len = buf.readInt32LE(offset);
  if (len < 0) throw new Error('UTF-16 strings not supported');
  return { value: buf.slice(offset + 4, offset + 4 + len - 1).toString('latin1'), next: offset + 4 + len };
}

function readRecord(buf, offset) {
  const compression = buf.readUInt32LE(offset + 24);
  const encrypted = buf.readUInt8(offset + 48);
  if (compression !== 0) throw new Error('compressed entries not supported (method ' + compression + ')');
  if (encrypted) throw new Error('encrypted entries not supported');
  return {
    offset: Number(buf.readBigUInt64LE(offset)),
    size: Number(buf.readBigUInt64LE(offset + 8)),
    hash: buf.slice(offset + 28, offset + 48),
    next: offset + RECORD_BYTES,
  };
}

function readPak(pakPath) {
  const buf = fs.readFileSync(pakPath);
  const footer = buf.length - FOOTER_BYTES;
  if (buf.readUInt32LE(footer) !== PAK_MAGIC) throw new Error('not a pak file (bad magic)');
  const version = buf.readUInt32LE(footer + 4);
  if (version !== 3) throw new Error('unsupported pak version ' + version);

  const indexOffset = Number(buf.readBigUInt64LE(footer + 8));
  const indexSize = Number(buf.readBigUInt64LE(footer + 16));
  const index = buf.slice(indexOffset, indexOffset + indexSize);
  const indexHash = crypto.createHash('sha1').update(index).digest();
  if (!indexHash.equals(buf.slice(footer + 24, footer + FOOTER_BYTES))) throw new Error('index hash mismatch');

  const mountRead = readFString(index, 0);
  const count = index.readInt32LE(mountRead.next);
  let cursor = mountRead.next + 4;

  const files = [];
  for (let i = 0; i < count; i++) {
    const name = readFString(index, cursor);
    const record = readRecord(index, name.next);
    cursor = record.next;
    // The entry offset points at the in-file record; payload follows it.
    const data = buf.slice(record.offset + RECORD_BYTES, record.offset + RECORD_BYTES + record.size);
    if (!crypto.createHash('sha1').update(data).digest().equals(record.hash)) {
      throw new Error('data hash mismatch for ' + name.value);
    }
    files.push({ name: name.value, data });
  }
  return { mount: mountRead.value, files };
}

const pakPath = process.argv[2];
const outDir = process.argv[3];
if (!pakPath) {
  console.error('usage: node mods/unpack-pak.js <file.pak> [outDir]');
  process.exit(1);
}

const pak = readPak(pakPath);
console.log('mount', pak.mount);
for (const file of pak.files) {
  console.log('  ', file.name, file.data.length, 'bytes');
  if (!outDir) continue;
  const dest = path.join(outDir, file.name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, file.data);
}
if (outDir) console.log('extracted to', outDir);
