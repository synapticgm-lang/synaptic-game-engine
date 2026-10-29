const fs=require('fs'),path=require('path');
function res(from,spec){let b;if(spec.startsWith('@/'))b=path.join('src',spec.slice(2));else if(spec.startsWith('.'))b=path.resolve(path.dirname(from),spec);else return null;for(const c of [b+'.ts',b+'.tsx',path.join(b,'index.ts'),b]){if(fs.existsSync(c)&&fs.statSync(c).isFile())return path.resolve(c);}return null;}
const cache={};function deps(f){if(cache[f])return cache[f];const t=fs.readFileSync(f,'utf8');const out=[];const re=/(?:import|export)\s+(?!type\b)(?:[^'"`;]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;let m;while(m=re.exec(t)){const r=res(f,m[1]||m[2]);if(r&&/\.tsx?$/.test(r))out.push(r);}return cache[f]=out;}
function reach(e){const seen=new Set();const st=[path.resolve(e)];while(st.length){const f=st.pop();if(seen.has(f))continue;seen.add(f);for(const d of deps(f))st.push(d);}return seen;}
const U=reach('src/game/useGame.ts'),F=reach('src/game/fateAutoplay.ts');
const rel=f=>path.relative(path.resolve('src/game'),f).replace(/\\/g,'/');
const onlyU=[...U].filter(f=>!F.has(f)&&f.includes(path.sep+'game'+path.sep)).map(rel).sort();
const onlyF=[...F].filter(f=>!U.has(f)).map(rel).sort();
console.log('useGame reach',U.size,'fate reach',F.size);console.log('ONLY live ('+onlyU.length+'):\n'+onlyU.join(', '));console.log('ONLY harness ('+onlyF.length+'):\n'+onlyF.join(', '));
