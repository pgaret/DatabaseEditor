import { Service } from 'node-windows';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const svc = new Service({
  name: 'F1M Save Watcher',
  script: join(__dirname, 'watcher.js'),
});

svc.on('uninstall', () => {
  console.log('Service uninstalled.');
});

svc.on('error', (e) => {
  console.error('Error:', e);
});

console.log('Uninstalling F1M Save Watcher service...');
svc.uninstall();
