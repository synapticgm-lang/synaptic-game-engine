const ts=require('typescript');const fs=require('fs');const path=require('path');
const fields=process.argv[2].split(',');
const roots=['src'];const files=[];
(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()){if(!/node_modules|__tests__/.test(p))w(p);}else if(/\.tsx?$/.test(e.name)&&!/\.test\.tsx?$|\.d\.ts$/.test(e.name))files.push(p);}})('src');
const out={};for(const f of fields)out[f]=[];
for(const f of files){const text=fs.readFileSync(f,'utf8');const sf=ts.createSourceFile(f,text,ts.ScriptTarget.Latest,true);
const rec=(name,node,kind)=>{if(out[name]){const {line}=sf.getLineAndCharacterOfPosition(node.getStart());out[name].push(f.replace(/\\/g,'/')+':'+(line+1)+':'+kind);}};
(function v(n){
 if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsToken||ts.isBinaryExpression(n)&&n.operatorToken.kind>=ts.SyntaxKind.PlusEqualsToken&&n.operatorToken.kind<=ts.SyntaxKind.CaretEqualsToken){const l=n.left;if(ts.isPropertyAccessExpression(l))rec(l.name.text,n,'assign');else if(ts.isElementAccessExpression(l)&&ts.isStringLiteral(l.argumentExpression))rec(l.argumentExpression.text,n,'assign');}
 if(ts.isObjectLiteralExpression(n)){const hasSpread=n.properties.some(p=>ts.isSpreadAssignment(p));
  for(const p of n.properties){let nm=null;if(ts.isPropertyAssignment(p)||ts.isShorthandPropertyAssignment(p))nm=p.name.text;if(nm&&hasSpread)rec(nm,p,'patch');}}
 ts.forEachChild(n,v);})(sf);}
const res={};for(const f of fields){const hits=out[f];const fl=[...new Set(hits.map(h=>h.split(':')[0]))];res[f]={files:fl.length,hits:hits.length,list:hits};}
fs.writeFileSync(process.argv[3],JSON.stringify(res,null,1));
for(const f of fields)console.log(f.padEnd(22),'files',String(res[f].files).padStart(3),'hits',String(res[f].hits).padStart(3));
