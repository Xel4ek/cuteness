(()=>{"use strict";class C{constructor(t,l,h){this.route=t,this.distance=l,this.bitmask=h,this.left=null,this.right=null,this.npl=0}compareTo(t){return this.distance!==t.distance?this.distance-t.distance:t.route.length-this.route.length}}class F{constructor(t,l){this.vertices=t,this.distance=l,this.left=null,this.right=null,this.npl=0}compareTo(t){return this.distance!==t.distance?this.distance-t.distance:t.vertices.length-this.vertices.length}}class _{constructor(){this.size=0,this.root=null}enqueue(t){this.size++,this.root=this.merge(this.root,t)}dequeue(){if(this.isEmpty())return;const t=this.root;return this.root=this.merge(this.root.left,this.root.right),t}isEmpty(){return null===this.root}merge(t,l){return t?(l&&(t.compareTo(l)>0&&([t,l]=[l,t]),t.right=this.merge(t.right,l),(!t.left||t.left.npl<t.right.npl)&&([t.left,t.right]=[t.right,t.left]),t.npl=t.right?t.right.npl+1:1),t):l}}class k{static solveTravelingSalesmanProblemACO(t){const b=t.map(i=>i.map(o=>0===o?1/0:o)),T=1/(t.length*t.length),I=t.reduce((i,o)=>i+o.reduce((c,e)=>c+e,0),0),w=t.map(i=>i.map(o=>T/I*o)),y=(i,o)=>b[i][o];let M=1/0,S=[],z=[],A=0;for(let i=0;i<1e4;i++){const o=Array.from({length:100},()=>({path:[0],currentNode:0,cost:0}));if(o.forEach(e=>{A++;const s=new Set(e.path);for(;s.size<t.length;){const g=t[e.currentNode].map((u,p)=>p).filter(u=>!s.has(u)&&y(e.currentNode,u)),a=g.reduce((u,p)=>u+Math.pow(w[e.currentNode][p],1)*Math.pow(1/y(e.currentNode,p),1),0),m=g.map(u=>({dest:u,prob:Math.pow(w[e.currentNode][u],1)*Math.pow(1/y(e.currentNode,u),1)/a}));m.sort((u,p)=>p.prob-u.prob);const q=Math.random();let N=0,v=-1;for(const u of m)if(N+=u.prob,N>=q){v=u.dest;break}if(-1===v)break;e.path.push(v),e.currentNode=v,s.add(v),e.cost+=y(e.path[e.path.length-2],e.currentNode)}e.cost+=y(e.currentNode,0),e.cost<M&&e.path.length===t.length&&(M=e.cost,S=[...e.path,0])}),i%50==0&&z.toString()===S.toString()&&M<1/0)return{vertices:S,distance:M,paths:A};const c=o.map(e=>{const s=e.path,g=e.cost,a=Array.from({length:t.length},()=>0);for(let m=0;m<s.length-1;m++){const N=s[m+1];a[s[m]]+=100/g,a[N]+=100/g}return a});for(let e=0;e<t.length;e++)for(let s=0;s<t.length;s++)e!==s&&(w[e][s]=.5*w[e][s]+c[e][s]);z=S}return S.length===t.length&&isFinite(M)?{vertices:S,distance:M,paths:A}:null}static solveTravelingSalesmanProblemGA(t){const l=t.length,h=20*l,f=Math.trunc(1e5/l),d=Math.trunc(.1*h),n=t.map(i=>i.map(o=>0===o?1/0:o)),r=i=>{let o=0,c=0;for(let e=0;e<i.length;e++){const s=n[i[e]][i[(e+1)%i.length]];isFinite(1/0)||++o,c+=s}return 1/c/(o+1)},b=(i,o)=>{const c=[...i];if(Math.random()<o){let e=Math.floor(Math.random()*c.length),s=Math.floor(Math.random()*c.length);for(;e===s;)s=Math.floor(Math.random()*c.length);for(s<e&&([e,s]=[s,e]);e<s;)[c[e],c[s]]=[c[s],c[e]],e++,s--}return c},T=(i,o)=>{const c=i.length,e=new Array(c).fill(-1),s=Math.floor(Math.random()*c),g=s+Math.floor(Math.random()*(c-s));for(let a=s;a<=g;a++)e[a]=i[a];for(let a=0;a<c;a++)if(!e.includes(o[a])){let m=a;for(;-1!==e[m];)m=i.indexOf(o[m]);e[m]=o[a]}return e};let I=Array.from({length:h},()=>{const i=Array.from({length:l},(o,c)=>c);for(let o=i.length-1;o>0;o--){const c=Math.floor(Math.random()*(o+1));[i[o],i[c]]=[i[c],i[o]]}return i}),w=0,y=[],M=-1/0,S=0;for(let i=0;i<f;i++){let o=-1/0;I.sort((g,a)=>r(a)-r(g)),S+=I.length;const c=I.slice(0,d),e=[...c],s=(g,a)=>{const m=g.reduce((p,x)=>p+a(x),0),q=Math.random()*m;let v,u,N=0;for(const p of g)if(N+=a(p),!v&&N>=q)v=p;else if(v&&!u&&N>=q){u=p;break}if(!u){const p=g.filter(E=>E!==v);u=p[Math.floor(Math.random()*p.length)]}return[v,u]};for(let g=0;g<h-d;g++){let a=T(...s(c,r));a=b(a,.05),e.push(a);const m=r(a);m>o&&(o=m,y=a)}if(I=e,o>M)M=o,w=0;else if(o>0&&w++>=5)break}const A=(i=y).reduce((o,c,e)=>o+n[c][i[(e+1)%n.length]],0);var i;return isFinite(A)?{vertices:[...y,y[0]],distance:A,paths:S}:null}static solveTravelingSalesmanProblemBaB(t){const l=t.length,h=t.map(n=>n.map(r=>0===r?1/0:r)),f=new _,d=Math.trunc(Math.random()*t.length),P=new F([d],0);for(f.enqueue(P);!f.isEmpty();){const n=f.dequeue();if(n){if(n.vertices.length===l+1)return{vertices:n.vertices,distance:n.distance,paths:f.size};if(n.vertices.length===l&&h[n.vertices[n.vertices.length-1]][d]<1/0){const r=new F([...n.vertices,d],n.distance+h[n.vertices[n.vertices.length-1]][d]);f.enqueue(r)}else if(n.vertices.length<l)for(let r=0;r<l;r++)if(!n.vertices.includes(r)&&h[n.vertices[n.vertices.length-1]][r]<1/0){const b=new F([...n.vertices,r],n.distance+h[n.vertices[n.vertices.length-1]][r]);f.enqueue(b)}}}return null}static solveTravelingSalesmanProblemBaB32(t){const l=t.length,h=t.map(n=>n.map(r=>0===r?1/0:r)),f=new _,d=Math.trunc(Math.random()*t.length),P=new C(d.toString(32),0,1<<d);for(f.enqueue(P);!f.isEmpty();){const n=f.dequeue();if(n){if(n.route.length===l+1)return{vertices:n.route.split("").map(r=>parseInt(r,32)),distance:n.distance,paths:f.size};if(n.route.length===l){const r=parseInt(n.route.charAt(n.route.length-1),32);if(h[r][d]<1/0){const b=new C(n.route+d.toString(32),n.distance+h[r][d],n.bitmask|1<<d);f.enqueue(b)}}else for(let r=0;r<l;r++){const b=parseInt(n.route.charAt(n.route.length-1),32);if(!(n.bitmask&1<<r)&&h[b][r]<1/0){const T=n.route+r.toString(32),w=new C(T,n.distance+h[b][r],n.bitmask|1<<r);f.enqueue(w)}}}}return null}}const D={Ants:k.solveTravelingSalesmanProblemACO,BranchAndBound:k.solveTravelingSalesmanProblemBaB,Genetic:k.solveTravelingSalesmanProblemGA,BranchAndBound32:k.solveTravelingSalesmanProblemBaB32};self.onmessage=({data:B})=>{const{method:t,adjacencyMatrix:l}=B,h=D[t];if(h){const f=performance.now(),d=h(l),n=performance.now()-f;self.postMessage({solution:d,timeElapsed:n})}else console.error(`Unknown method: ${t}`)}})();