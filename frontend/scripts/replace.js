const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(/bg-primary(.*?)\s+text-white/g, 'bg-primary$1 text-primary-foreground');
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated', filePath);
  }
}

function walk(dir) {
  let list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      walk(file);
    } else {
      if (file.endsWith('.tsx')) {
        replaceInFile(file);
      }
    }
  });
}

walk('src');
