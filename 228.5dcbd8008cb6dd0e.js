(()=>{"use strict";class P{static rowReduction(t){const n=[],i=t.map(o=>{const l=Math.min(...o);return n.push(l),o.map(d=>d!==1/0?d-l:d)});return{redux:n,matrix:i}}static columnReduction(t){const n=t.map((l,d)=>t.map(u=>u[d])),i=P.rowReduction(n),o=i.matrix[0].map((l,d)=>i.matrix.map(u=>u[d]));return{redux:i.redux,matrix:o}}static reduceMatrix(t){const n=P.rowReduction(t),i=P.columnReduction(n.matrix);return{matrix:i.matrix,lowerBound:[...n.redux,...i.redux].reduce((o,l)=>o+l,0)}}get valid(){return this.lowerBound!==1/0}get distance(){return this.lowerBound}constructor(t,n=0,i={rows:Array.from({length:t.length}).map((l,d)=>d),cols:Array.from({length:t.length}).map((l,d)=>d)},o=[]){this.matrix=t,this.lowerBound=n,this.indexes=i,this.path=o}isScalar(){return 1===this.matrix.length}compareTo(t){return this.lowerBound-t.lowerBound}restorePath(){const t=[],n=[...this.path,[this.indexes.rows[0],this.indexes.cols[0]]];let i=n.shift()??[-1,-1];for(t.push(i[0]);n.length>0;){const o=n.findIndex(l=>l[0]===i[1]);if(-1===o)break;i=n[o],n.splice(o,1),t.push(i[0])}return t.push(i[1]),t}dryReduceMatrix(t,n,i){this.blockPath(t,n),this.lowerBound+=i;const{matrix:o}=P.reduceMatrix(this.matrix);this.matrix=o}transform(t,n){const i=this.indexes.rows.indexOf(t),o=this.indexes.cols.indexOf(n),l=this.matrix.map(x=>[...x]),d=this.indexes.cols.indexOf(t),u=this.indexes.rows.indexOf(n);-1!==d&&-1!==u&&(l[u][d]=1/0);const m=l.filter((x,y)=>y!==i).map(x=>x.filter((y,v)=>v!==o)),{matrix:M,lowerBound:A}=P.reduceMatrix(m);return new P(M,this.lowerBound+A,{rows:this.indexes.rows.filter((x,y)=>y!==i),cols:this.indexes.cols.filter((x,y)=>y!==o)},[...this.path,[t,n]])}calculatePenalties(){let n,t=-1/0;const i=Array(this.matrix.length).fill(0).map(()=>Array(this.matrix.length).fill(0));for(let o=0;o<this.matrix.length;o++)for(let l=0;l<this.matrix[o].length;l++)if(0===this.matrix[o][l]){const d=Math.min(...this.matrix[o].filter((m,M)=>M!==l&&m!==1/0)),u=Math.min(...this.matrix.map((m,M)=>M!==o&&m[l]!==1/0?m[l]:1/0));i[o][l]=d+u,i[o][l]>=t&&(t=i[o][l],n=[o,l])}return n?{penalty:t,maxPenaltyPos:[this.indexes.rows[n[0]],this.indexes.cols[n[1]]]}:{penalty:-1,maxPenaltyPos:[-1,-1]}}blockPath(t,n){const i=this.indexes.rows.indexOf(t),o=this.indexes.cols.indexOf(n);-1!==o&&-1!==i&&(this.matrix[i][o]=1/0)}}class F{constructor(t){this.value=t,this.left=null,this.right=null,this.npl=0}compareTo(t){return this.value.compareTo(t.value)}}class _{constructor(){this.root=null}enqueue(t){this.root=this.merge(this.root,new F(t))}dequeue(){if(!this.root)return;const t=this.root.value;return this.root=this.merge(this.root.left,this.root.right),t}isEmpty(){return null===this.root}merge(t,n){return t?(n&&(t.compareTo(n)>0&&([t,n]=[n,t]),t.right=this.merge(t.right,n),(!t.left||t.right&&t.left.npl<t.right.npl)&&([t.left,t.right]=[t.right,t.left]),t.npl=t.right?t.right.npl+1:1),t):n}}class k{static solveTravelingSalesmanProblemACO(t){const n=10*t.length,M=t.map(s=>s.map(r=>0===r?1/0:r)),A=1/(t.length*t.length),x=t.reduce((s,r)=>s+r.reduce((c,e)=>c+e,0),0),y=t.map(s=>s.map(r=>A/x*r)),v=(s,r)=>M[s][r];let I=1/0,S=[],B=[],C=0;for(let s=0;s<1e4;s++){const r=Array.from({length:n},()=>({path:[0],currentNode:0,cost:0}));if(r.forEach(e=>{C++;const a=new Set(e.path);for(;a.size<t.length;){const g=t[e.currentNode].map((f,w)=>w).filter(f=>!a.has(f)&&v(e.currentNode,f)),h=g.reduce((f,w)=>f+Math.pow(y[e.currentNode][w],1)*Math.pow(1/v(e.currentNode,w),1),0),p=g.map(f=>({dest:f,prob:Math.pow(y[e.currentNode][f],1)*Math.pow(1/v(e.currentNode,f),1)/h}));p.sort((f,w)=>w.prob-f.prob);const R=Math.random();let N=0,b=-1;for(const f of p)if(N+=f.prob,N>=R){b=f.dest;break}if(-1===b)break;e.path.push(b),e.currentNode=b,a.add(b),e.cost+=v(e.path[e.path.length-2],e.currentNode)}e.cost+=v(e.currentNode,0),e.cost<I&&e.path.length===t.length&&(I=e.cost,S=[...e.path,0])}),s%50==0&&B.toString()===S.toString()&&I<1/0)return{vertices:S,distance:I,paths:C};const c=r.map(e=>{const a=e.path,g=e.cost,h=Array.from({length:t.length},()=>0);for(let p=0;p<a.length-1;p++){const N=a[p+1];h[a[p]]+=100/g,h[N]+=100/g}return h});for(let e=0;e<t.length;e++)for(let a=0;a<t.length;a++)e!==a&&(y[e][a]=.5*y[e][a]+c[e][a]);B=S}return S.length===t.length&&isFinite(I)?{vertices:S,distance:I,paths:C}:null}static solveTravelingSalesmanProblemGA(t){const n=t.length,i=20*n,o=Math.trunc(1e5/n),l=Math.trunc(.1*i),u=t.map(s=>s.map(r=>0===r?1/0:r)),m=s=>{let r=0,c=0;for(let e=0;e<s.length;e++){const a=u[s[e]][s[(e+1)%s.length]];isFinite(1/0)||++r,c+=a}return 1/c/(r+1)},M=(s,r)=>{const c=[...s];if(Math.random()<r){let e=Math.floor(Math.random()*c.length),a=Math.floor(Math.random()*c.length);for(;e===a;)a=Math.floor(Math.random()*c.length);for(a<e&&([e,a]=[a,e]);e<a;)[c[e],c[a]]=[c[a],c[e]],e++,a--}return c},A=(s,r)=>{const c=s.length,e=new Array(c).fill(-1),a=Math.floor(Math.random()*c),g=a+Math.floor(Math.random()*(c-a));for(let h=a;h<=g;h++)e[h]=s[h];for(let h=0;h<c;h++)if(!e.includes(r[h])){let p=h;for(;-1!==e[p];)p=s.indexOf(r[p]);e[p]=r[h]}return e};let x=Array.from({length:i},()=>{const s=Array.from({length:n},(r,c)=>c);for(let r=s.length-1;r>0;r--){const c=Math.floor(Math.random()*(r+1));[s[r],s[c]]=[s[c],s[r]]}return s}),y=0,v=[],I=-1/0,S=0;for(let s=0;s<o;s++){let r=-1/0;x.sort((g,h)=>m(h)-m(g)),S+=x.length;const c=x.slice(0,l),e=[...c],a=(g,h)=>{const p=g.reduce((w,O)=>w+h(O),0),R=Math.random()*p;let b,f,N=0;for(const w of g)if(N+=h(w),!b&&N>=R)b=w;else if(b&&!f&&N>=R){f=w;break}if(!f){const w=g.filter(j=>j!==b);f=w[Math.floor(Math.random()*w.length)]}return[b,f]};for(let g=0;g<i-l;g++){let h=A(...a(c,m));h=M(h,.05),e.push(h);const p=m(h);p>r&&(r=p,v=h)}if(x=e,r>I)I=r,y=0;else if(r>0&&y++>=5)break}const C=(s=v).reduce((r,c,e)=>r+u[c][s[(e+1)%u.length]],0);var s;return isFinite(C)?{vertices:[...v,v[0]],distance:C,paths:S}:null}static solveTravelingSalesmanProblemLittle(t){let n=0;const i=t.map(u=>u.map(m=>0===m?1/0:m)),o=new _,{matrix:l,lowerBound:d}=P.reduceMatrix(i);for(o.enqueue(new P(l,d));!o.isEmpty();){const u=o.dequeue();if(!u||!u.valid)return null;if(u.isScalar()){const x=u.restorePath();if(x.length===t.length+1)return{vertices:x,distance:u.distance,paths:n};continue}const{penalty:m,maxPenaltyPos:[M,A]}=u.calculatePenalties();if(-1===m)return null;o.enqueue(u.transform(M,A)),m!==1/0&&(u.dryReduceMatrix(M,A,m),o.enqueue(u)),n++}return null}}const q={Ants:k.solveTravelingSalesmanProblemACO,Genetic:k.solveTravelingSalesmanProblemGA,Little:k.solveTravelingSalesmanProblemLittle};self.onmessage=({data:T})=>{const{method:t,adjacencyMatrix:n}=T,i=q[t];if(i){const o=performance.now(),l=i(n),u=performance.now()-o;self.postMessage({solution:l,timeElapsed:u})}else console.error(`Unknown method: ${t}`)}})();