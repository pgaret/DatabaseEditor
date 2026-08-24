import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';

const NONE_PATTERN = Buffer.from([0x05, 0x00, 0x00, 0x00, 0x4E, 0x6F, 0x6E, 0x65, 0x00]);

function findBoundary(buf) {
  for (let i = 0; i < buf.length - 30; i++) {
    if (buf[i] !== 0x05) continue;
    if (buf.compare(NONE_PATTERN, 0, 9, i, i + 9) !== 0) continue;
    if (buf.readInt32LE(i + 9) !== 0) continue;
    const totalSize = buf.readInt32LE(i + 13);
    if (i + 29 + totalSize === buf.length) {
      return i + 9;
    }
  }
  throw new Error('Could not find GVAS/data boundary');
}

export function parseSav(filePath) {
  const buf = readFileSync(filePath);

  if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'GVAS') {
    return null;
  }

  const A = findBoundary(buf);
  const totalSize = buf.readInt32LE(A + 4);
  const size1 = buf.readInt32LE(A + 8);
  const size2 = buf.readInt32LE(A + 12);
  const size3 = buf.readInt32LE(A + 16);

  const compressed = buf.subarray(A + 20, A + 20 + totalSize);
  const inflated = inflateSync(compressed);

  return {
    prefix: Buffer.from(buf.subarray(0, A + 4)),
    dbBytes: Buffer.from(inflated.subarray(0, size1)),
    other1: Buffer.from(inflated.subarray(size1, size1 + size2)),
    other2: Buffer.from(inflated.subarray(size1 + size2, size1 + size2 + size3)),
    size2,
    size3,
  };
}

export function repackSav(filePath, parsed, newDbBytes) {
  const { prefix, other1, other2, size2, size3 } = parsed;
  const payload = Buffer.concat([newDbBytes, other1, other2]);
  const compressed = deflateSync(payload, { level: 9 });

  const output = Buffer.alloc(prefix.length + 16 + compressed.length);
  prefix.copy(output, 0);
  output.writeInt32LE(compressed.length, prefix.length);
  output.writeInt32LE(newDbBytes.length, prefix.length + 4);
  output.writeInt32LE(size2, prefix.length + 8);
  output.writeInt32LE(size3, prefix.length + 12);
  compressed.copy(output, prefix.length + 16);

  writeFileSync(filePath, output);
  return output.length;
}
