"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[8828],{73367:(t,n,e)=>{e.d(n,{Ay:()=>l,gK:()=>g,sY:()=>h});var r=6,o="AJSAJS",i="AFAFAF",a=65,s=73,c=79,u=86,f=90;const l={forward:h,inverse:d,toPoint:g};function h(t,n){return n=n||5,v(w({lat:t[1],lon:t[0]}),n)}function d(t){var n=P(G(t.toUpperCase()));return n.lat&&n.lon?[n.lon,n.lat,n.lon,n.lat]:[n.left,n.bottom,n.right,n.top]}function g(t){var n=P(G(t.toUpperCase()));return n.lat&&n.lon?[n.lon,n.lat]:[(n.left+n.right)/2,(n.top+n.bottom)/2]}function M(t){return t*(Math.PI/180)}function m(t){return t/Math.PI*180}function w(t){var n,e,r,o,i,a,s,c,u,f=t.lat,l=t.lon,h=6378137,d=.00669438,g=.9996,m=M(f),w=M(l);u=Math.floor((l+180)/6)+1,180===l&&(u=60),f>=56&&f<64&&l>=3&&l<12&&(u=32),f>=72&&f<84&&(l>=0&&l<9?u=31:l>=9&&l<21?u=33:l>=21&&l<33?u=35:l>=33&&l<42&&(u=37)),n=6*(u-1)-180+3,c=M(n),e=d/(1-d),r=h/Math.sqrt(1-d*Math.sin(m)*Math.sin(m)),o=Math.tan(m)*Math.tan(m),i=e*Math.cos(m)*Math.cos(m),a=Math.cos(m)*(w-c),s=h*((1-d/4-3*d*d/64-5*d*d*d/256)*m-(3*d/8+3*d*d/32+45*d*d*d/1024)*Math.sin(2*m)+(15*d*d/256+45*d*d*d/1024)*Math.sin(4*m)-35*d*d*d/3072*Math.sin(6*m));var P=g*r*(a+(1-o+i)*a*a*a/6+(5-18*o+o*o+72*i-58*e)*a*a*a*a*a/120)+5e5,v=g*(s+r*Math.tan(m)*(a*a/2+(5-o+9*i+4*i*i)*a*a*a*a/24+(61-58*o+o*o+600*i-330*e)*a*a*a*a*a*a/720));return f<0&&(v+=1e7),{northing:Math.round(v),easting:Math.round(P),zoneNumber:u,zoneLetter:E(f)}}function P(t){var n=t.northing,e=t.easting,r=t.zoneLetter,o=t.zoneNumber;if(o<0||o>60)return null;var i,a,s,c,u,f,l,h,d,g,M=.9996,w=6378137,E=.00669438,v=(1-Math.sqrt(1-E))/(1+Math.sqrt(1-E)),p=e-5e5,b=n;r<"N"&&(b-=1e7),h=6*(o-1)-180+3,i=E/(1-E),l=b/M,d=l/(w*(1-E/4-3*E*E/64-5*E*E*E/256)),g=d+(3*v/2-27*v*v*v/32)*Math.sin(2*d)+(21*v*v/16-55*v*v*v*v/32)*Math.sin(4*d)+151*v*v*v/96*Math.sin(6*d),a=w/Math.sqrt(1-E*Math.sin(g)*Math.sin(g)),s=Math.tan(g)*Math.tan(g),c=i*Math.cos(g)*Math.cos(g),u=w*(1-E)/Math.pow(1-E*Math.sin(g)*Math.sin(g),1.5),f=p/(a*M);var x=g-a*Math.tan(g)/u*(f*f/2-(5+3*s+10*c-4*c*c-9*i)*f*f*f*f/24+(61+90*s+298*c+45*s*s-252*i-3*c*c)*f*f*f*f*f*f/720);x=m(x);var G,A=(f-(1+2*s+c)*f*f*f/6+(5-2*c+28*s-3*c*c+8*i+24*s*s)*f*f*f*f*f/120)/Math.cos(g);if(A=h+m(A),t.accuracy){var C=P({northing:t.northing+t.accuracy,easting:t.easting+t.accuracy,zoneLetter:t.zoneLetter,zoneNumber:t.zoneNumber});G={top:C.lat,right:C.lon,bottom:x,left:A}}else G={lat:x,lon:A};return G}function E(t){var n="Z";return 84>=t&&t>=72?n="X":72>t&&t>=64?n="W":64>t&&t>=56?n="V":56>t&&t>=48?n="U":48>t&&t>=40?n="T":40>t&&t>=32?n="S":32>t&&t>=24?n="R":24>t&&t>=16?n="Q":16>t&&t>=8?n="P":8>t&&t>=0?n="N":0>t&&t>=-8?n="M":-8>t&&t>=-16?n="L":-16>t&&t>=-24?n="K":-24>t&&t>=-32?n="J":-32>t&&t>=-40?n="H":-40>t&&t>=-48?n="G":-48>t&&t>=-56?n="F":-56>t&&t>=-64?n="E":-64>t&&t>=-72?n="D":-72>t&&t>=-80&&(n="C"),n}function v(t,n){var e="00000"+t.easting,r="00000"+t.northing;return t.zoneNumber+t.zoneLetter+p(t.easting,t.northing,t.zoneNumber)+e.substr(e.length-5,n)+r.substr(r.length-5,n)}function p(t,n,e){var r=b(e),o=Math.floor(t/1e5),i=Math.floor(n/1e5)%20;return x(o,i,r)}function b(t){var n=t%r;return 0===n&&(n=r),n}function x(t,n,e){var r=e-1,l=o.charCodeAt(r),h=i.charCodeAt(r),d=l+t-1,g=h+n,M=!1;d>f&&(d=d-f+a-1,M=!0),(d===s||l<s&&d>s||(d>s||l<s)&&M)&&d++,(d===c||l<c&&d>c||(d>c||l<c)&&M)&&(d++,d===s&&d++),d>f&&(d=d-f+a-1),g>u?(g=g-u+a-1,M=!0):M=!1,(g===s||h<s&&g>s||(g>s||h<s)&&M)&&g++,(g===c||h<c&&g>c||(g>c||h<c)&&M)&&(g++,g===s&&g++),g>u&&(g=g-u+a-1);var m=String.fromCharCode(d)+String.fromCharCode(g);return m}function G(t){if(t&&0===t.length)throw"MGRSPoint coverting from nothing";var n,e=t.length,r=null,o="",i=0;while(!/[A-Z]/.test(n=t.charAt(i))){if(i>=2)throw"MGRSPoint bad conversion from: "+t;o+=n,i++}var a=parseInt(o,10);if(0===i||i+3>e)throw"MGRSPoint bad conversion from: "+t;var s=t.charAt(i++);if(s<="A"||"B"===s||"Y"===s||s>="Z"||"I"===s||"O"===s)throw"MGRSPoint zone letter "+s+" not handled: "+t;r=t.substring(i,i+=2);var c=b(a),u=A(r.charAt(0),c),f=C(r.charAt(1),c);while(f<R(s))f+=2e6;var l=e-i;if(l%2!==0)throw"MGRSPoint has to have an even number \nof digits after the zone letter and two 100km letters - front \nhalf for easting meters, second half for \nnorthing meters"+t;var h,d,g,M,m,w=l/2,P=0,E=0;return w>0&&(h=1e5/Math.pow(10,w),d=t.substring(i,i+w),P=parseFloat(d)*h,g=t.substring(i+w),E=parseFloat(g)*h),M=P+u,m=E+f,{easting:M,northing:m,zoneLetter:s,zoneNumber:a,accuracy:h}}function A(t,n){var e=o.charCodeAt(n-1),r=1e5,i=!1;while(e!==t.charCodeAt(0)){if(e++,e===s&&e++,e===c&&e++,e>f){if(i)throw"Bad character: "+t;e=a,i=!0}r+=1e5}return r}function C(t,n){if(t>"V")throw"MGRSPoint given invalid Northing "+t;var e=i.charCodeAt(n-1),r=0,o=!1;while(e!==t.charCodeAt(0)){if(e++,e===s&&e++,e===c&&e++,e>u){if(o)throw"Bad character: "+t;e=a,o=!0}r+=1e5}return r}function R(t){var n;switch(t){case"C":n=11e5;break;case"D":n=2e6;break;case"E":n=28e5;break;case"F":n=37e5;break;case"G":n=46e5;break;case"H":n=55e5;break;case"J":n=64e5;break;case"K":n=73e5;break;case"L":n=82e5;break;case"M":n=91e5;break;case"N":n=0;break;case"P":n=8e5;break;case"Q":n=17e5;break;case"R":n=26e5;break;case"S":n=35e5;break;case"T":n=44e5;break;case"U":n=53e5;break;case"V":n=62e5;break;case"W":n=7e6;break;case"X":n=79e5;break;default:n=-1}if(n>=0)return n;throw"Invalid zone letter: "+t}},54422:(t,n,e)=>{e.d(n,{R8:()=>a,z3:()=>s});var r=e(96763);const o={info:1,warn:2,error:3,none:4};let i=o.info;function a(...t){i>o.warn||r.warn(...t)}function s(...t){i>o.error||r.error(...t)}},6933:(t,n,e)=>{e.d(n,{$x:()=>h,Io:()=>l,Li:()=>d,U$:()=>g,WQ:()=>o,aI:()=>s,e$:()=>c,hG:()=>f,hs:()=>u,hw:()=>i,sG:()=>a});var r=e(70915);function o(t,n){return t[0]+=+n[0],t[1]+=+n[1],t}function i(t,n){const e=n.getRadius(),r=n.getCenter(),o=r[0],i=r[1],a=t[0],s=t[1];let c=a-o;const u=s-i;0===c&&0===u&&(c=1);const f=Math.sqrt(c*c+u*u),l=o+e*c/f,h=i+e*u/f;return[l,h]}function a(t,n){const e=t[0],r=t[1],o=n[0],i=n[1],a=o[0],s=o[1],c=i[0],u=i[1],f=c-a,l=u-s,h=0===f&&0===l?0:(f*(e-a)+l*(r-s))/(f*f+l*l||0);let d,g;return h<=0?(d=a,g=s):h>=1?(d=c,g=u):(d=a+h*f,g=s+h*l),[d,g]}function s(t,n){let e=!0;for(let r=t.length-1;r>=0;--r)if(t[r]!=n[r]){e=!1;break}return e}function c(t,n){const e=Math.cos(n),r=Math.sin(n),o=t[0]*e-t[1]*r,i=t[1]*e+t[0]*r;return t[0]=o,t[1]=i,t}function u(t,n){return t[0]*=n,t[1]*=n,t}function f(t,n){const e=t[0]-n[0],r=t[1]-n[1];return e*e+r*r}function l(t,n){return Math.sqrt(f(t,n))}function h(t,n){return f(t,a(t,n))}function d(t,n){if(n.canWrapX()){const e=(0,r.RG)(n.getExtent()),o=g(t,n,e);o&&(t[0]-=o*e)}return t}function g(t,n,e){const o=n.getExtent();let i=0;return n.canWrapX()&&(t[0]<o[0]||t[0]>o[2])&&(e=e||(0,r.RG)(o),i=Math.floor((t[0]-o[0])/e)),i}},70915:(t,n,e)=>{e.d(n,{$C:()=>v,$u:()=>F,Bg:()=>U,HY:()=>O,Im:()=>L,Ld:()=>c,Li:()=>z,Mx:()=>q,N:()=>g,NW:()=>y,Oq:()=>T,Py:()=>W,QJ:()=>j,R:()=>A,R8:()=>p,RG:()=>k,Rj:()=>l,S5:()=>d,Tr:()=>o,UG:()=>G,Vy:()=>w,WU:()=>N,X$:()=>E,Ym:()=>u,Yw:()=>I,_N:()=>S,aI:()=>P,aZ:()=>M,dP:()=>m,k_:()=>C,ms:()=>f,o8:()=>s,q1:()=>R,qF:()=>_,r:()=>a,sB:()=>x,vz:()=>h});var r=e(11580);function o(t){const n=d();for(let e=0,r=t.length;e<r;++e)v(n,t[e]);return n}function i(t,n,e){const r=Math.min.apply(null,t),o=Math.min.apply(null,n),i=Math.max.apply(null,t),a=Math.max.apply(null,n);return g(r,o,i,a,e)}function a(t,n,e){return e?(e[0]=t[0]-n,e[1]=t[1]-n,e[2]=t[2]+n,e[3]=t[3]+n,e):[t[0]-n,t[1]-n,t[2]+n,t[3]+n]}function s(t,n){return n?(n[0]=t[0],n[1]=t[1],n[2]=t[2],n[3]=t[3],n):t.slice()}function c(t,n,e){let r,o;return r=n<t[0]?t[0]-n:t[2]<n?n-t[2]:0,o=e<t[1]?t[1]-e:t[3]<e?e-t[3]:0,r*r+o*o}function u(t,n){return l(t,n[0],n[1])}function f(t,n){return t[0]<=n[0]&&n[2]<=t[2]&&t[1]<=n[1]&&n[3]<=t[3]}function l(t,n,e){return t[0]<=n&&n<=t[2]&&t[1]<=e&&e<=t[3]}function h(t,n){const e=t[0],o=t[1],i=t[2],a=t[3],s=n[0],c=n[1];let u=r.A.UNKNOWN;return s<e?u|=r.A.LEFT:s>i&&(u|=r.A.RIGHT),c<o?u|=r.A.BELOW:c>a&&(u|=r.A.ABOVE),u===r.A.UNKNOWN&&(u=r.A.INTERSECTING),u}function d(){return[1/0,1/0,-1/0,-1/0]}function g(t,n,e,r,o){return o?(o[0]=t,o[1]=n,o[2]=e,o[3]=r,o):[t,n,e,r]}function M(t){return g(1/0,1/0,-1/0,-1/0,t)}function m(t,n){const e=t[0],r=t[1];return g(e,r,e,r,n)}function w(t,n,e,r,o){const i=M(o);return p(i,t,n,e,r)}function P(t,n){return t[0]==n[0]&&t[2]==n[2]&&t[1]==n[1]&&t[3]==n[3]}function E(t,n){return n[0]<t[0]&&(t[0]=n[0]),n[2]>t[2]&&(t[2]=n[2]),n[1]<t[1]&&(t[1]=n[1]),n[3]>t[3]&&(t[3]=n[3]),t}function v(t,n){n[0]<t[0]&&(t[0]=n[0]),n[0]>t[2]&&(t[2]=n[0]),n[1]<t[1]&&(t[1]=n[1]),n[1]>t[3]&&(t[3]=n[1])}function p(t,n,e,r,o){for(;e<r;e+=o)b(t,n[e],n[e+1]);return t}function b(t,n,e){t[0]=Math.min(t[0],n),t[1]=Math.min(t[1],e),t[2]=Math.max(t[2],n),t[3]=Math.max(t[3],e)}function x(t,n){let e;return e=n(A(t)),e||(e=n(C(t)),e||(e=n(N(t)),e||(e=n(W(t)),e||!1)))}function G(t){let n=0;return L(t)||(n=k(t)*T(t)),n}function A(t){return[t[0],t[1]]}function C(t){return[t[2],t[1]]}function R(t){return[(t[0]+t[2])/2,(t[1]+t[3])/2]}function _(t,n){let e;if("bottom-left"===n)e=A(t);else if("bottom-right"===n)e=C(t);else if("top-left"===n)e=W(t);else{if("top-right"!==n)throw new Error("Invalid corner");e=N(t)}return e}function U(t,n,e,r,o){const[i,a,s,c,u,f,l,h]=I(t,n,e,r);return g(Math.min(i,s,u,l),Math.min(a,c,f,h),Math.max(i,s,u,l),Math.max(a,c,f,h),o)}function I(t,n,e,r){const o=n*r[0]/2,i=n*r[1]/2,a=Math.cos(e),s=Math.sin(e),c=o*a,u=o*s,f=i*a,l=i*s,h=t[0],d=t[1];return[h-c+l,d-u-f,h-c-l,d-u+f,h+c-l,d+u+f,h+c+l,d+u-f,h-c+l,d-u-f]}function T(t){return t[3]-t[1]}function S(t,n,e){const r=e||d();return O(t,n)?(t[0]>n[0]?r[0]=t[0]:r[0]=n[0],t[1]>n[1]?r[1]=t[1]:r[1]=n[1],t[2]<n[2]?r[2]=t[2]:r[2]=n[2],t[3]<n[3]?r[3]=t[3]:r[3]=n[3]):M(r),r}function W(t){return[t[0],t[3]]}function N(t){return[t[2],t[3]]}function k(t){return t[2]-t[0]}function O(t,n){return t[0]<=n[2]&&t[2]>=n[0]&&t[1]<=n[3]&&t[3]>=n[1]}function L(t){return t[2]<t[0]||t[3]<t[1]}function F(t,n){return n?(n[0]=t[0],n[1]=t[1],n[2]=t[2],n[3]=t[3],n):t}function q(t,n,e){let o=!1;const i=h(t,n),a=h(t,e);if(i===r.A.INTERSECTING||a===r.A.INTERSECTING)o=!0;else{const s=t[0],c=t[1],u=t[2],f=t[3],l=n[0],h=n[1],d=e[0],g=e[1],M=(g-h)/(d-l);let m,w;a&r.A.ABOVE&&!(i&r.A.ABOVE)&&(m=d-(g-f)/M,o=m>=s&&m<=u),o||!(a&r.A.RIGHT)||i&r.A.RIGHT||(w=g-(d-u)*M,o=w>=c&&w<=f),o||!(a&r.A.BELOW)||i&r.A.BELOW||(m=d-(g-c)/M,o=m>=s&&m<=u),o||!(a&r.A.LEFT)||i&r.A.LEFT||(w=g-(d-s)*M,o=w>=c&&w<=f)}return o}function y(t,n,e,r){if(L(t))return M(e);let o=[];if(r>1){const n=t[2]-t[0],e=t[3]-t[1];for(let i=0;i<r;++i)o.push(t[0]+n*i/r,t[1],t[2],t[1]+e*i/r,t[2]-n*i/r,t[3],t[0],t[3]-e*i/r)}else o=[t[0],t[1],t[2],t[1],t[2],t[3],t[0],t[3]];n(o,o,2);const a=[],s=[];for(let i=0,c=o.length;i<c;i+=2)a.push(o[i]),s.push(o[i+1]);return i(a,s,e)}function z(t,n){const e=n.getExtent(),r=R(t);if(n.canWrapX()&&(r[0]<e[0]||r[0]>=e[2])){const n=k(e),o=Math.floor((r[0]-e[0])/n),i=o*n;t[0]-=i,t[2]-=i}return t}function j(t,n,e){if(n.canWrapX()){const r=n.getExtent();if(!isFinite(t[0])||!isFinite(t[2]))return[[r[0],t[1],r[2],t[3]]];z(t,n);const o=k(r);if(k(t)>o&&!e)return[[r[0],t[1],r[2],t[3]]];if(t[0]<r[0])return[[t[0]+o,t[1],r[2],t[3]],[r[0],t[1],t[2],t[3]]];if(t[2]>r[2])return[[t[0],t[1],r[2],t[3]],[r[0],t[1],t[2]-o,t[3]]]}return[t]}},11580:(t,n,e)=>{e.d(n,{A:()=>r});const r={UNKNOWN:0,INTERSECTING:1,ABOVE:2,RIGHT:4,BELOW:8,LEFT:16}},61597:(t,n,e)=>{function r(t,n,e){return Math.min(Math.max(t,n),e)}function o(t,n,e,r,o,a){const s=o-e,c=a-r;if(0!==s||0!==c){const i=((t-e)*s+(n-r)*c)/(s*s+c*c);i>1?(e=o,r=a):i>0&&(e+=s*i,r+=c*i)}return i(t,n,e,r)}function i(t,n,e,r){const o=e-t,i=r-n;return o*o+i*i}function a(t){const n=t.length;for(let r=0;r<n;r++){let e=r,o=Math.abs(t[r][r]);for(let a=r+1;a<n;a++){const n=Math.abs(t[a][r]);n>o&&(o=n,e=a)}if(0===o)return null;const i=t[e];t[e]=t[r],t[r]=i;for(let a=r+1;a<n;a++){const e=-t[a][r]/t[r][r];for(let o=r;o<n+1;o++)r==o?t[a][o]=0:t[a][o]+=e*t[r][o]}}const e=new Array(n);for(let r=n-1;r>=0;r--){e[r]=t[r][n]/t[r][r];for(let o=r-1;o>=0;o--)t[o][n]-=t[o][r]*e[r]}return e}function s(t){return t*Math.PI/180}function c(t,n){const e=t%n;return e*n<0?e+n:e}function u(t,n,e){return t+e*(n-t)}function f(t,n){const e=Math.pow(10,n);return Math.round(t*e)/e}function l(t,n){return Math.floor(f(t,n))}function h(t,n){return Math.ceil(f(t,n))}e.d(n,{Cc:()=>u,KU:()=>a,Mg:()=>f,Q1:()=>o,RI:()=>l,eh:()=>s,hG:()=>i,mk:()=>h,qE:()=>r,xP:()=>c})},89718:(t,n,e)=>{e.r(n),e.d(n,{METERS_PER_UNIT:()=>P.I,Projection:()=>r.A,addCommon:()=>ft,addCoordinateTransforms:()=>X,addEquivalentProjections:()=>F,addEquivalentTransforms:()=>q,addProjection:()=>N,addProjections:()=>k,clearAllProjections:()=>y,clearUserProjection:()=>tt,cloneTransform:()=>S,createProjection:()=>z,createSafeCoordinateTransform:()=>ut,createTransformFromCoordinateTransform:()=>j,disableCoordinateWarning:()=>T,equivalent:()=>$,fromLonLat:()=>B,fromUserCoordinate:()=>ot,fromUserExtent:()=>at,fromUserResolution:()=>ct,get:()=>O,getPointResolution:()=>L,getTransform:()=>V,getTransformFromProjections:()=>J,getUserProjection:()=>nt,identityTransform:()=>W,setUserProjection:()=>Z,toLonLat:()=>Q,toUserCoordinate:()=>rt,toUserExtent:()=>it,toUserResolution:()=>st,transform:()=>H,transformExtent:()=>K,transformWithProjections:()=>Y,useGeographic:()=>et});var r=e(95286);const o=6378137,i=Math.PI*o,a=[-i,-i,i,i],s=[-180,-85,180,85],c=o*Math.log(Math.tan(Math.PI/2));class u extends r.A{constructor(t){super({code:t,units:"m",extent:a,global:!0,worldExtent:s,getPointResolution:function(t,n){return t/Math.cosh(n[1]/o)}})}}const f=[new u("EPSG:3857"),new u("EPSG:102100"),new u("EPSG:102113"),new u("EPSG:900913"),new u("http://www.opengis.net/def/crs/EPSG/0/3857"),new u("http://www.opengis.net/gml/srs/epsg.xml#3857")];function l(t,n,e){const r=t.length;e=e>1?e:2,void 0===n&&(n=e>2?t.slice():new Array(r));for(let a=0;a<r;a+=e){n[a]=i*t[a]/180;let e=o*Math.log(Math.tan(Math.PI*(+t[a+1]+90)/360));e>c?e=c:e<-c&&(e=-c),n[a+1]=e}return n}function h(t,n,e){const r=t.length;e=e>1?e:2,void 0===n&&(n=e>2?t.slice():new Array(r));for(let a=0;a<r;a+=e)n[a]=180*t[a]/i,n[a+1]=360*Math.atan(Math.exp(t[a+1]/o))/Math.PI-90;return n}const d=6378137,g=[-180,-90,180,90],M=Math.PI*d/180;class m extends r.A{constructor(t,n){super({code:t,units:"degrees",extent:g,axisOrientation:n,global:!0,metersPerUnit:M,worldExtent:g})}}const w=[new m("CRS:84"),new m("EPSG:4326","neu"),new m("urn:ogc:def:crs:OGC:1.3:CRS84"),new m("urn:ogc:def:crs:OGC:2:84"),new m("http://www.opengis.net/def/crs/OGC/1.3/CRS84"),new m("http://www.opengis.net/gml/srs/epsg.xml#4326","neu"),new m("http://www.opengis.net/def/crs/EPSG/0/4326","neu")];var P=e(8100);let E={};function v(){E={}}function p(t){return E[t]||E[t.replace(/urn:(x-)?ogc:def:crs:EPSG:(.*:)?(\w+)$/,"EPSG:$3")]||null}function b(t,n){E[t]=n}var x=e(73158),G=e(70915),A=e(61597),C=e(6933);const R=6371008.8;function _(t,n,e){e=e||R;const r=(0,A.eh)(t[1]),o=(0,A.eh)(n[1]),i=(o-r)/2,a=(0,A.eh)(n[0]-t[0])/2,s=Math.sin(i)*Math.sin(i)+Math.sin(a)*Math.sin(a)*Math.cos(r)*Math.cos(o);return 2*e*Math.atan2(Math.sqrt(s),Math.sqrt(1-s))}var U=e(54422);let I=!0;function T(t){const n=void 0===t||t;I=!n}function S(t,n){if(void 0!==n)for(let e=0,r=t.length;e<r;++e)n[e]=t[e];else n=t.slice();return n}function W(t,n){if(void 0!==n&&t!==n){for(let e=0,r=t.length;e<r;++e)n[e]=t[e];t=n}return t}function N(t){b(t.getCode(),t),(0,x.WQ)(t,t,S)}function k(t){t.forEach(N)}function O(t){return"string"===typeof t?p(t):t||null}function L(t,n,e,r){let o;t=O(t);const i=t.getPointResolutionFunc();if(i){if(o=i(n,e),r&&r!==t.getUnits()){const n=t.getMetersPerUnit();n&&(o=o*n/P.I[r])}}else{const i=t.getUnits();if("degrees"==i&&!r||"degrees"==r)o=n;else{const a=J(t,O("EPSG:4326"));if(a===W&&"degrees"!==i)o=n*t.getMetersPerUnit();else{let t=[e[0]-n/2,e[1],e[0]+n/2,e[1],e[0],e[1]-n/2,e[0],e[1]+n/2];t=a(t,t,2);const r=_(t.slice(0,2),t.slice(2,4)),i=_(t.slice(4,6),t.slice(6,8));o=(r+i)/2}const s=r?P.I[r]:t.getMetersPerUnit();void 0!==s&&(o/=s)}}return o}function F(t){k(t),t.forEach((function(n){t.forEach((function(t){n!==t&&(0,x.WQ)(n,t,S)}))}))}function q(t,n,e,r){t.forEach((function(t){n.forEach((function(n){(0,x.WQ)(t,n,e),(0,x.WQ)(n,t,r)}))}))}function y(){v(),(0,x.IU)()}function z(t,n){return t?"string"===typeof t?O(t):t:O(n)}function j(t){return function(n,e,r){const o=n.length;r=void 0!==r?r:2,e=void 0!==e?e:new Array(o);for(let i=0;i<o;i+=r){const o=t(n.slice(i,i+r)),a=o.length;for(let t=0,s=r;t<s;++t)e[i+t]=t>=a?n[i+t]:o[t]}return e}}function X(t,n,e,r){const o=O(t),i=O(n);(0,x.WQ)(o,i,j(e)),(0,x.WQ)(i,o,j(r))}function B(t,n){return T(),H(t,"EPSG:4326",void 0!==n?n:"EPSG:3857")}function Q(t,n){const e=H(t,void 0!==n?n:"EPSG:3857","EPSG:4326"),r=e[0];return(r<-180||r>180)&&(e[0]=(0,A.xP)(r+180,360)-180),e}function $(t,n){if(t===n)return!0;const e=t.getUnits()===n.getUnits();if(t.getCode()===n.getCode())return e;const r=J(t,n);return r===S&&e}function J(t,n){const e=t.getCode(),r=n.getCode();let o=(0,x.Jt)(e,r);return o||(o=W),o}function V(t,n){const e=O(t),r=O(n);return J(e,r)}function H(t,n,e){const r=V(n,e);return r(t,void 0,t.length)}function K(t,n,e,r){const o=V(n,e);return(0,G.NW)(t,o,void 0,r)}function Y(t,n,e){const r=J(n,e);return r(t)}let D=null;function Z(t){D=O(t)}function tt(){D=null}function nt(){return D}function et(){Z("EPSG:4326")}function rt(t,n){return D?H(t,n,D):t}function ot(t,n){return D?H(t,D,n):(I&&!(0,C.aI)(t,[0,0])&&t[0]>=-180&&t[0]<=180&&t[1]>=-90&&t[1]<=90&&(I=!1,(0,U.R8)("Call useGeographic() from ol/proj once to work with [longitude, latitude] coordinates.")),t)}function it(t,n){return D?K(t,n,D):t}function at(t,n){return D?K(t,D,n):t}function st(t,n){if(!D)return t;const e=O(n).getMetersPerUnit(),r=D.getMetersPerUnit();return e&&r?t*e/r:t}function ct(t,n){if(!D)return t;const e=O(n).getMetersPerUnit(),r=D.getMetersPerUnit();return e&&r?t*r/e:t}function ut(t,n,e){return function(r){let o,i;if(t.canWrapX()){const n=t.getExtent(),a=(0,G.RG)(n);r=r.slice(0),i=(0,C.U$)(r,t,a),i&&(r[0]=r[0]-i*a),r[0]=(0,A.qE)(r[0],n[0],n[2]),r[1]=(0,A.qE)(r[1],n[1],n[3]),o=e(r)}else o=e(r);return i&&n.canWrapX()&&(o[0]+=i*(0,G.RG)(n.getExtent())),o}}function ft(){F(f),F(w),q(w,f,l,h)}ft()},95286:(t,n,e)=>{e.d(n,{A:()=>i});var r=e(8100);class o{constructor(t){this.code_=t.code,this.units_=t.units,this.extent_=void 0!==t.extent?t.extent:null,this.worldExtent_=void 0!==t.worldExtent?t.worldExtent:null,this.axisOrientation_=void 0!==t.axisOrientation?t.axisOrientation:"enu",this.global_=void 0!==t.global&&t.global,this.canWrapX_=!(!this.global_||!this.extent_),this.getPointResolutionFunc_=t.getPointResolution,this.defaultTileGrid_=null,this.metersPerUnit_=t.metersPerUnit}canWrapX(){return this.canWrapX_}getCode(){return this.code_}getExtent(){return this.extent_}getUnits(){return this.units_}getMetersPerUnit(){return this.metersPerUnit_||r.I[this.units_]}getWorldExtent(){return this.worldExtent_}getAxisOrientation(){return this.axisOrientation_}isGlobal(){return this.global_}setGlobal(t){this.global_=t,this.canWrapX_=!(!t||!this.extent_)}getDefaultTileGrid(){return this.defaultTileGrid_}setDefaultTileGrid(t){this.defaultTileGrid_=t}setExtent(t){this.extent_=t,this.canWrapX_=!(!this.global_||!t)}setWorldExtent(t){this.worldExtent_=t}setGetPointResolution(t){this.getPointResolutionFunc_=t}getPointResolutionFunc(){return this.getPointResolutionFunc_}}const i=o},8100:(t,n,e)=>{e.d(n,{I:()=>i,q:()=>o});const r={9001:"m",9002:"ft",9003:"us-ft",9101:"radians",9102:"degrees"};function o(t){return r[t]}const i={radians:6370997/(2*Math.PI),degrees:2*Math.PI*6370997/360,ft:.3048,m:1,"us-ft":1200/3937}},84078:(t,n,e)=>{e.d(n,{kz:()=>s});var r=e(95286),o=e(89718),i=e(73158);let a=null;function s(t){a=t;const n=Object.keys(t.defs),e=n.length;let s,c;for(s=0;s<e;++s){const e=n[s];if(!(0,o.get)(e)){const n=t.defs(e);let i=n.units;i||"longlat"!==n.projName||(i="degrees"),(0,o.addProjection)(new r.A({code:e,axisOrientation:n.axis,metersPerUnit:n.to_meter,units:i}))}}for(s=0;s<e;++s){const r=n[s],a=(0,o.get)(r);for(c=0;c<e;++c){const e=n[c],s=(0,o.get)(e);if(!(0,i.Jt)(r,e))if(t.defs[r]===t.defs[e])(0,o.addEquivalentProjections)([a,s]);else{const n=t(r,e);(0,o.addCoordinateTransforms)(a,s,(0,o.createSafeCoordinateTransform)(a,s,n.forward),(0,o.createSafeCoordinateTransform)(s,a,n.inverse))}}}}},73158:(t,n,e)=>{e.d(n,{IU:()=>o,Jt:()=>a,WQ:()=>i});let r={};function o(){r={}}function i(t,n,e){const o=t.getCode(),i=n.getCode();o in r||(r[o]={}),r[o][i]=e}function a(t,n){let e;return t in r&&n in r[t]&&(e=r[t][n]),e}}}]);
//# sourceMappingURL=8828.bda341f2.js.map