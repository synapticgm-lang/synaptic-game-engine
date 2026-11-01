const fs=require('fs');
const b=JSON.parse(fs.readFileSync(process.argv[2]||'src/data/pyoa/umbraBook.json','utf8'));
const N=new Map(b.nodes.map(n=>[n.id,n]));
const FL=['sable','cover','witness','faceKnown','vault','cabal','valerius','rigg','ledger'];
// abstract reachability: per node, per flag, set of possible values ('_' = unset)
const poss=new Map();const get=id=>{if(!poss.has(id))poss.set(id,Object.fromEntries(FL.map(f=>[f,new Set()])));return poss.get(id)};
// state-set propagation with full states limited: use per-flag independent sets (over-approx)
// plus exact distinct-state count via BFS capped
var seen=new Set([b.startId]);const q=[];const start=b.startId;const s0=get(start);FL.forEach(f=>s0[f].add('_'));q.push(start);
while(q.length){const id=q.shift();const n=N.get(id);const cur=get(id);
 for(const e of n.exits){const t=get(e.to);let changed=false;
  for(const f of FL){const vals=e.setFlags&&f in e.setFlags?[String(e.setFlags[f])]:[...cur[f]];
   for(const v of vals){if(!t[f].has(v)){t[f].add(v);changed=true}}}
  if(changed||!seen.has(e.to)){seen.add(e.to);q.push(e.to)}}}

const prefix=id=>id.split('-').slice(0,2).join('-');
const pc={};b.nodes.forEach(n=>{const p=prefix(n.id);pc[p]=(pc[p]||0)+1});console.log('prefix counts',JSON.stringify(pc));
const inDeg={};b.nodes.forEach(n=>n.exits.forEach(e=>inDeg[e.to]=(inDeg[e.to]||0)+1));
const hubs=b.nodes.filter(n=>(inDeg[n.id]||0)>=3).map(n=>n.id+'('+inDeg[n.id]+')');console.log('hubs in>=3:',hubs.length,hubs.slice(0,40).join(' '));
// per flag: count of nodes where flag has >=2 possible values (excluding only '_')
for(const f of FL){let multi=0,set=0,ex=[];for(const[id,p] of poss){const v=[...p[f]];if(v.length>=2&&!(v.length==1)){multi++;if(ex.length<6)ex.push(id+':'+v.join('/'))}}
 console.log(f,'nodes with >=2 possible values:',multi,'| e.g.',ex.join(' ; '))}
fs.writeFileSync('tools/pyoa-analysis/umbra-flag-possibilities.json',JSON.stringify([...poss].map(([id,p])=>({id,...Object.fromEntries(FL.map(f=>[f,[...p[f]]]))}))));
// endings reach by id
const endIn={};b.nodes.forEach(n=>n.exits.forEach(e=>{if(N.get(e.to).endingId)(endIn[e.to]??=[]).push(n.id)}));console.log('endings in-edges:',JSON.stringify(Object.fromEntries(Object.entries(endIn).map(([k,v])=>[k,v.length]))));
// longest/shortest depth
const d=new Map([[start,0]]);const qq=[start];while(qq.length){const i=qq.shift();for(const e of N.get(i).exits)if(!d.has(e.to)){d.set(e.to,d.get(i)+1);qq.push(e.to)}}
console.log('bfs depth max',Math.max(...d.values()));
const depthBy={};for(const[id,x] of d){depthBy[x]=(depthBy[x]||0)+1}console.log(JSON.stringify(depthBy));

