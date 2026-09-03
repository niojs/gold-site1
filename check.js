const fs = require('fs');
const files = ['app/select-site/page.js', 'app/primary-data/page.js', 'app/dashboard/page.js'];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  c.split('\n').forEach((line, i) => {
    if (line.includes('driller')) {
      console.log(f + ':' + (i+1) + ': ' + line.trim());
    }
  });
});
