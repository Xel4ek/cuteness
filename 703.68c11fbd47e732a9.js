(()=>{"use strict";var t,o,e,s,k={9703:(t,o,e)=>{e.a(t,async(s,i)=>{try{var r=e(136),a=s([r]);r=(a.then?(await a)():a)[0],addEventListener("message",({data:n})=>{const c=(0,r.l)(n.canvasWidth,n.canvasHeight,1,n.fractalX,n.fractalY);postMessage(c)}),i()}catch(n){i(n)}})},136:(t,o,e)=>{e.a(t,async(s,i)=>{try{e.d(o,{l:()=>a.l});var r=e(7355),a=e(2934),n=s([r]);r=(n.then?(await n)():n)[0],(0,a.o)(r),i()}catch(c){i(c)}})},2934:(t,o,e)=>{let s;function i(u){s=u}e.d(o,{l:()=>v,o:()=>i});let r=null;function a(){return(null===r||0===r.byteLength)&&(r=new Int32Array(s.memory.buffer)),r}let n=null;function v(u,w,d,h,f){try{const y=s.__wbindgen_add_to_stack_pointer(-16);s.renderMandelbrot(y,u,w,d,h,f);var l=a()[y/4+0],x=a()[y/4+1],g=function b(u,w){return u>>>=0,function c(){return(null===n||0===n.byteLength)&&(n=new Uint8Array(s.memory.buffer)),n}().subarray(u/1,u/1+w)}(l,x).slice();return s.__wbindgen_free(l,1*x),g}finally{s.__wbindgen_add_to_stack_pointer(16)}}},7355:(t,o,e)=>{t.exports=e.v(o,t.id,"8e8e3efb09593641")}},S={};function m(t){var o=S[t];if(void 0!==o)return o.exports;var e=S[t]={id:t,exports:{}};return k[t](e,e.exports,m),e.exports}t="function"==typeof Symbol?Symbol("webpack queues"):"__webpack_queues__",o="function"==typeof Symbol?Symbol("webpack exports"):"__webpack_exports__",e="function"==typeof Symbol?Symbol("webpack error"):"__webpack_error__",s=r=>{r&&!r.d&&(r.d=1,r.forEach(a=>a.r--),r.forEach(a=>a.r--?a.r++:a()))},m.a=(r,a,n)=>{var c;n&&((c=[]).d=1);var u,w,d,b=new Set,v=r.exports,h=new Promise((f,l)=>{d=l,w=f});h[o]=v,h[t]=f=>(c&&f(c),b.forEach(f),h.catch(l=>{})),r.exports=h,a(f=>{u=(r=>r.map(a=>{if(null!==a&&"object"==typeof a){if(a[t])return a;if(a.then){var n=[];n.d=0,a.then(v=>{c[o]=v,s(n)},v=>{c[e]=v,s(n)});var c={};return c[t]=v=>v(n),c}}var b={};return b[t]=v=>{},b[o]=a,b}))(f);var l,x=()=>u.map(y=>{if(y[e])throw y[e];return y[o]}),g=new Promise(y=>{(l=()=>y(x)).r=0;var Q=p=>p!==c&&!b.has(p)&&(b.add(p),p&&!p.d&&(l.r++,p.push(l)));u.map(p=>p[t](Q))});return l.r?g:x()},f=>(f?d(h[e]=f):w(v),s(c))),c&&(c.d=0)},m.d=(t,o)=>{for(var e in o)m.o(o,e)&&!m.o(t,e)&&Object.defineProperty(t,e,{enumerable:!0,get:o[e]})},m.o=(t,o)=>Object.prototype.hasOwnProperty.call(t,o),m.v=(t,o,e,s)=>{var i=fetch(m.p+""+e+".module.wasm");return"function"==typeof WebAssembly.instantiateStreaming?WebAssembly.instantiateStreaming(i,s).then(r=>Object.assign(t,r.instance.exports)):i.then(r=>r.arrayBuffer()).then(r=>WebAssembly.instantiate(r,s)).then(r=>Object.assign(t,r.instance.exports))},m.p="",m(9703)})();