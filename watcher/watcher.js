import { watch, existsSync, readFileSync, writeFileSync, readdirSync, statSync, utimesSync, mkdirSync, copyFileSync, unlinkSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import initSqlJs from 'sql.js';
import { parseSav, repackSav } from './sav-io.js';
import { getEnabledRules } from './rules/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = createRequire(import.meta.url)('./config.json');
// Env overrides so a throwaway instance can be pointed at a copy of the saves
if (process.env.F1M_SAVE_DIR) config.saveDirectory = process.env.F1M_SAVE_DIR;
if (process.env.F1M_EDITOR_PORT) config.editorPort = Number(process.env.F1M_EDITOR_PORT);

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

      // Keep the original mtime so "most recent save" still means the one
      // the game (or the editor) wrote last, not the one we patched last.
      const { atime, mtime } = statSync(filePath);
      writing.add(name);
      const newSize = repackSav(filePath, parsed, newDbBytes);
      utimesSync(filePath, atime, mtime);
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

// Copy of a save as it was before the editor's first write to it; newest 10 kept.
const backupDir = join(__dirname, 'backups');
function backupSave(filePath) {
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  copyFileSync(filePath, join(backupDir, `${basename(filePath, '.sav')}.${stamp}.sav`));
  const old = readdirSync(backupDir).filter(f => f.endsWith('.sav'))
    .map(f => ({ f, mtime: statSync(join(backupDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime).slice(10);
  for (const { f } of old) unlinkSync(join(backupDir, f));
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

  const editorPort = config.editorPort || 3000;
  // "0.0.0.0" exposes the editor (and its save-overwrite endpoint) to the LAN
  const editorHost = config.editorHost || '127.0.0.1';
  const distDir = join(__dirname, '..', 'dist');
  if (existsSync(distDir)) {
    const mimeTypes = {
      '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
      '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon', '.wasm': 'application/wasm', '.woff2': 'font/woff2',
    };
    const latestSave = () => readdirSync(config.saveDirectory)
      .filter(f => filePattern.test(f))
      .map(f => ({ name: f, mtime: statSync(join(config.saveDirectory, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)[0];

    createServer(async (req, res) => {
      const urlPath = req.url.split('?')[0];

      if (urlPath === '/api/latest-save/info') {
        try {
          const latest = latestSave();
          if (!latest) { res.writeHead(404); res.end('No saves found'); return; }
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify(latest));
        } catch (e) {
          res.writeHead(500); res.end(e.message);
        }
        return;
      }

      if (urlPath === '/api/latest-save') {
        try {
          const latest = latestSave();
          if (!latest) { res.writeHead(404); res.end('No saves found'); return; }
          const data = readFileSync(join(config.saveDirectory, latest.name));
          res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${latest.name}"`,
            'X-Save-Mtime': String(latest.mtime),
            'Cache-Control': 'no-store',
          });
          res.end(data);
        } catch (e) {
          res.writeHead(500); res.end(e.message);
        }
        return;
      }

      // Editor export: overwrite the save in place, then run the rules on it
      // right away so the mtime we hand back is the final one.
      if (urlPath.startsWith('/api/save/') && req.method === 'PUT') {
        const name = decodeURIComponent(urlPath.slice('/api/save/'.length));
        if (name !== basename(name) || !filePattern.test(name)) {
          res.writeHead(400); res.end('Invalid save name'); return;
        }
        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const data = Buffer.concat(chunks);
          if (data.subarray(0, 4).toString('latin1') !== 'GVAS') {
            res.writeHead(400); res.end('Not a GVAS save'); return;
          }
          const filePath = join(config.saveDirectory, name);
          if (req.headers['x-backup'] && existsSync(filePath)) backupSave(filePath);
          writeFileSync(filePath, data);
          await processFile(filePath);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ name, mtime: statSync(filePath).mtimeMs }));
          log(`${name}: overwritten from editor (${data.length} bytes)`);
        } catch (e) {
          res.writeHead(500); res.end(e.message);
        }
        return;
      }

      const filePath = join(distDir, urlPath === '/' ? 'index.html' : urlPath);
      if (!filePath.startsWith(distDir)) { res.writeHead(403); res.end(); return; }
      try {
        let data = readFileSync(filePath);
        if (extname(filePath) === '.html') {
          // Tells the editor it is being served by the watcher (any host, not
          // just localhost), so it auto-loads and writes saves through us.
          data = data.toString().replace('<head>', '<head><script>window.__SAVE_WATCHER__=true</script>');
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    }).listen(editorPort, editorHost, () => {
      log(`Editor available at http://localhost:${editorPort}`);
      if (editorHost !== '127.0.0.1') {
        for (const addrs of Object.values(networkInterfaces())) {
          for (const a of addrs) {
            if (a.family === 'IPv4' && !a.internal) log(`  from other devices: http://${a.address}:${editorPort}`);
          }
        }
      }
    });
  } else {
    log(`Editor dist/ not found at ${distDir} — run "npm run build" in the project root`);
  }

  log('Watcher running (Ctrl+C to stop)');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
