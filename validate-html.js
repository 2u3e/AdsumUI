const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'pages', 'menu', 'menu.component.html');
const content = fs.readFileSync(filePath, 'utf8');

console.log('=== HTML Structure Validation ===\n');

// Check for invisible characters
const invisibleChars = content.match(/[\u200B-\u200D\uFEFF]/g);
if (invisibleChars) {
  console.log('⚠️  Found invisible characters:', invisibleChars.length);
} else {
  console.log('✓ No invisible characters found');
}

// Check encoding
const hasInvalidChars = /[^\x00-\x7F\u00A0-\uFFFF]/.test(content);
console.log(hasInvalidChars ? '⚠️  Invalid characters detected' : '✓ Character encoding looks good');

// Split content into lines for analysis
const lines = content.split('\n');
console.log(`\nTotal lines: ${lines.length}\n`);

// Stack-based HTML validation
const stack = [];
const angularControlFlow = [];
let errors = [];

// Angular control flow patterns
const angularIfStart = /@if\s*\(/;
const angularElse = /@else/;
const angularFor = /@for\s*\(/;
const angularClosing = /^\s*\}/;

// HTML tag patterns
const openTagPattern = /<([a-zA-Z][a-zA-Z0-9-]*)[^>]*?(?<!\/)>/g;
const closeTagPattern = /<\/([a-zA-Z][a-zA-Z0-9-]*)>/g;
const selfClosingPattern = /<([a-zA-Z][a-zA-Z0-9-]*)[^>]*?\/>/g;
const commentPattern = /<!--[\s\S]*?-->/g;

lines.forEach((line, index) => {
  const lineNum = index + 1;
  const trimmed = line.trim();

  // Skip comments
  const withoutComments = line.replace(commentPattern, '');

  // Track Angular control flow
  if (angularIfStart.test(trimmed)) {
    angularControlFlow.push({ type: '@if', line: lineNum, content: trimmed });
  } else if (angularFor.test(trimmed)) {
    angularControlFlow.push({ type: '@for', line: lineNum, content: trimmed });
  } else if (trimmed === '}') {
    if (angularControlFlow.length > 0) {
      angularControlFlow.pop();
    } else {
      errors.push({ line: lineNum, message: 'Closing } without matching @if/@for/@else' });
    }
  }

  // Remove self-closing tags first
  const withoutSelfClosing = withoutComments.replace(selfClosingPattern, '');

  // Find opening tags
  let match;
  const tempLine = withoutSelfClosing;
  const openMatches = [];
  const closeMatches = [];

  while ((match = openTagPattern.exec(tempLine)) !== null) {
    openMatches.push({ tag: match[1], line: lineNum, index: match.index });
  }

  openTagPattern.lastIndex = 0;

  while ((match = closeTagPattern.exec(tempLine)) !== null) {
    closeMatches.push({ tag: match[1], line: lineNum, index: match.index });
  }

  closeTagPattern.lastIndex = 0;

  // Process tags in order
  const allTags = [...openMatches.map(t => ({...t, type: 'open'})),
                   ...closeMatches.map(t => ({...t, type: 'close'}))]
    .sort((a, b) => a.index - b.index);

  allTags.forEach(tagInfo => {
    if (tagInfo.type === 'open') {
      stack.push({ tag: tagInfo.tag, line: lineNum });
    } else if (tagInfo.type === 'close') {
      if (stack.length === 0) {
        errors.push({ line: lineNum, message: `Closing tag </${tagInfo.tag}> without opening tag` });
      } else {
        const last = stack.pop();
        if (last.tag !== tagInfo.tag) {
          errors.push({
            line: lineNum,
            message: `Tag mismatch: expected </${last.tag}> but found </${tagInfo.tag}> (opened at line ${last.line})`
          });
          stack.push(last); // Push it back
        }
      }
    }
  });
});

// Report errors
console.log('=== Angular Control Flow ===');
if (angularControlFlow.length > 0) {
  console.log('⚠️  Unclosed Angular control flow blocks:');
  angularControlFlow.forEach(block => {
    console.log(`  Line ${block.line}: ${block.type} - ${block.content.substring(0, 60)}...`);
  });
} else {
  console.log('✓ All Angular control flow blocks properly closed');
}

console.log('\n=== HTML Tag Structure ===');
if (stack.length > 0) {
  console.log('⚠️  Unclosed HTML tags:');
  stack.forEach(item => {
    console.log(`  Line ${item.line}: <${item.tag}>`);
  });
} else {
  console.log('✓ All HTML tags properly closed');
}

console.log('\n=== Structural Errors ===');
if (errors.length > 0) {
  console.log('⚠️  Found errors:');
  errors.forEach(err => {
    console.log(`  Line ${err.line}: ${err.message}`);
  });
} else {
  console.log('✓ No structural errors detected');
}

// Check specific problem areas (lines 295-325 and 620-650)
console.log('\n=== Specific Problem Areas ===');
console.log('\nLines 295-325:');
lines.slice(294, 325).forEach((line, i) => {
  const lineNum = 295 + i;
  console.log(`${lineNum}: ${line}`);
});

console.log('\nLines 620-650:');
lines.slice(619, 650).forEach((line, i) => {
  const lineNum = 620 + i;
  console.log(`${lineNum}: ${line}`);
});

// Detailed character analysis of problem lines
console.log('\n=== Character-level Analysis of Line 301 ===');
if (lines[300]) {
  const line301 = lines[300];
  console.log('Content:', JSON.stringify(line301));
  console.log('Length:', line301.length);
  console.log('Char codes:', [...line301].map((c, i) => `${i}:${c.charCodeAt(0)}`).join(' '));
}

console.log('\n=== Character-level Analysis of Line 626 ===');
if (lines[625]) {
  const line626 = lines[625];
  console.log('Content:', JSON.stringify(line626));
  console.log('Length:', line626.length);
  console.log('Char codes:', [...line626].map((c, i) => `${i}:${c.charCodeAt(0)}`).join(' '));
}
