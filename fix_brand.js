const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.match(/\.(md|ts|tsx|json)$/)) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('.');
let replacedFiles = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/(Bitget\s+AI\s+)+RedTeam\s+Desk/g, 'Bitget AI RedTeam Desk');
  
  // also check for AI Trading Desk in user-facing places, though B0*.md etc maybe don't want to lose track names.
  // The user says "Remove stale references to sections that do not exist anymore (for example comments naming B11 if the actual product bible stops at B06)."
  // We will do that in another pass.
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    replacedFiles.push(file);
  }
});
console.log('Replaced in:', replacedFiles);
