const fs=require('fs');const b=JSON.parse(fs.readFileSync('src/data/pyoa/umbraBook.json','utf8'));
const N=new Map(b.nodes.map(n=>[n.id,n]));
const show=id=>{const n=N.get(id);console.log('\n##',id,'|',n.page);n.exits.forEach(e=>console.log('  -',e.id,'|',e.label,'->',e.to,e.setFlags?JSON.stringify(e.setFlags):''))};
['up-bell-tower','up-bell-body','up-bell-leaf','up-bell-harness','up-w-street-choice','up-w-recognizer','up-w-undervault-stair','up-w-vault-floor','up-w-faction-summons','up-w-press-run','up-w-brazier','up-w-harbor-crown','up-w-final-choice'].forEach(show);
