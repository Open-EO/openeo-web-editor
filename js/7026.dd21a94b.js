(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[7026],{75505:(e,t,r)=>{var n=r(82109),a=r(17854),s=r(35005),i=r(1702),o=r(46916),c=r(47293),u=r(41340),l=r(92597),h=r(48053),f=r(14170).ctoi,p=/[^\d+/a-z]/i,g=/[\t\n\f\r ]+/g,m=/[=]{1,2}$/,d=s("atob"),b=String.fromCharCode,v=i("".charAt),y=i("".replace),w=i(p.exec),k=c((function(){return""!==d(" ")})),S=!c((function(){d("a")})),E=!k&&!S&&!c((function(){d()})),R=!k&&!S&&1!==d.length;n({global:!0,bind:!0,enumerable:!0,forced:k||S||E||R},{atob:function(e){if(h(arguments.length,1),E||R)return o(d,a,e);var t,r,n=y(u(e),g,""),i="",c=0,k=0;if(n.length%4==0&&(n=y(n,m,"")),n.length%4==1||w(p,n))throw new(s("DOMException"))("The string is not correctly encoded","InvalidCharacterError");while(t=v(n,c++))l(f,t)&&(r=k%4?64*r+f[t]:f[t],k++%4&&(i+=b(255&r>>(-2*k&6))));return i}})},27479:(e,t,r)=>{var n=r(82109),a=r(17854),s=r(35005),i=r(1702),o=r(46916),c=r(47293),u=r(41340),l=r(48053),h=r(14170).itoc,f=s("btoa"),p=i("".charAt),g=i("".charCodeAt),m=!!f&&!c((function(){f()})),d=!!f&&c((function(){return"bnVsbA=="!==f(null)})),b=!!f&&1!==f.length;n({global:!0,bind:!0,enumerable:!0,forced:m||d||b},{btoa:function(e){if(l(arguments.length,1),m||d||b)return o(f,a,u(e));var t,r,n=u(e),i="",c=0,v=h;while(p(n,c)||(v="=",c%1)){if(r=g(n,c+=3/4),r>255)throw new(s("DOMException"))("The string contains characters outside of the Latin1 range","InvalidCharacterError");t=t<<8|r,i+=p(v,63&t>>8-c%1*8)}return i}})},11091:(e,t,r)=>{var n=r(82109),a=r(17854),s=r(20261).clear;n({global:!0,bind:!0,enumerable:!0,forced:a.clearImmediate!==s},{clearImmediate:s})},54747:(e,t,r)=>{var n=r(17854),a=r(48324),s=r(98509),i=r(18533),o=r(68880),c=function(e){if(e&&e.forEach!==i)try{o(e,"forEach",i)}catch(t){e.forEach=i}};for(var u in a)a[u]&&c(n[u]&&n[u].prototype);c(s)},33948:(e,t,r)=>{var n=r(17854),a=r(48324),s=r(98509),i=r(66992),o=r(68880),c=r(5112),u=c("iterator"),l=c("toStringTag"),h=i.values,f=function(e,t){if(e){if(e[u]!==h)try{o(e,u,h)}catch(n){e[u]=h}if(e[l]||o(e,l,t),a[t])for(var r in i)if(e[r]!==i[r])try{o(e,r,i[r])}catch(n){e[r]=i[r]}}};for(var p in a)f(n[p]&&n[p].prototype,p);f(s,"DOMTokenList")},87714:(e,t,r)=>{"use strict";var n=r(82109),a=r(44038),s=r(35005),i=r(47293),o=r(70030),c=r(79114),u=r(3070).f,l=r(98052),h=r(47045),f=r(92597),p=r(25787),g=r(19670),m=r(7762),d=r(56277),b=r(93678),v=r(11060),y=r(29909),w=r(19781),k=r(31913),S="DOMException",E="DATA_CLONE_ERR",R=s("Error"),P=s(S)||function(){try{var e=s("MessageChannel")||a("worker_threads").MessageChannel;(new e).port1.postMessage(new WeakMap)}catch(t){if(t.name==E&&25==t.code)return t.constructor}}(),U=P&&P.prototype,O=R.prototype,A=y.set,L=y.getterFor(S),C="stack"in R(S),B=function(e){return f(b,e)&&b[e].m?b[e].c:0},D=function(){p(this,M);var e=arguments.length,t=d(e<1?void 0:arguments[0]),r=d(e<2?void 0:arguments[1],"Error"),n=B(r);if(A(this,{type:S,name:r,message:t,code:n}),w||(this.name=r,this.message=t,this.code=n),C){var a=R(t);a.name=S,u(this,"stack",c(1,v(a.stack,1)))}},M=D.prototype=o(O),I=function(e){return{enumerable:!0,configurable:!0,get:e}},x=function(e){return I((function(){return L(this)[e]}))};w&&(h(M,"code",x("code")),h(M,"message",x("message")),h(M,"name",x("name"))),u(M,"constructor",c(1,D));var H=i((function(){return!(new P instanceof R)})),q=H||i((function(){return O.toString!==m||"2: 1"!==String(new P(1,2))})),T=H||i((function(){return 25!==new P(1,"DataCloneError").code})),j=H||25!==P[E]||25!==U[E],z=k?q||T||j:H;n({global:!0,constructor:!0,forced:z},{DOMException:z?D:P});var F=s(S),_=F.prototype;for(var V in q&&(k||P===F)&&l(_,"toString",m),T&&w&&P===F&&h(_,"code",I((function(){return B(g(this).name)}))),b)if(f(b,V)){var $=b[V],G=$.s,Q=c(6,$.c);f(F,G)||u(F,G,Q),f(_,G)||u(_,G,Q)}},82801:(e,t,r)=>{"use strict";var n=r(82109),a=r(17854),s=r(35005),i=r(79114),o=r(3070).f,c=r(92597),u=r(25787),l=r(79587),h=r(56277),f=r(93678),p=r(11060),g=r(19781),m=r(31913),d="DOMException",b=s("Error"),v=s(d),y=function(){u(this,w);var e=arguments.length,t=h(e<1?void 0:arguments[0]),r=h(e<2?void 0:arguments[1],"Error"),n=new v(t,r),a=b(t);return a.name=d,o(n,"stack",i(1,p(a.stack,1))),l(n,this,y),n},w=y.prototype=v.prototype,k="stack"in b(d),S="stack"in new v(1,2),E=v&&g&&Object.getOwnPropertyDescriptor(a,d),R=!!E&&!(E.writable&&E.configurable),P=k&&!R&&!S;n({global:!0,constructor:!0,forced:m||P},{DOMException:P?y:v});var U=s(d),O=U.prototype;if(O.constructor!==U)for(var A in m||o(O,"constructor",i(1,U)),f)if(c(f,A)){var L=f[A],C=L.s;c(U,C)||o(U,C,i(6,L.c))}},1174:(e,t,r)=>{var n=r(35005),a=r(58003),s="DOMException";a(n(s),s)},84633:(e,t,r)=>{r(11091),r(12986)},85844:(e,t,r)=>{var n=r(82109),a=r(17854),s=r(95948),i=r(19662),o=r(48053),c=r(35268),u=a.process;n({global:!0,enumerable:!0,dontCallGetSet:!0},{queueMicrotask:function(e){o(arguments.length,1),i(e);var t=c&&u.domain;s(t?t.bind(e):e)}})},71550:(e,t,r)=>{"use strict";var n=r(82109),a=r(17854),s=r(47045),i=r(19781),o=TypeError,c=Object.defineProperty,u=a.self!==a;try{if(i){var l=Object.getOwnPropertyDescriptor(a,"self");!u&&l&&l.get&&l.enumerable||s(a,"self",{get:function(){return a},set:function(e){if(this!==a)throw o("Illegal invocation");c(a,"self",{value:e,writable:!0,configurable:!0,enumerable:!0})},configurable:!0,enumerable:!0})}else n({global:!0,simple:!0,forced:u},{self:a})}catch(h){}},12986:(e,t,r)=>{var n=r(82109),a=r(17854),s=r(20261).set,i=r(17152),o=a.setImmediate?i(s,!1):s;n({global:!0,bind:!0,enumerable:!0,forced:a.setImmediate!==o},{setImmediate:o})},96815:(e,t,r)=>{var n=r(82109),a=r(17854),s=r(17152),i=s(a.setInterval,!0);n({global:!0,bind:!0,forced:a.setInterval!==i},{setInterval:i})},88417:(e,t,r)=>{var n=r(82109),a=r(17854),s=r(17152),i=s(a.setTimeout,!0);n({global:!0,bind:!0,forced:a.setTimeout!==i},{setTimeout:i})},61295:(e,t,r)=>{var n=r(31913),a=r(82109),s=r(17854),i=r(35005),o=r(1702),c=r(47293),u=r(69711),l=r(60614),h=r(4411),f=r(68554),p=r(70111),g=r(52190),m=r(20408),d=r(19670),b=r(70648),v=r(92597),y=r(86135),w=r(68880),k=r(26244),S=r(48053),E=r(34706),R=r(75706),P=r(79405),U=r(22914),O=r(64124),A=s.Object,L=s.Array,C=s.Date,B=s.Error,D=s.EvalError,M=s.RangeError,I=s.ReferenceError,x=s.SyntaxError,H=s.TypeError,q=s.URIError,T=s.PerformanceMark,j=s.WebAssembly,z=j&&j.CompileError||B,F=j&&j.LinkError||B,_=j&&j.RuntimeError||B,V=i("DOMException"),$=R.Map,G=R.has,Q=R.get,N=R.set,W=P.Set,J=P.add,K=i("Object","keys"),X=o([].push),Y=o((!0).valueOf),Z=o(1..valueOf),ee=o("".valueOf),te=o(C.prototype.getTime),re=u("structuredClone"),ne="DataCloneError",ae="Transferring",se=function(e){return!c((function(){var t=new s.Set([7]),r=e(t),n=e(A(7));return r==t||!r.has(7)||"object"!=typeof n||7!=n}))&&e},ie=function(e,t){return!c((function(){var r=new t,n=e({a:r,b:r});return!(n&&n.a===n.b&&n.a instanceof t&&n.a.stack===r.stack)}))},oe=function(e){return!c((function(){var t=e(new s.AggregateError([1],re,{cause:3}));return"AggregateError"!=t.name||1!=t.errors[0]||t.message!=re||3!=t.cause}))},ce=s.structuredClone,ue=n||!ie(ce,B)||!ie(ce,V)||!oe(ce),le=!ce&&se((function(e){return new T(re,{detail:e}).detail})),he=se(ce)||le,fe=function(e){throw new V("Uncloneable type: "+e,ne)},pe=function(e,t){throw new V((t||"Cloning")+" of "+e+" cannot be properly polyfilled in this engine",ne)},ge=function(e,t){return he||pe(t),he(e)},me=function(){var e;try{e=new s.DataTransfer}catch(t){try{e=new s.ClipboardEvent("").clipboardData}catch(r){}}return e&&e.items&&e.files?e:null},de=function(e,t){if(g(e)&&fe("Symbol"),!p(e))return e;if(t){if(G(t,e))return Q(t,e)}else t=new $;var r,n,a,o,c,u,h,f,m,d,S,R=b(e),P=!1;switch(R){case"Array":a=L(k(e)),P=!0;break;case"Object":a={},P=!0;break;case"Map":a=new $,P=!0;break;case"Set":a=new W,P=!0;break;case"RegExp":a=new RegExp(e.source,E(e));break;case"Error":switch(n=e.name,n){case"AggregateError":a=i("AggregateError")([]);break;case"EvalError":a=D();break;case"RangeError":a=M();break;case"ReferenceError":a=I();break;case"SyntaxError":a=x();break;case"TypeError":a=H();break;case"URIError":a=q();break;case"CompileError":a=z();break;case"LinkError":a=F();break;case"RuntimeError":a=_();break;default:a=B()}P=!0;break;case"DOMException":a=new V(e.message,e.name),P=!0;break;case"DataView":case"Int8Array":case"Uint8Array":case"Uint8ClampedArray":case"Int16Array":case"Uint16Array":case"Int32Array":case"Uint32Array":case"Float32Array":case"Float64Array":case"BigInt64Array":case"BigUint64Array":r=s[R],p(r)||pe(R),a=new r(de(e.buffer,t),e.byteOffset,"DataView"===R?e.byteLength:e.length);break;case"DOMQuad":try{a=new DOMQuad(de(e.p1,t),de(e.p2,t),de(e.p3,t),de(e.p4,t))}catch(O){a=ge(e,R)}break;case"File":if(he)try{a=he(e),b(a)!==R&&(a=void 0)}catch(O){}if(!a)try{a=new File([e],e.name,e)}catch(O){}a||pe(R);break;case"FileList":if(o=me(),o){for(c=0,u=k(e);c<u;c++)o.items.add(de(e[c],t));a=o.files}else a=ge(e,R);break;case"ImageData":try{a=new ImageData(de(e.data,t),e.width,e.height,{colorSpace:e.colorSpace})}catch(O){a=ge(e,R)}break;default:if(he)a=he(e);else switch(R){case"BigInt":a=A(e.valueOf());break;case"Boolean":a=A(Y(e));break;case"Number":a=A(Z(e));break;case"String":a=A(ee(e));break;case"Date":a=new C(te(e));break;case"ArrayBuffer":r=s.DataView,r||"function"==typeof e.slice||pe(R);try{if("function"!=typeof e.slice||e.resizable){u=e.byteLength,S="maxByteLength"in e?{maxByteLength:e.maxByteLength}:void 0,a=new ArrayBuffer(u,S),m=new r(e),d=new r(a);for(c=0;c<u;c++)d.setUint8(c,m.getUint8(c))}else a=e.slice(0)}catch(O){throw new V("ArrayBuffer is detached",ne)}break;case"SharedArrayBuffer":a=e;break;case"Blob":try{a=e.slice(0,e.size,e.type)}catch(O){pe(R)}break;case"DOMPoint":case"DOMPointReadOnly":r=s[R];try{a=r.fromPoint?r.fromPoint(e):new r(e.x,e.y,e.z,e.w)}catch(O){pe(R)}break;case"DOMRect":case"DOMRectReadOnly":r=s[R];try{a=r.fromRect?r.fromRect(e):new r(e.x,e.y,e.width,e.height)}catch(O){pe(R)}break;case"DOMMatrix":case"DOMMatrixReadOnly":r=s[R];try{a=r.fromMatrix?r.fromMatrix(e):new r(e)}catch(O){pe(R)}break;case"AudioData":case"VideoFrame":l(e.clone)||pe(R);try{a=e.clone()}catch(O){fe(R)}break;case"CropTarget":case"CryptoKey":case"FileSystemDirectoryHandle":case"FileSystemFileHandle":case"FileSystemHandle":case"GPUCompilationInfo":case"GPUCompilationMessage":case"ImageBitmap":case"RTCCertificate":case"WebAssembly.Module":pe(R);default:fe(R)}}if(N(t,e,a),P)switch(R){case"Array":case"Object":for(h=K(e),c=0,u=k(h);c<u;c++)f=h[c],y(a,f,de(e[f],t));break;case"Map":e.forEach((function(e,r){N(a,de(r,t),de(e,t))}));break;case"Set":e.forEach((function(e){J(a,de(e,t))}));break;case"Error":w(a,"message",de(e.message,t)),v(e,"cause")&&w(a,"cause",de(e.cause,t)),"AggregateError"==n&&(a.errors=de(e.errors,t));case"DOMException":U&&w(a,"stack",de(e.stack,t))}return a},be=function(e,t){if(!p(e))throw H("Transfer option cannot be converted to a sequence");var r=[];m(e,(function(e){X(r,d(e))}));var n,a,i,o,c,u,f,g=0,v=k(r);if(O){o=ce(r,{transfer:r});while(g<v)N(t,r[g],o[g++])}else while(g<v){if(n=r[g++],G(t,n))throw new V("Duplicate transferable",ne);switch(a=b(n),a){case"ImageBitmap":i=s.OffscreenCanvas,h(i)||pe(a,ae);try{u=new i(n.width,n.height),f=u.getContext("bitmaprenderer"),f.transferFromImageBitmap(n),c=u.transferToImageBitmap()}catch(y){}break;case"AudioData":case"VideoFrame":l(n.clone)&&l(n.close)||pe(a,ae);try{c=n.clone(),n.close()}catch(y){}break;case"ArrayBuffer":l(n.transfer)||pe(a,ae),c=n.transfer();break;case"MediaSourceHandle":case"MessagePort":case"OffscreenCanvas":case"ReadableStream":case"TransformStream":case"WritableStream":pe(a,ae)}if(void 0===c)throw new V("This object cannot be transferred: "+a,ne);N(t,n,c)}};a({global:!0,enumerable:!0,sham:!O,forced:ue},{structuredClone:function(e){var t,r=S(arguments.length,1)>1&&!f(arguments[1])?d(arguments[1]):void 0,n=r?r.transfer:void 0;return void 0!==n&&(t=new $,be(n,t)),de(e,t)}})},32564:(e,t,r)=>{r(96815),r(88417)},65556:(e,t,r)=>{"use strict";r(66992);var n=r(82109),a=r(17854),s=r(46916),i=r(1702),o=r(19781),c=r(85143),u=r(98052),l=r(47045),h=r(89190),f=r(58003),p=r(63061),g=r(29909),m=r(25787),d=r(60614),b=r(92597),v=r(49974),y=r(70648),w=r(19670),k=r(70111),S=r(41340),E=r(70030),R=r(79114),P=r(18554),U=r(71246),O=r(48053),A=r(5112),L=r(94362),C=A("iterator"),B="URLSearchParams",D=B+"Iterator",M=g.set,I=g.getterFor(B),x=g.getterFor(D),H=Object.getOwnPropertyDescriptor,q=function(e){if(!o)return a[e];var t=H(a,e);return t&&t.value},T=q("fetch"),j=q("Request"),z=q("Headers"),F=j&&j.prototype,_=z&&z.prototype,V=a.RegExp,$=a.TypeError,G=a.decodeURIComponent,Q=a.encodeURIComponent,N=i("".charAt),W=i([].join),J=i([].push),K=i("".replace),X=i([].shift),Y=i([].splice),Z=i("".split),ee=i("".slice),te=/\+/g,re=Array(4),ne=function(e){return re[e-1]||(re[e-1]=V("((?:%[\\da-f]{2}){"+e+"})","gi"))},ae=function(e){try{return G(e)}catch(t){return e}},se=function(e){var t=K(e,te," "),r=4;try{return G(t)}catch(n){while(r)t=K(t,ne(r--),ae);return t}},ie=/[!'()~]|%20/g,oe={"!":"%21","'":"%27","(":"%28",")":"%29","~":"%7E","%20":"+"},ce=function(e){return oe[e]},ue=function(e){return K(Q(e),ie,ce)},le=p((function(e,t){M(this,{type:D,iterator:P(I(e).entries),kind:t})}),"Iterator",(function(){var e=x(this),t=e.kind,r=e.iterator.next(),n=r.value;return r.done||(r.value="keys"===t?n.key:"values"===t?n.value:[n.key,n.value]),r}),!0),he=function(e){this.entries=[],this.url=null,void 0!==e&&(k(e)?this.parseObject(e):this.parseQuery("string"==typeof e?"?"===N(e,0)?ee(e,1):e:S(e)))};he.prototype={type:B,bindURL:function(e){this.url=e,this.update()},parseObject:function(e){var t,r,n,a,i,o,c,u=U(e);if(u){t=P(e,u),r=t.next;while(!(n=s(r,t)).done){if(a=P(w(n.value)),i=a.next,(o=s(i,a)).done||(c=s(i,a)).done||!s(i,a).done)throw $("Expected sequence with length 2");J(this.entries,{key:S(o.value),value:S(c.value)})}}else for(var l in e)b(e,l)&&J(this.entries,{key:l,value:S(e[l])})},parseQuery:function(e){if(e){var t,r,n=Z(e,"&"),a=0;while(a<n.length)t=n[a++],t.length&&(r=Z(t,"="),J(this.entries,{key:se(X(r)),value:se(W(r,"="))}))}},serialize:function(){var e,t=this.entries,r=[],n=0;while(n<t.length)e=t[n++],J(r,ue(e.key)+"="+ue(e.value));return W(r,"&")},update:function(){this.entries.length=0,this.parseQuery(this.url.query)},updateURL:function(){this.url&&this.url.update()}};var fe=function(){m(this,pe);var e=arguments.length>0?arguments[0]:void 0,t=M(this,new he(e));o||(this.length=t.entries.length)},pe=fe.prototype;if(h(pe,{append:function(e,t){O(arguments.length,2);var r=I(this);J(r.entries,{key:S(e),value:S(t)}),o||this.length++,r.updateURL()},delete:function(e){O(arguments.length,1);var t=I(this),r=t.entries,n=S(e),a=0;while(a<r.length)r[a].key===n?Y(r,a,1):a++;o||(this.length=r.length),t.updateURL()},get:function(e){O(arguments.length,1);for(var t=I(this).entries,r=S(e),n=0;n<t.length;n++)if(t[n].key===r)return t[n].value;return null},getAll:function(e){O(arguments.length,1);for(var t=I(this).entries,r=S(e),n=[],a=0;a<t.length;a++)t[a].key===r&&J(n,t[a].value);return n},has:function(e){O(arguments.length,1);var t=I(this).entries,r=S(e),n=0;while(n<t.length)if(t[n++].key===r)return!0;return!1},set:function(e,t){O(arguments.length,1);for(var r,n=I(this),a=n.entries,s=!1,i=S(e),c=S(t),u=0;u<a.length;u++)r=a[u],r.key===i&&(s?Y(a,u--,1):(s=!0,r.value=c));s||J(a,{key:i,value:c}),o||(this.length=a.length),n.updateURL()},sort:function(){var e=I(this);L(e.entries,(function(e,t){return e.key>t.key?1:-1})),e.updateURL()},forEach:function(e){var t,r=I(this).entries,n=v(e,arguments.length>1?arguments[1]:void 0),a=0;while(a<r.length)t=r[a++],n(t.value,t.key,this)},keys:function(){return new le(this,"keys")},values:function(){return new le(this,"values")},entries:function(){return new le(this,"entries")}},{enumerable:!0}),u(pe,C,pe.entries,{name:"entries"}),u(pe,"toString",(function(){return I(this).serialize()}),{enumerable:!0}),o&&l(pe,"size",{get:function(){return I(this).entries.length},configurable:!0,enumerable:!0}),f(fe,B),n({global:!0,constructor:!0,forced:!c},{URLSearchParams:fe}),!c&&d(z)){var ge=i(_.has),me=i(_.set),de=function(e){if(k(e)){var t,r=e.body;if(y(r)===B)return t=e.headers?new z(e.headers):new z,ge(t,"content-type")||me(t,"content-type","application/x-www-form-urlencoded;charset=UTF-8"),E(e,{body:R(0,S(r)),headers:R(0,t)})}return e};if(d(T)&&n({global:!0,enumerable:!0,dontCallGetSet:!0,forced:!0},{fetch:function(e){return T(e,arguments.length>1?de(arguments[1]):{})}}),d(j)){var be=function(e){return m(this,F),new j(e,arguments.length>1?de(arguments[1]):{})};F.constructor=be,be.prototype=F,n({global:!0,constructor:!0,dontCallGetSet:!0,forced:!0},{Request:be})}}e.exports={URLSearchParams:fe,getState:I}},41637:(e,t,r)=>{r(65556)},62062:(e,t,r)=>{"use strict";var n=r(19781),a=r(1702),s=r(47045),i=URLSearchParams.prototype,o=a(i.forEach);n&&!("size"in i)&&s(i,"size",{get:function(){var e=0;return o(this,(function(){e++})),e},configurable:!0,enumerable:!0})},7994:(e,t,r)=>{var n=r(82109),a=r(35005),s=r(47293),i=r(48053),o=r(41340),c=r(85143),u=a("URL"),l=c&&s((function(){u.canParse()}));n({target:"URL",stat:!0,forced:!l},{canParse:function(e){var t=i(arguments.length,1),r=o(e),n=t<2||void 0===arguments[1]?void 0:o(arguments[1]);try{return!!new u(r,n)}catch(a){return!1}}})},68789:(e,t,r)=>{"use strict";r(78783);var n,a=r(82109),s=r(19781),i=r(85143),o=r(17854),c=r(49974),u=r(1702),l=r(98052),h=r(47045),f=r(25787),p=r(92597),g=r(21574),m=r(48457),d=r(41589),b=r(28710).codeAt,v=r(33197),y=r(41340),w=r(58003),k=r(48053),S=r(65556),E=r(29909),R=E.set,P=E.getterFor("URL"),U=S.URLSearchParams,O=S.getState,A=o.URL,L=o.TypeError,C=o.parseInt,B=Math.floor,D=Math.pow,M=u("".charAt),I=u(/./.exec),x=u([].join),H=u(1..toString),q=u([].pop),T=u([].push),j=u("".replace),z=u([].shift),F=u("".split),_=u("".slice),V=u("".toLowerCase),$=u([].unshift),G="Invalid authority",Q="Invalid scheme",N="Invalid host",W="Invalid port",J=/[a-z]/i,K=/[\d+-.a-z]/i,X=/\d/,Y=/^0x/i,Z=/^[0-7]+$/,ee=/^\d+$/,te=/^[\da-f]+$/i,re=/[\0\t\n\r #%/:<>?@[\\\]^|]/,ne=/[\0\t\n\r #/:<>?@[\\\]^|]/,ae=/^[\u0000-\u0020]+/,se=/(^|[^\u0000-\u0020])[\u0000-\u0020]+$/,ie=/[\t\n\r]/g,oe=function(e){var t,r,n,a,s,i,o,c=F(e,".");if(c.length&&""==c[c.length-1]&&c.length--,t=c.length,t>4)return e;for(r=[],n=0;n<t;n++){if(a=c[n],""==a)return e;if(s=10,a.length>1&&"0"==M(a,0)&&(s=I(Y,a)?16:8,a=_(a,8==s?1:2)),""===a)i=0;else{if(!I(10==s?ee:8==s?Z:te,a))return e;i=C(a,s)}T(r,i)}for(n=0;n<t;n++)if(i=r[n],n==t-1){if(i>=D(256,5-t))return null}else if(i>255)return null;for(o=q(r),n=0;n<r.length;n++)o+=r[n]*D(256,3-n);return o},ce=function(e){var t,r,n,a,s,i,o,c=[0,0,0,0,0,0,0,0],u=0,l=null,h=0,f=function(){return M(e,h)};if(":"==f()){if(":"!=M(e,1))return;h+=2,u++,l=u}while(f()){if(8==u)return;if(":"!=f()){t=r=0;while(r<4&&I(te,f()))t=16*t+C(f(),16),h++,r++;if("."==f()){if(0==r)return;if(h-=r,u>6)return;n=0;while(f()){if(a=null,n>0){if(!("."==f()&&n<4))return;h++}if(!I(X,f()))return;while(I(X,f())){if(s=C(f(),10),null===a)a=s;else{if(0==a)return;a=10*a+s}if(a>255)return;h++}c[u]=256*c[u]+a,n++,2!=n&&4!=n||u++}if(4!=n)return;break}if(":"==f()){if(h++,!f())return}else if(f())return;c[u++]=t}else{if(null!==l)return;h++,u++,l=u}}if(null!==l){i=u-l,u=7;while(0!=u&&i>0)o=c[u],c[u--]=c[l+i-1],c[l+--i]=o}else if(8!=u)return;return c},ue=function(e){for(var t=null,r=1,n=null,a=0,s=0;s<8;s++)0!==e[s]?(a>r&&(t=n,r=a),n=null,a=0):(null===n&&(n=s),++a);return a>r&&(t=n,r=a),t},le=function(e){var t,r,n,a;if("number"==typeof e){for(t=[],r=0;r<4;r++)$(t,e%256),e=B(e/256);return x(t,".")}if("object"==typeof e){for(t="",n=ue(e),r=0;r<8;r++)a&&0===e[r]||(a&&(a=!1),n===r?(t+=r?":":"::",a=!0):(t+=H(e[r],16),r<7&&(t+=":")));return"["+t+"]"}return e},he={},fe=g({},he,{" ":1,'"':1,"<":1,">":1,"`":1}),pe=g({},fe,{"#":1,"?":1,"{":1,"}":1}),ge=g({},pe,{"/":1,":":1,";":1,"=":1,"@":1,"[":1,"\\":1,"]":1,"^":1,"|":1}),me=function(e,t){var r=b(e,0);return r>32&&r<127&&!p(t,e)?e:encodeURIComponent(e)},de={ftp:21,file:null,http:80,https:443,ws:80,wss:443},be=function(e,t){var r;return 2==e.length&&I(J,M(e,0))&&(":"==(r=M(e,1))||!t&&"|"==r)},ve=function(e){var t;return e.length>1&&be(_(e,0,2))&&(2==e.length||"/"===(t=M(e,2))||"\\"===t||"?"===t||"#"===t)},ye=function(e){return"."===e||"%2e"===V(e)},we=function(e){return e=V(e),".."===e||"%2e."===e||".%2e"===e||"%2e%2e"===e},ke={},Se={},Ee={},Re={},Pe={},Ue={},Oe={},Ae={},Le={},Ce={},Be={},De={},Me={},Ie={},xe={},He={},qe={},Te={},je={},ze={},Fe={},_e=function(e,t,r){var n,a,s,i=y(e);if(t){if(a=this.parse(i),a)throw L(a);this.searchParams=null}else{if(void 0!==r&&(n=new _e(r,!0)),a=this.parse(i,null,n),a)throw L(a);s=O(new U),s.bindURL(this),this.searchParams=s}};_e.prototype={type:"URL",parse:function(e,t,r){var a,s,i,o,c=this,u=t||ke,l=0,h="",f=!1,g=!1,b=!1;e=y(e),t||(c.scheme="",c.username="",c.password="",c.host=null,c.port=null,c.path=[],c.query=null,c.fragment=null,c.cannotBeABaseURL=!1,e=j(e,ae,""),e=j(e,se,"$1")),e=j(e,ie,""),a=m(e);while(l<=a.length){switch(s=a[l],u){case ke:if(!s||!I(J,s)){if(t)return Q;u=Ee;continue}h+=V(s),u=Se;break;case Se:if(s&&(I(K,s)||"+"==s||"-"==s||"."==s))h+=V(s);else{if(":"!=s){if(t)return Q;h="",u=Ee,l=0;continue}if(t&&(c.isSpecial()!=p(de,h)||"file"==h&&(c.includesCredentials()||null!==c.port)||"file"==c.scheme&&!c.host))return;if(c.scheme=h,t)return void(c.isSpecial()&&de[c.scheme]==c.port&&(c.port=null));h="","file"==c.scheme?u=Ie:c.isSpecial()&&r&&r.scheme==c.scheme?u=Re:c.isSpecial()?u=Ae:"/"==a[l+1]?(u=Pe,l++):(c.cannotBeABaseURL=!0,T(c.path,""),u=je)}break;case Ee:if(!r||r.cannotBeABaseURL&&"#"!=s)return Q;if(r.cannotBeABaseURL&&"#"==s){c.scheme=r.scheme,c.path=d(r.path),c.query=r.query,c.fragment="",c.cannotBeABaseURL=!0,u=Fe;break}u="file"==r.scheme?Ie:Ue;continue;case Re:if("/"!=s||"/"!=a[l+1]){u=Ue;continue}u=Le,l++;break;case Pe:if("/"==s){u=Ce;break}u=Te;continue;case Ue:if(c.scheme=r.scheme,s==n)c.username=r.username,c.password=r.password,c.host=r.host,c.port=r.port,c.path=d(r.path),c.query=r.query;else if("/"==s||"\\"==s&&c.isSpecial())u=Oe;else if("?"==s)c.username=r.username,c.password=r.password,c.host=r.host,c.port=r.port,c.path=d(r.path),c.query="",u=ze;else{if("#"!=s){c.username=r.username,c.password=r.password,c.host=r.host,c.port=r.port,c.path=d(r.path),c.path.length--,u=Te;continue}c.username=r.username,c.password=r.password,c.host=r.host,c.port=r.port,c.path=d(r.path),c.query=r.query,c.fragment="",u=Fe}break;case Oe:if(!c.isSpecial()||"/"!=s&&"\\"!=s){if("/"!=s){c.username=r.username,c.password=r.password,c.host=r.host,c.port=r.port,u=Te;continue}u=Ce}else u=Le;break;case Ae:if(u=Le,"/"!=s||"/"!=M(h,l+1))continue;l++;break;case Le:if("/"!=s&&"\\"!=s){u=Ce;continue}break;case Ce:if("@"==s){f&&(h="%40"+h),f=!0,i=m(h);for(var v=0;v<i.length;v++){var w=i[v];if(":"!=w||b){var k=me(w,ge);b?c.password+=k:c.username+=k}else b=!0}h=""}else if(s==n||"/"==s||"?"==s||"#"==s||"\\"==s&&c.isSpecial()){if(f&&""==h)return G;l-=m(h).length+1,h="",u=Be}else h+=s;break;case Be:case De:if(t&&"file"==c.scheme){u=He;continue}if(":"!=s||g){if(s==n||"/"==s||"?"==s||"#"==s||"\\"==s&&c.isSpecial()){if(c.isSpecial()&&""==h)return N;if(t&&""==h&&(c.includesCredentials()||null!==c.port))return;if(o=c.parseHost(h),o)return o;if(h="",u=qe,t)return;continue}"["==s?g=!0:"]"==s&&(g=!1),h+=s}else{if(""==h)return N;if(o=c.parseHost(h),o)return o;if(h="",u=Me,t==De)return}break;case Me:if(!I(X,s)){if(s==n||"/"==s||"?"==s||"#"==s||"\\"==s&&c.isSpecial()||t){if(""!=h){var S=C(h,10);if(S>65535)return W;c.port=c.isSpecial()&&S===de[c.scheme]?null:S,h=""}if(t)return;u=qe;continue}return W}h+=s;break;case Ie:if(c.scheme="file","/"==s||"\\"==s)u=xe;else{if(!r||"file"!=r.scheme){u=Te;continue}if(s==n)c.host=r.host,c.path=d(r.path),c.query=r.query;else if("?"==s)c.host=r.host,c.path=d(r.path),c.query="",u=ze;else{if("#"!=s){ve(x(d(a,l),""))||(c.host=r.host,c.path=d(r.path),c.shortenPath()),u=Te;continue}c.host=r.host,c.path=d(r.path),c.query=r.query,c.fragment="",u=Fe}}break;case xe:if("/"==s||"\\"==s){u=He;break}r&&"file"==r.scheme&&!ve(x(d(a,l),""))&&(be(r.path[0],!0)?T(c.path,r.path[0]):c.host=r.host),u=Te;continue;case He:if(s==n||"/"==s||"\\"==s||"?"==s||"#"==s){if(!t&&be(h))u=Te;else if(""==h){if(c.host="",t)return;u=qe}else{if(o=c.parseHost(h),o)return o;if("localhost"==c.host&&(c.host=""),t)return;h="",u=qe}continue}h+=s;break;case qe:if(c.isSpecial()){if(u=Te,"/"!=s&&"\\"!=s)continue}else if(t||"?"!=s)if(t||"#"!=s){if(s!=n&&(u=Te,"/"!=s))continue}else c.fragment="",u=Fe;else c.query="",u=ze;break;case Te:if(s==n||"/"==s||"\\"==s&&c.isSpecial()||!t&&("?"==s||"#"==s)){if(we(h)?(c.shortenPath(),"/"==s||"\\"==s&&c.isSpecial()||T(c.path,"")):ye(h)?"/"==s||"\\"==s&&c.isSpecial()||T(c.path,""):("file"==c.scheme&&!c.path.length&&be(h)&&(c.host&&(c.host=""),h=M(h,0)+":"),T(c.path,h)),h="","file"==c.scheme&&(s==n||"?"==s||"#"==s))while(c.path.length>1&&""===c.path[0])z(c.path);"?"==s?(c.query="",u=ze):"#"==s&&(c.fragment="",u=Fe)}else h+=me(s,pe);break;case je:"?"==s?(c.query="",u=ze):"#"==s?(c.fragment="",u=Fe):s!=n&&(c.path[0]+=me(s,he));break;case ze:t||"#"!=s?s!=n&&("'"==s&&c.isSpecial()?c.query+="%27":c.query+="#"==s?"%23":me(s,he)):(c.fragment="",u=Fe);break;case Fe:s!=n&&(c.fragment+=me(s,fe));break}l++}},parseHost:function(e){var t,r,n;if("["==M(e,0)){if("]"!=M(e,e.length-1))return N;if(t=ce(_(e,1,-1)),!t)return N;this.host=t}else if(this.isSpecial()){if(e=v(e),I(re,e))return N;if(t=oe(e),null===t)return N;this.host=t}else{if(I(ne,e))return N;for(t="",r=m(e),n=0;n<r.length;n++)t+=me(r[n],he);this.host=t}},cannotHaveUsernamePasswordPort:function(){return!this.host||this.cannotBeABaseURL||"file"==this.scheme},includesCredentials:function(){return""!=this.username||""!=this.password},isSpecial:function(){return p(de,this.scheme)},shortenPath:function(){var e=this.path,t=e.length;!t||"file"==this.scheme&&1==t&&be(e[0],!0)||e.length--},serialize:function(){var e=this,t=e.scheme,r=e.username,n=e.password,a=e.host,s=e.port,i=e.path,o=e.query,c=e.fragment,u=t+":";return null!==a?(u+="//",e.includesCredentials()&&(u+=r+(n?":"+n:"")+"@"),u+=le(a),null!==s&&(u+=":"+s)):"file"==t&&(u+="//"),u+=e.cannotBeABaseURL?i[0]:i.length?"/"+x(i,"/"):"",null!==o&&(u+="?"+o),null!==c&&(u+="#"+c),u},setHref:function(e){var t=this.parse(e);if(t)throw L(t);this.searchParams.update()},getOrigin:function(){var e=this.scheme,t=this.port;if("blob"==e)try{return new Ve(e.path[0]).origin}catch(r){return"null"}return"file"!=e&&this.isSpecial()?e+"://"+le(this.host)+(null!==t?":"+t:""):"null"},getProtocol:function(){return this.scheme+":"},setProtocol:function(e){this.parse(y(e)+":",ke)},getUsername:function(){return this.username},setUsername:function(e){var t=m(y(e));if(!this.cannotHaveUsernamePasswordPort()){this.username="";for(var r=0;r<t.length;r++)this.username+=me(t[r],ge)}},getPassword:function(){return this.password},setPassword:function(e){var t=m(y(e));if(!this.cannotHaveUsernamePasswordPort()){this.password="";for(var r=0;r<t.length;r++)this.password+=me(t[r],ge)}},getHost:function(){var e=this.host,t=this.port;return null===e?"":null===t?le(e):le(e)+":"+t},setHost:function(e){this.cannotBeABaseURL||this.parse(e,Be)},getHostname:function(){var e=this.host;return null===e?"":le(e)},setHostname:function(e){this.cannotBeABaseURL||this.parse(e,De)},getPort:function(){var e=this.port;return null===e?"":y(e)},setPort:function(e){this.cannotHaveUsernamePasswordPort()||(e=y(e),""==e?this.port=null:this.parse(e,Me))},getPathname:function(){var e=this.path;return this.cannotBeABaseURL?e[0]:e.length?"/"+x(e,"/"):""},setPathname:function(e){this.cannotBeABaseURL||(this.path=[],this.parse(e,qe))},getSearch:function(){var e=this.query;return e?"?"+e:""},setSearch:function(e){e=y(e),""==e?this.query=null:("?"==M(e,0)&&(e=_(e,1)),this.query="",this.parse(e,ze)),this.searchParams.update()},getSearchParams:function(){return this.searchParams.facade},getHash:function(){var e=this.fragment;return e?"#"+e:""},setHash:function(e){e=y(e),""!=e?("#"==M(e,0)&&(e=_(e,1)),this.fragment="",this.parse(e,Fe)):this.fragment=null},update:function(){this.query=this.searchParams.serialize()||null}};var Ve=function(e){var t=f(this,$e),r=k(arguments.length,1)>1?arguments[1]:void 0,n=R(t,new _e(e,!1,r));s||(t.href=n.serialize(),t.origin=n.getOrigin(),t.protocol=n.getProtocol(),t.username=n.getUsername(),t.password=n.getPassword(),t.host=n.getHost(),t.hostname=n.getHostname(),t.port=n.getPort(),t.pathname=n.getPathname(),t.search=n.getSearch(),t.searchParams=n.getSearchParams(),t.hash=n.getHash())},$e=Ve.prototype,Ge=function(e,t){return{get:function(){return P(this)[e]()},set:t&&function(e){return P(this)[t](e)},configurable:!0,enumerable:!0}};if(s&&(h($e,"href",Ge("serialize","setHref")),h($e,"origin",Ge("getOrigin")),h($e,"protocol",Ge("getProtocol","setProtocol")),h($e,"username",Ge("getUsername","setUsername")),h($e,"password",Ge("getPassword","setPassword")),h($e,"host",Ge("getHost","setHost")),h($e,"hostname",Ge("getHostname","setHostname")),h($e,"port",Ge("getPort","setPort")),h($e,"pathname",Ge("getPathname","setPathname")),h($e,"search",Ge("getSearch","setSearch")),h($e,"searchParams",Ge("getSearchParams")),h($e,"hash",Ge("getHash","setHash"))),l($e,"toJSON",(function(){return P(this).serialize()}),{enumerable:!0}),l($e,"toString",(function(){return P(this).serialize()}),{enumerable:!0}),A){var Qe=A.createObjectURL,Ne=A.revokeObjectURL;Qe&&l(Ve,"createObjectURL",c(Qe,A)),Ne&&l(Ve,"revokeObjectURL",c(Ne,A))}w(Ve,"URL"),a({global:!0,constructor:!0,forced:!i,sham:!s},{URL:Ve})},60285:(e,t,r)=>{r(68789)},83753:(e,t,r)=>{"use strict";var n=r(82109),a=r(46916);n({target:"URL",proto:!0,enumerable:!0},{toJSON:function(){return a(URL.prototype.toString,this)}})}}]);
//# sourceMappingURL=7026.dd21a94b.js.map