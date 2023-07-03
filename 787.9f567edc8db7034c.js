(()=>{"use strict";var u,M,m,f,L={8787:(u,M,m)=>{m.a(u,async(f,R)=>{try{var g=m(791),w=m(1506),S=f([w]);w=(S.then?(await S)():S)[0];const t={Ants:g.v.solveTravelingSalesmanProblemACO,Genetic:g.v.solveTravelingSalesmanProblemGA,Little:g.v.solveTravelingSalesmanProblemLittle,LittleWASM:n=>{try{const r=JSON.parse((0,w.Nb)(JSON.stringify({data:n})));return{vertices:r.path,distance:r.distance,paths:r.steps}}catch{return null}}};self.onmessage=({data:n})=>{const{method:r,adjacencyMatrix:i}=n,a=t[r];if(a){const y=performance.now(),d=a(i),v=performance.now()-y;self.postMessage({solution:d,timeElapsed:v})}else console.error(`Unknown method: ${r}`)},R()}catch(t){R(t)}})},791:(u,M,m)=>{m.d(M,{v:()=>w});class f{static rowReduction(t){const n=[],r=t.map(i=>{const a=Math.min(...i);return n.push(a),i.map(y=>y!==1/0?y-a:y)});return{redux:n,matrix:r}}static columnReduction(t){const n=t.map((a,y)=>t.map(d=>d[y])),r=f.rowReduction(n),i=r.matrix[0].map((a,y)=>r.matrix.map(d=>d[y]));return{redux:r.redux,matrix:i}}static reduceMatrix(t){const n=f.rowReduction(t),r=f.columnReduction(n.matrix);return{matrix:r.matrix,lowerBound:[...n.redux,...r.redux].reduce((i,a)=>i+a,0)}}get valid(){return this.lowerBound!==1/0}get distance(){return this.lowerBound}constructor(t,n=0,r={rows:Array.from({length:t.length}).map((a,y)=>y),cols:Array.from({length:t.length}).map((a,y)=>y)},i=[]){this.matrix=t,this.lowerBound=n,this.indexes=r,this.path=i}isScalar(){return 1===this.matrix.length}compareTo(t){return this.lowerBound-t.lowerBound}restorePath(){const t=[],n=[...this.path,[this.indexes.rows[0],this.indexes.cols[0]]];let r=n.shift()??[-1,-1];for(t.push(r[0]);n.length>0;){const i=n.findIndex(a=>a[0]===r[1]);if(-1===i)break;r=n[i],n.splice(i,1),t.push(r[0])}return t.push(r[1]),t}dryReduceMatrix(t,n,r){this.blockPath(t,n),this.lowerBound+=r;const{matrix:i}=f.reduceMatrix(this.matrix);this.matrix=i}transform(t,n){const r=this.indexes.rows.indexOf(t),i=this.indexes.cols.indexOf(n),a=this.matrix.map(I=>[...I]),y=this.indexes.cols.indexOf(t),d=this.indexes.rows.indexOf(n);-1!==y&&-1!==d&&(a[d][y]=1/0);const p=a.filter((I,P)=>P!==r).map(I=>I.filter((P,l)=>l!==i)),{matrix:v,lowerBound:C}=f.reduceMatrix(p);return new f(v,this.lowerBound+C,{rows:this.indexes.rows.filter((I,P)=>P!==r),cols:this.indexes.cols.filter((I,P)=>P!==i)},[...this.path,[t,n]])}calculatePenalties(){let n,t=-1/0;const r=Array(this.matrix.length).fill(0).map(()=>Array(this.matrix.length).fill(0));for(let i=0;i<this.matrix.length;i++)for(let a=0;a<this.matrix[i].length;a++)if(0===this.matrix[i][a]){const y=Math.min(...this.matrix[i].filter((p,v)=>v!==a&&p!==1/0)),d=Math.min(...this.matrix.map((p,v)=>v!==i&&p[a]!==1/0?p[a]:1/0));r[i][a]=y+d,r[i][a]>=t&&(t=r[i][a],n=[i,a])}return n?{penalty:t,maxPenaltyPos:[this.indexes.rows[n[0]],this.indexes.cols[n[1]]]}:{penalty:-1,maxPenaltyPos:[-1,-1]}}blockPath(t,n){const r=this.indexes.rows.indexOf(t),i=this.indexes.cols.indexOf(n);-1!==i&&-1!==r&&(this.matrix[r][i]=1/0)}}class R{constructor(t){this.value=t,this.left=null,this.right=null,this.npl=0}compareTo(t){return this.value.compareTo(t.value)}}class g{constructor(){this.root=null}enqueue(t){this.root=this.merge(this.root,new R(t))}dequeue(){if(!this.root)return;const t=this.root.value;return this.root=this.merge(this.root.left,this.root.right),t}isEmpty(){return null===this.root}merge(t,n){return t?(n&&(t.compareTo(n)>0&&([t,n]=[n,t]),t.right=this.merge(t.right,n),(!t.left||t.right&&t.left.npl<t.right.npl)&&([t.left,t.right]=[t.right,t.left]),t.npl=t.right?t.right.npl+1:1),t):n}}class w{static solveTravelingSalesmanProblemACO(t){const n=10*t.length,v=t.map(s=>s.map(o=>0===o?1/0:o)),C=1/(t.length*t.length),I=t.reduce((s,o)=>s+o.reduce((c,e)=>c+e,0),0),P=t.map(s=>s.map(o=>C/I*o)),l=(s,o)=>v[s][o];let h=1/0,N=[],B=[],k=0;for(let s=0;s<1e4;s++){const o=Array.from({length:n},()=>({path:[0],currentNode:0,cost:0}));if(o.forEach(e=>{k++;const x=new Set(e.path);for(;x.size<t.length;){const j=t[e.currentNode].map((T,F)=>F).filter(T=>!x.has(T)&&l(e.currentNode,T)),b=j.reduce((T,F)=>T+Math.pow(P[e.currentNode][F],1)*Math.pow(1/l(e.currentNode,F),1),0),A=j.map(T=>({dest:T,prob:Math.pow(P[e.currentNode][T],1)*Math.pow(1/l(e.currentNode,T),1)/b}));A.sort((T,F)=>F.prob-T.prob);const E=Math.random();let z=0,Q=-1;for(const T of A)if(z+=T.prob,z>=E){Q=T.dest;break}if(-1===Q)break;e.path.push(Q),e.currentNode=Q,x.add(Q),e.cost+=l(e.path[e.path.length-2],e.currentNode)}e.cost+=l(e.currentNode,0),e.cost<h&&e.path.length===t.length&&(h=e.cost,N=[...e.path,0])}),s%50==0&&B.toString()===N.toString()&&h<1/0)return{vertices:N,distance:h,paths:k};const c=o.map(e=>{const x=e.path,j=e.cost,b=Array.from({length:t.length},()=>0);for(let A=0;A<x.length-1;A++){const z=x[A+1];b[x[A]]+=100/j,b[z]+=100/j}return b});for(let e=0;e<t.length;e++)for(let x=0;x<t.length;x++)e!==x&&(P[e][x]=.5*P[e][x]+c[e][x]);B=N}return N.length===t.length&&isFinite(h)?{vertices:N,distance:h,paths:k}:null}static solveTravelingSalesmanProblemGA(t){const n=t.length,r=20*n,i=Math.trunc(1e5/n),a=Math.trunc(.1*r),d=t.map(s=>s.map(o=>0===o?1/0:o)),p=s=>{let o=0,c=0;for(let e=0;e<s.length;e++){const x=d[s[e]][s[(e+1)%s.length]];isFinite(1/0)||++o,c+=x}return 1/c/(o+1)},v=(s,o)=>{const c=[...s];if(Math.random()<o){let e=Math.floor(Math.random()*c.length),x=Math.floor(Math.random()*c.length);for(;e===x;)x=Math.floor(Math.random()*c.length);for(x<e&&([e,x]=[x,e]);e<x;)[c[e],c[x]]=[c[x],c[e]],e++,x--}return c},C=(s,o)=>{const c=s.length,e=new Array(c).fill(-1),x=Math.floor(Math.random()*c),j=x+Math.floor(Math.random()*(c-x));for(let b=x;b<=j;b++)e[b]=s[b];for(let b=0;b<c;b++)if(!e.includes(o[b])){let A=b;for(;-1!==e[A];)A=s.indexOf(o[A]);e[A]=o[b]}return e};let I=Array.from({length:r},()=>{const s=Array.from({length:n},(o,c)=>c);for(let o=s.length-1;o>0;o--){const c=Math.floor(Math.random()*(o+1));[s[o],s[c]]=[s[c],s[o]]}return s}),P=0,l=[],h=-1/0,N=0;for(let s=0;s<i;s++){let o=-1/0;I.sort((j,b)=>p(b)-p(j)),N+=I.length;const c=I.slice(0,a),e=[...c],x=(j,b)=>{const A=j.reduce((F,J)=>F+b(J),0),E=Math.random()*A;let Q,T,z=0;for(const F of j)if(z+=b(F),!Q&&z>=E)Q=F;else if(Q&&!T&&z>=E){T=F;break}if(!T){const F=j.filter(V=>V!==Q);T=F[Math.floor(Math.random()*F.length)]}return[Q,T]};for(let j=0;j<r-a;j++){let b=C(...x(c,p));b=v(b,.05),e.push(b);const A=p(b);A>o&&(o=A,l=b)}if(I=e,o>h)h=o,P=0;else if(o>0&&P++>=5)break}const k=(s=l).reduce((o,c,e)=>o+d[c][s[(e+1)%d.length]],0);var s;return isFinite(k)?{vertices:[...l,l[0]],distance:k,paths:N}:null}static solveTravelingSalesmanProblemLittle(t){let n=0;const r=t.map(d=>d.map(p=>0===p?1/0:p)),i=new g,{matrix:a,lowerBound:y}=f.reduceMatrix(r);for(i.enqueue(new f(a,y));!i.isEmpty();){const d=i.dequeue();if(!d||!d.valid)return null;if(d.isScalar()){const I=d.restorePath();if(I.length===t.length+1)return{vertices:I,distance:d.distance,paths:n};continue}const{penalty:p,maxPenaltyPos:[v,C]}=d.calculatePenalties();if(-1===p)return null;i.enqueue(d.transform(v,C)),p!==1/0&&(d.dryReduceMatrix(v,C,p),i.enqueue(d)),n++}return null}}},1506:(u,M,m)=>{m.a(u,async(f,R)=>{try{m.d(M,{Nb:()=>w.Nb});var g=m(1556),w=m(6780),S=f([g]);g=(S.then?(await S)():S)[0],(0,w.oT)(g),R()}catch(t){R(t)}})},6780:(u,M,m)=>{let f;function R(l){f=l}m.d(M,{Ed:()=>P,Nb:()=>I,oT:()=>R}),u=m.hmd(u);let w=new(typeof TextDecoder>"u"?(0,u.require)("util").TextDecoder:TextDecoder)("utf-8",{ignoreBOM:!0,fatal:!0});w.decode();let S=null;function t(){return(null===S||0===S.byteLength)&&(S=new Uint8Array(f.memory.buffer)),S}function n(l,h){return l>>>=0,w.decode(t().subarray(l,l+h))}let r=0,a=new(typeof TextEncoder>"u"?(0,u.require)("util").TextEncoder:TextEncoder)("utf-8");const y="function"==typeof a.encodeInto?function(l,h){return a.encodeInto(l,h)}:function(l,h){const N=a.encode(l);return h.set(N),{read:l.length,written:N.length}};let v=null;function C(){return(null===v||0===v.byteLength)&&(v=new Int32Array(f.memory.buffer)),v}function I(l){let h,N;try{const s=f.__wbindgen_add_to_stack_pointer(-16),o=function d(l,h,N){if(void 0===N){const c=a.encode(l),e=h(c.length,1)>>>0;return t().subarray(e,e+c.length).set(c),r=c.length,e}let B=l.length,k=h(B,1)>>>0;const s=t();let o=0;for(;o<B;o++){const c=l.charCodeAt(o);if(c>127)break;s[k+o]=c}if(o!==B){0!==o&&(l=l.slice(o)),k=N(k,B,B=o+3*l.length,1)>>>0;const c=t().subarray(k+o,k+B);o+=y(l,c).written}return r=o,k}(l,f.__wbindgen_malloc,f.__wbindgen_realloc);f.solve_traveling_salesman_problem_little_js(s,o,r);var B=C()[s/4+0],k=C()[s/4+1];return h=B,N=k,n(B,k)}finally{f.__wbindgen_add_to_stack_pointer(16),f.__wbindgen_free(h,N,1)}}function P(l,h){alert(n(l,h))}},1556:(u,M,m)=>{var f=m(6780);u.exports=m.v(M,u.id,"9a1d24ad9fc7c21d",{"./graph_algorims_bg.js":{__wbg_alert_2835ba22f9dbd362:f.Ed}})}},W={};function O(u){var M=W[u];if(void 0!==M)return M.exports;var m=W[u]={id:u,loaded:!1,exports:{}};return L[u](m,m.exports,O),m.loaded=!0,m.exports}u="function"==typeof Symbol?Symbol("webpack queues"):"__webpack_queues__",M="function"==typeof Symbol?Symbol("webpack exports"):"__webpack_exports__",m="function"==typeof Symbol?Symbol("webpack error"):"__webpack_error__",f=g=>{g&&!g.d&&(g.d=1,g.forEach(w=>w.r--),g.forEach(w=>w.r--?w.r++:w()))},O.a=(g,w,S)=>{var t;S&&((t=[]).d=1);var i,a,y,n=new Set,r=g.exports,d=new Promise((p,v)=>{y=v,a=p});d[M]=r,d[u]=p=>(t&&p(t),n.forEach(p),d.catch(v=>{})),g.exports=d,w(p=>{i=(g=>g.map(w=>{if(null!==w&&"object"==typeof w){if(w[u])return w;if(w.then){var S=[];S.d=0,w.then(r=>{t[M]=r,f(S)},r=>{t[m]=r,f(S)});var t={};return t[u]=r=>r(S),t}}var n={};return n[u]=r=>{},n[M]=w,n}))(p);var v,C=()=>i.map(P=>{if(P[m])throw P[m];return P[M]}),I=new Promise(P=>{(v=()=>P(C)).r=0;var l=h=>h!==t&&!n.has(h)&&(n.add(h),h&&!h.d&&(v.r++,h.push(v)));i.map(h=>h[u](l))});return v.r?I:C()},p=>(p?y(d[m]=p):a(r),f(t))),t&&(t.d=0)},O.d=(u,M)=>{for(var m in M)O.o(M,m)&&!O.o(u,m)&&Object.defineProperty(u,m,{enumerable:!0,get:M[m]})},O.hmd=u=>((u=Object.create(u)).children||(u.children=[]),Object.defineProperty(u,"exports",{enumerable:!0,set:()=>{throw new Error("ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: "+u.id)}}),u),O.o=(u,M)=>Object.prototype.hasOwnProperty.call(u,M),O.v=(u,M,m,f)=>{var R=fetch(O.p+""+m+".module.wasm");return"function"==typeof WebAssembly.instantiateStreaming?WebAssembly.instantiateStreaming(R,f).then(g=>Object.assign(u,g.instance.exports)):R.then(g=>g.arrayBuffer()).then(g=>WebAssembly.instantiate(g,f)).then(g=>Object.assign(u,g.instance.exports))},O.p="",O(8787)})();