#!/usr/bin/env node
// Minimal UE pak V3 writer — builds a legacy `_P` patch pak from a mod folder.
//
//   node mods/build-pak.js zz_PitCrewAuto [outDir]
//
// Every file under mods/<name>/ (except README.md) is packed uncompressed and
// unencrypted at its path relative to that folder, under the UIGameface mount
// point. That is the format the game's pak loader accepts alongside the IoStore
// containers — see docs/modding/game-files-and-tooling.md. repak produces the
// same layout; this script exists so a rebuild needs no external tooling.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MOUNT = '../../../F1Manager24/Content/UIGameface/';
const PAK_MAGIC = 0x5a6f12e1;
const PAK_VERSION = 3;
const RECORD_BYTES = 53; // offset u64, size u64, uncompressed u64, compression u32, sha1[20], encrypted u8, blockSize u32

function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full, base);
    if (e.name === 'README.md') return [];
    return [path.relative(base, full).split(path.sep).join('/')];
  });
}

function record(offset, data, hash) {
  const b = Buffer.alloc(RECORD_BYTES);
  b.writeBigUInt64LE(BigInt(offset), 0);
  b.writeBigUInt64LE(BigInt(data.length), 8);
  b.writeBigUInt64LE(BigInt(data.length), 16);
  b.writeUInt32LE(0, 24); // compression method: none
  hash.copy(b, 28);
  b.writeUInt8(0, 48); // not encrypted
  b.writeUInt32LE(0, 49); // no compression blocks
  return b;
}

function fstring(s) {
  const b = Buffer.alloc(4 + s.length + 1);
  b.writeInt32LE(s.length + 1, 0);
  b.write(s, 4, 'latin1');
  return b;
}

function int32(n) {
  const b = Buffer.alloc(4);
  b.writeInt32LE(n, 0);
  return b;
}

function buildPak(modDir) {
  const names = walk(modDir).sort();
  if (!names.length) throw new Error('no files to pack in ' + modDir);

  const body = [];
  const indexEntries = [];
  let offset = 0;

  for (const name of names) {
    const data = fs.readFileSync(path.join(modDir, name));
    const hash = crypto.createHash('sha1').update(data).digest();
    body.push(record(0, data, hash), data); // in-file record stores offset 0
    indexEntries.push(fstring(name), record(offset, data, hash));
    offset += RECORD_BYTES + data.length;
    console.log('  +', name, data.length, 'bytes');
  }

  const bodyBuf = Buffer.concat(body);
  const index = Buffer.concat([fstring(MOUNT), int32(names.length), ...indexEntries]);
  const indexHash = crypto.createHash('sha1').update(index).digest();

  const footer = Buffer.alloc(44);
  footer.writeUInt32LE(PAK_MAGIC, 0);
  footer.writeUInt32LE(PAK_VERSION, 4);
  footer.writeBigUInt64LE(BigInt(bodyBuf.length), 8); // index offset
  footer.writeBigUInt64LE(BigInt(index.length), 16); // index size
  indexHash.copy(footer, 24);

  return Buffer.concat([bodyBuf, index, footer]);
}

const modName = process.argv[2];
if (!modName) {
  console.error('usage: node mods/build-pak.js <modName> [outDir]');
  process.exit(1);
}
const modDir = path.join(__dirname, modName);
if (!fs.existsSync(modDir)) throw new Error('no such mod folder: ' + modDir);

console.log('packing', modName);
const pak = buildPak(modDir);
const outPath = path.join(process.argv[3] || process.cwd(), modName + '_1_P.pak');
fs.writeFileSync(outPath, pak);
console.log('wrote', outPath, pak.length, 'bytes');
console.log('install: copy into F1Manager24\\Content\\Paks (back up what you replace), then restart the game');
