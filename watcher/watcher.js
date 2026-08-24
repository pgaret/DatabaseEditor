import { watch, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import initSqlJs from 'sql.js';
import { parseSav, repackSav } from './sav-io.js';
import { getEnabledRules } from './rules/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = createRequire(import.meta.url)('./config.json');

const filePattern = new RegExp(config.filePattern);
const debounceMs = config.debounceMs || 3000;

const timers = new Map();
const writing = new Set();

let SQL;
let rules;

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] ${msg}`);
}

async function processFile(filePath) {
  const name = basename(filePath);
  if (writing.has(name)) return;

  try {
    const parsed = parseSav(filePath);
    if (!parsed) {
      log(`${name}: not a GVAS save, skipping`);
      return;
    }

    const db = new SQL.Database(parsed.dbBytes);
    let changed = false;

    try {
      for (const rule of rules) {
        try {
          if (rule(db)) changed = true;
        } catch (e) {
          log(`${name}: rule ${rule.name} error: ${e.message}`);
        }
      }

      if (!changed) {
        log(`${name}: no changes needed`);
        db.close();
        return;
      }

      const newDbBytes = Buffer.from(db.export());
      db.close();

      writing.add(name);
      const newSize = repackSav(filePath, parsed, newDbBytes);
      log(`${name}: rules applied (${newSize} bytes written)`);
      setTimeout(() => writing.delete(name), 5000);
    } catch (e) {
      db.close();
      throw e;
    }
  } catch (e) {
    if (e.code === 'EBUSY' || e.code === 'EPERM') {
      log(`${name}: file locked, will retry next change`);
    } else {
      log(`${name}: error: ${e.message}`);
    }
  }
}

function onFileChange(filename) {
  if (!filename || !filePattern.test(filename)) return;
  if (writing.has(filename)) return;

  if (timers.has(filename)) clearTimeout(timers.get(filename));

  timers.set(filename, setTimeout(() => {
    timers.delete(filename);
    const filePath = join(config.saveDirectory, filename);
    if (existsSync(filePath)) processFile(filePath);
  }, debounceMs));
}

async function scanExisting() {
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(config.saveDirectory);
  for (const f of files) {
    if (filePattern.test(f)) {
      await processFile(join(config.saveDirectory, f));
    }
  }
}

async function main() {
  if (!existsSync(config.saveDirectory)) {
    console.error(`Save directory not found: ${config.saveDirectory}`);
    process.exit(1);
  }

  SQL = await initSqlJs();
  rules = getEnabledRules(config);

  if (rules.length === 0) {
    console.error('No rules enabled in config.json');
    process.exit(1);
  }

  log(`Watching: ${config.saveDirectory}`);
  log(`Rules: ${rules.map(r => r.name).join(', ')}`);

  await scanExisting();

  watch(config.saveDirectory, (event, filename) => {
    onFileChange(filename);
  });

  log('Watcher running (Ctrl+C to stop)');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
