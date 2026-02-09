import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function countFiles(dir, excludeDirs = ['node_modules', '.git', 'dist', 'build']) {
  let count = 0;
  
  function traverse(currentDir) {
    const files = readdirSync(currentDir);
    
    files.forEach(file => {
      const fullPath = join(currentDir, file);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          traverse(fullPath);
        }
      } else {
        count++;
      }
    });
  }
  
  traverse(dir);
  return count;
}

const projectDir = __dirname;
const fileCount = countFiles(projectDir);
console.log(`Total number of files in the project: ${fileCount}`);
