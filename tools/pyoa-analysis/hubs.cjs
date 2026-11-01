const fs=require('fs');const b=JSON.parse(fs.readFileSync('src/data/pyoa/umbraBook.json','utf8'));
const N=new Map(b.nodes.map(n=>[n.id,n]));
const d=new Map([[b.startId,0]]);const qq=[b.startId];while(qq.length){const i=qq.shift();for(const e of N.get(i).exits)if(!d.has(e.to)){d.set(e.to,d.get(i)+1);qq.push(e.to)}}
const inDeg={};b.nodes.forEach(n=>n.exits.forEach(e=>inDeg[e.to]=(inDeg[e.to]||0)+1));
const t=process.argv[2];
const hubs=b.nodes.filter(n=>n.id.startsWith('up-'+t+'-')&&(inDeg[n.id]||0)>=5).sort((a,b2)=>d.get(a.id)-d.get(b2.id));
for(const n of hubs){console.log('\n##',n.id,'d='+d.get(n.id),'in='+inDeg[n.id],'|',n.page.slice(0,150));n.exits.forEach(e=>console.log('  -',e.label,'->',e.to,e.setFlags?JSON.stringify(e.setFlags):''))}

