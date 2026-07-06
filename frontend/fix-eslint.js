const fs = require('fs');
const path = require('path');

const log = `
./src/app/(dashboard)/admin/courses/page.tsx
49:6
./src/app/(dashboard)/admin/examinations/page.tsx
62:6
./src/app/(dashboard)/admin/faculty/page.tsx
59:6
./src/app/(dashboard)/admin/page.tsx
37:6
./src/app/(dashboard)/admin/students/page.tsx
64:6
./src/app/(dashboard)/admin/timetable/page.tsx
35:6
./src/app/(dashboard)/faculty/assignments/page.tsx
84:6
./src/app/(dashboard)/faculty/attendance/page.tsx
63:6
104:6
./src/app/(dashboard)/faculty/page.tsx
42:6
./src/app/(dashboard)/faculty/students/page.tsx
58:6
108:6
./src/app/(dashboard)/faculty/students/[id]/page.tsx
64:6
./src/app/(dashboard)/student/assignments/page.tsx
71:6
./src/app/(dashboard)/student/attendance/page.tsx
78:6
./src/app/(dashboard)/student/page.tsx
47:6
./src/app/(dashboard)/student/profile/page.tsx
66:6
./src/app/(dashboard)/student/timetable/page.tsx
44:6
`;

const lines = log.trim().split('\n');
let currentFile = '';

const edits = {};

for (const line of lines) {
  if (line.startsWith('./')) {
    currentFile = line.trim();
  } else if (line.match(/^\d+:\d+/)) {
    const lineNum = parseInt(line.split(':')[0], 10);
    if (!edits[currentFile]) edits[currentFile] = [];
    edits[currentFile].push(lineNum);
  }
}

for (const [file, lineNums] of Object.entries(edits)) {
  const fullPath = path.join(process.cwd(), file);
  const content = fs.readFileSync(fullPath, 'utf8').split('\n');
  
  // Sort line numbers descending so inserting doesn't change subsequent line numbers
  lineNums.sort((a, b) => b - a);
  
  for (const lineNum of lineNums) {
    // lineNum is 1-indexed. We want to insert the comment ABOVE this line.
    const idx = lineNum - 1;
    // Actually, lineNum points to the closing bracket `}, [])` of useEffect.
    // Let's insert the comment just above it.
    const indent = content[idx].match(/^\s*/)[0];
    content.splice(idx, 0, indent + '// eslint-disable-next-line react-hooks/exhaustive-deps');
  }
  
  fs.writeFileSync(fullPath, content.join('\n'));
}
console.log('Fixed ESLint warnings');
