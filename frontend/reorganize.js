const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = __dirname;
const SRC_DIR = path.join(FRONTEND_DIR, 'src');

// 1. Create directories
const dirsToCreate = [
  path.join(FRONTEND_DIR, 'scripts'),
  path.join(SRC_DIR, 'lib', 'supabase'),
  path.join(SRC_DIR, 'lib', 'auth'),
  path.join(SRC_DIR, 'actions'),
  path.join(SRC_DIR, 'middleware'),
  path.join(SRC_DIR, 'types'),
  path.join(SRC_DIR, 'styles'),
  path.join(SRC_DIR, 'config'),
];

dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// 2. Move utility scripts
const scriptsToMove = ['checkAdmins.js', 'checkAdmins.ts', 'fix-eslint.js', 'replace.js', 'generate-icons.js'];
scriptsToMove.forEach(script => {
  const oldPath = path.join(FRONTEND_DIR, script);
  const newPath = path.join(FRONTEND_DIR, 'scripts', script);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${script} to scripts/`);
  }
});
// also move from public to scripts if they exist there
const publicScripts = ['generate-icons.js'];
publicScripts.forEach(script => {
  const oldPath = path.join(FRONTEND_DIR, 'public', script);
  const newPath = path.join(FRONTEND_DIR, 'scripts', script);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Moved public/${script} to scripts/`);
  }
});

// 3. Move Supabase
const oldSupabaseDir = path.join(SRC_DIR, 'utils', 'supabase');
const newSupabaseDir = path.join(SRC_DIR, 'lib', 'supabase');
if (fs.existsSync(oldSupabaseDir)) {
  fs.cpSync(oldSupabaseDir, newSupabaseDir, { recursive: true });
  fs.rmSync(oldSupabaseDir, { recursive: true, force: true });
  console.log(`Moved src/utils/supabase to src/lib/supabase`);
}

// 4. Move Auth Context
const oldContextDir = path.join(SRC_DIR, 'context');
const newAuthDir = path.join(SRC_DIR, 'lib', 'auth');
if (fs.existsSync(oldContextDir)) {
  fs.cpSync(oldContextDir, newAuthDir, { recursive: true });
  fs.rmSync(oldContextDir, { recursive: true, force: true });
  console.log(`Moved src/context to src/lib/auth`);
}

// 5. Move Actions
const oldActionsDir = path.join(SRC_DIR, 'app', 'actions');
const newActionsDir = path.join(SRC_DIR, 'actions');
if (fs.existsSync(oldActionsDir)) {
  fs.cpSync(oldActionsDir, newActionsDir, { recursive: true });
  fs.rmSync(oldActionsDir, { recursive: true, force: true });
  console.log(`Moved src/app/actions to src/actions`);
}

// 7. Update Imports across all files in src
function walkSync(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file);
    let stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walkSync(filepath, callback);
    } else {
      if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
        callback(filepath);
      }
    }
  });
}

const replacements = [
  { from: /@\/utils\/supabase/g, to: '@/lib/supabase' },
  { from: /@\/context/g, to: '@/lib/auth' },
  { from: /@\/app\/actions/g, to: '@/actions' },
  { from: /\.\.\/\.\.\/utils\/supabase/g, to: '../../lib/supabase' },
  { from: /\.\.\/utils\/supabase/g, to: '../lib/supabase' },
];

let updatedFilesCount = 0;
walkSync(SRC_DIR, (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let originalContent = content;
  
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf8');
    updatedFilesCount++;
  }
});

console.log(`Updated imports in ${updatedFilesCount} files.`);
console.log('Reorganization Complete.');
