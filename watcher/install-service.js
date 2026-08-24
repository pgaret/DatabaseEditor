import { Service } from 'node-windows';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const svc = new Service({
  name: 'F1M Save Watcher',
  description: 'Monitors F1 Manager 24 save files and applies rules automatically',
  script: join(__dirname, 'watcher.js'),
  nodeOptions: [],
  env: [{ name: 'NODE_ENV', value: 'production' }],
});

svc.on('install', () => {
  svc.start();
  console.log('Service installed and started.');
  console.log('It will run automatically when Windows starts.');
  console.log('To remove: npm run uninstall-service');
});

svc.on('alreadyinstalled', () => {
  console.log('Service is already installed.');
});

svc.on('error', (e) => {
  console.error('Error:', e);
});

console.log('Installing F1M Save Watcher as a Windows service...');
console.log('(This requires administrator privileges)');
svc.install();
