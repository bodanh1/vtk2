import fs from 'node:fs';import {execFileSync}from 'node:child_process';
// Count tracked production files using the repository's literal/prefix exclusions.
const patterns=fs.readFileSync('.assetsignore','utf8').split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
if(patterns.some(s=>/[?![]/.test(s)||s.includes('*')&&!s.endsWith('/**')))throw Error('Update budget matcher for new ignore pattern');
const files=execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split('\n').filter(f=>!patterns.some(p=>{const prefix=p.replace(/\/\*\*$/,'');return f===prefix||f.startsWith(prefix+'/');}));
console.log('Production static assets:',files.length,'/ 20000 (tracked files; generated Worker excluded)');
if(files.length>20000)throw Error('Workers Free asset limit exceeded: '+files.length);
if(files.length>19500)console.log('Asset budget is close to the limit; check before adding new sprite families.');
