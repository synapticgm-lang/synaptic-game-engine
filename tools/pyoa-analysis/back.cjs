const fs=require('fs');const b=JSON.parse(fs.readFileSync('src/data/pyoa/umbraBook.json','utf8'));
const N=new Map(b.nodes.map(n=>[n.id,n]));
const d=new Map([[b.startId,0]]);const qq=[b.startId];while(qq.length){const i=qq.shift();for(const e of N.get(i).exits)if(!d.has(e.to)){d.set(e.to,d.get(i)+1);qq.push(e.to)}}
let back=[];for(const n of b.nodes)for(const e of n.exits){if(d.get(e.to)<d.get(n.id)-2)back.push(n.id+'('+d.get(n.id)+')->'+e.to+'('+d.get(e.to)+') ['+e.label+']')}
console.log('back edges',back.length);console.log(back.slice(0,40).join('\n'));
// cross-track edges
const tr=id=>id.startsWith('up-w-')?'w':id.startsWith('up-l-')?'l':id.startsWith('up-r-')?'r':id.startsWith('up-end')?'E':'B';
const cross={};for(const n of b.nodes)for(const e of n.exits){const k=tr(n.id)+'>'+tr(e.to);cross[k]=(cross[k]||0)+1}console.log(cross);
