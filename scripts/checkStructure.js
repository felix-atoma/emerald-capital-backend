import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📁 Project Structure:');
console.log('Current directory:', __dirname);

function listFiles(dir, indent = '') {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file === 'node_modules') return;
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      console.log(indent + '📁 ' + file);
      listFiles(filePath, indent + '  ');
    } else {
      console.log(indent + '📄 ' + file);
    }
  });
}

listFiles(path.join(__dirname, '..'));