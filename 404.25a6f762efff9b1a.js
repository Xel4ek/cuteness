"use strict";(self.webpackChunkcuteness=self.webpackChunkcuteness||[]).push([[404],{5404:(P,y,l)=>{l.r(y),l.d(y,{RSAModule:()=>B});var M=l(4755),f=l(5159);function h(a,o,t,n,r,u,i){try{var s=a[u](i),d=s.value}catch(v){return void t(v)}s.done?o(d):Promise.resolve(d).then(n,r)}function g(a){return function(){var o=this,t=arguments;return new Promise(function(n,r){var u=a.apply(o,t);function i(d){h(u,n,r,i,s,"next",d)}function s(d){h(u,n,r,i,s,"throw",d)}i(void 0)})}}class c{static pemToArrayBuffer(o){const t=o.replace(/(-----(BEGIN|END) PUBLIC KEY-----|\n)/g,""),n=window.atob(t),r=n.length,u=new Uint8Array(r);for(let i=0;i<r;i++)u[i]=n.charCodeAt(i);return u.buffer}encrypt(o,t){return g(function*(){const n=c.pemToArrayBuffer(o),r=yield window.crypto.subtle.importKey("spki",n,{name:"RSA-OAEP",hash:"SHA-256"},!1,["encrypt"]),u=yield window.crypto.subtle.encrypt({name:"RSA-OAEP"},r,(new TextEncoder).encode(t));return new Uint8Array(u)})()}decrypt(o,t){return g(function*(){const n=yield window.crypto.subtle.decrypt({name:"RSA-OAEP"},o,t);return(new TextDecoder).decode(n)})()}static modInverse(o,t){const n=t;let r=BigInt(0),u=BigInt(1);if(t===BigInt(1))return BigInt(0);for(;o>BigInt(1);){const i=o/t;let s=t;t=o%t,o=s,s=r,r=u-i*r,u=s}return u<BigInt(0)&&(u+=n),u}static generatePrime(){return BigInt(Math.floor(1e3*Math.random())+1e3)}generateKeys(){const o=c.generatePrime(),t=c.generatePrime(),n=o*t,r=(o-BigInt(1))*(t-BigInt(1)),u=c.e,i=c.modInverse(u,r);return{publicKey:new p({e:u,n}),privateKey:new p({d:i,n})}}}c.e=BigInt(65537);class p{constructor(o){this.key=o}static toBase64Url(o){const t=o.toString(16),n=new Uint8Array(Math.ceil(t.length/2)).map((r,u)=>parseInt(t.substr(2*u,2),16));return btoa(String.fromCharCode(...n)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}toPem(){const o="e"in this.key?"PUBLIC":"PRIVATE";return`-----BEGIN RSA ${o} KEY-----\n${Object.values(this.key).map(p.toBase64Url).join(".")}\n-----END RSA ${o} KEY-----`}}var e=l(2223),A=l(3617),C=l(9114),T=l(9609),b=l(8657),x=l(1728),m=l(9401);const R=[{path:"",component:(()=>{class a{constructor(){this.RSA=new c}generateKeys(){const{publicKey:t,privateKey:n}=this.RSA.generateKeys();this.publicRSAKey=t,this.privateRSAKey=n,this.privateKey=n.toPem(),this.publicKey=n.toPem()}encryptText(){var t=this;return g(function*(){t.publicKey&&t.plainText&&(t.encryptedText="await this.RSA.encrypt(this.publicKey, this.plainText)".toString())})()}decryptText(){this.decryptedText="crypto.privateDecrypt(this.privateKey, Buffer.from(this.encryptedText, 'base64'))".toString()}}return a.\u0275fac=function(t){return new(t||a)},a.\u0275cmp=e.Xpm({type:a,selectors:[["cuteness-rsa"]],decls:28,vars:6,consts:[["label","\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043a\u043b\u044e\u0447\u0435\u0439"],[1,"tab-content"],["matInput","","cdkTextareaAutosize","","cdkAutosizeMinRows","15","placeholder","\u041f\u0440\u0438\u0432\u0430\u0442\u043d\u044b\u0439 \u043a\u043b\u044e\u0447",3,"ngModel","ngModelChange"],["matInput","","cdkTextareaAutosize","","cdkAutosizeMinRows","15","placeholder","\u041f\u0443\u0431\u043b\u0438\u0447\u043d\u044b\u0439 \u043a\u043b\u044e\u0447",3,"ngModel","ngModelChange"],[1,"button-group"],["mat-raised-button","","color","primary",3,"click"],["label","\u0428\u0438\u0444\u0440\u043e\u0432\u0430\u043d\u0438\u0435"],["matInput","","cdkTextareaAutosize","","cdkAutosizeMinRows","15","placeholder","\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043a\u0441\u0442 \u0434\u043b\u044f \u0448\u0438\u0444\u0440\u043e\u0432\u0430\u043d\u0438\u044f",3,"ngModel","ngModelChange"],["matInput","","cdkTextareaAutosize","","cdkAutosizeMinRows","15","placeholder","\u0417\u0430\u0448\u0438\u0444\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u0442\u0435\u043a\u0441\u0442","readonly","",3,"ngModel","ngModelChange"],["label","\u0420\u0430\u0441\u0448\u0438\u0444\u0440\u043e\u0432\u043a\u0430"],["matInput","","cdkTextareaAutosize","","cdkAutosizeMinRows","15","placeholder","\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0437\u0430\u0448\u0438\u0444\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u0442\u0435\u043a\u0441\u0442",3,"ngModel","ngModelChange"],["matInput","","cdkTextareaAutosize","","cdkAutosizeMinRows","15","placeholder","\u0420\u0430\u0441\u0448\u0438\u0444\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u0442\u0435\u043a\u0441\u0442",3,"ngModel","ngModelChange"]],template:function(t,n){1&t&&(e.TgZ(0,"mat-tab-group")(1,"mat-tab",0)(2,"div",1)(3,"mat-form-field")(4,"textarea",2),e.NdJ("ngModelChange",function(u){return n.privateKey=u}),e.qZA()(),e.TgZ(5,"mat-form-field")(6,"textarea",3),e.NdJ("ngModelChange",function(u){return n.publicKey=u}),e.qZA()()(),e.TgZ(7,"div",4)(8,"button",5),e.NdJ("click",function(){return n.generateKeys()}),e._uU(9,"\u0421\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043a\u043b\u044e\u0447\u0438"),e.qZA()()(),e.TgZ(10,"mat-tab",6)(11,"div",1)(12,"mat-form-field")(13,"textarea",7),e.NdJ("ngModelChange",function(u){return n.plainText=u}),e.qZA()(),e.TgZ(14,"mat-form-field")(15,"textarea",8),e.NdJ("ngModelChange",function(u){return n.encryptedText=u}),e.qZA()()(),e.TgZ(16,"div",4)(17,"button",5),e.NdJ("click",function(){return n.encryptText()}),e._uU(18,"\u0417\u0430\u0448\u0438\u0444\u0440\u043e\u0432\u0430\u0442\u044c"),e.qZA()()(),e.TgZ(19,"mat-tab",9)(20,"div",1)(21,"mat-form-field")(22,"textarea",10),e.NdJ("ngModelChange",function(u){return n.encryptedText=u}),e.qZA()(),e.TgZ(23,"mat-form-field")(24,"textarea",11),e.NdJ("ngModelChange",function(u){return n.decryptedText=u}),e.qZA()()(),e.TgZ(25,"div",4)(26,"button",5),e.NdJ("click",function(){return n.decryptText()}),e._uU(27,"\u0420\u0430\u0441\u0448\u0438\u0444\u0440\u043e\u0432\u0430\u0442\u044c"),e.qZA()()()()),2&t&&(e.xp6(4),e.Q6J("ngModel",n.privateKey),e.xp6(2),e.Q6J("ngModel",n.publicKey),e.xp6(7),e.Q6J("ngModel",n.plainText),e.xp6(2),e.Q6J("ngModel",n.encryptedText),e.xp6(7),e.Q6J("ngModel",n.encryptedText),e.xp6(2),e.Q6J("ngModel",n.decryptedText))},dependencies:[A.uX,A.SP,C.KE,T.Nt,b.IC,x.lW,m.Fj,m.JJ,m.On],styles:["[_nghost-%COMP%]{width:100%;display:flex;flex-direction:column;justify-content:flex-start;align-items:center}[_nghost-%COMP%]   mat-tab-group[_ngcontent-%COMP%]{width:100%}[_nghost-%COMP%]   .button-group[_ngcontent-%COMP%], [_nghost-%COMP%]   .tab-content[_ngcontent-%COMP%]{padding:16px}[_nghost-%COMP%]   .tab-content[_ngcontent-%COMP%]{display:flex;justify-content:space-around}[_nghost-%COMP%]   .tab-content[_ngcontent-%COMP%]   mat-form-field[_ngcontent-%COMP%]{width:45%}"]}),a})()}];let S=(()=>{class a{}return a.\u0275fac=function(t){return new(t||a)},a.\u0275mod=e.oAB({type:a}),a.\u0275inj=e.cJS({imports:[f.Bz.forChild(R),f.Bz]}),a})(),B=(()=>{class a{}return a.\u0275fac=function(t){return new(t||a)},a.\u0275mod=e.oAB({type:a}),a.\u0275inj=e.cJS({imports:[M.ez,S]}),a})()}}]);