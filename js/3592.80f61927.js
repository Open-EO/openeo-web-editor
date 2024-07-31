"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[3592],{51001:(e,t,s)=>{s.r(t),s.d(t,{default:()=>u});var o=function(){var e=this,t=e._self._c;return e.content?t("Splitpanes",{staticClass:"default-theme",attrs:{horizontal:""}},[t("Pane",{attrs:{id:"table"}},[e.content?t("div",{staticClass:"tableViewer"},[t("table",[t("thead",[t("tr",e._l(e.header,(function(s,o){return t("th",{key:o},[0!==o?t("input",{directives:[{name:"model",rawName:"v-model",value:e.showCols,expression:"showCols"}],attrs:{type:"checkbox",title:"Add column to diagram"},domProps:{value:o,checked:Array.isArray(e.showCols)?e._i(e.showCols,o)>-1:e.showCols},on:{change:function(t){var s=e.showCols,a=t.target,r=!!a.checked;if(Array.isArray(s)){var n=o,h=e._i(s,n);a.checked?h<0&&(e.showCols=s.concat([n])):h>-1&&(e.showCols=s.slice(0,h).concat(s.slice(h+1)))}else e.showCols=r}}}):e._e(),t("br"),e._v(" "+e._s(s)+" ")])})),0)]),t("tbody",e._l(e.content,(function(s,o){return t("tr",{key:o},e._l(s,(function(s,a){return t(0===a?"th":"td",{key:a,tag:"component",class:typeof s},[0===a?t("input",{directives:[{name:"model",rawName:"v-model",value:e.showRows,expression:"showRows"}],attrs:{type:"checkbox",title:"Add row to diagram"},domProps:{value:o,checked:Array.isArray(e.showRows)?e._i(e.showRows,o)>-1:e.showRows},on:{change:function(t){var s=e.showRows,a=t.target,r=!!a.checked;if(Array.isArray(s)){var n=o,h=e._i(s,n);a.checked?h<0&&(e.showRows=s.concat([n])):h>-1&&(e.showRows=s.slice(0,h).concat(s.slice(h+1)))}else e.showRows=r}}}):e._e(),e._v(" "+e._s(e._f("locale")(s))+" ")])})),1)})),0)])]):t("em",[e._v("No data retrieved.")])]),e.chart?t("Pane",{attrs:{id:"chart",size:50}},[t("ScatterChart",e._b({},"ScatterChart",e.chart,!1))],1):e._e()],1):e._e()},a=[],r=(s(43375),s(39225),s(13972),s(99209),s(25714),s(17561),s(66197),s(44304)),n=s(38363),h=s(40772),i=s(75024);const l={name:"TableViewer",components:{Pane:r.Z,ScatterChart:n.A,Splitpanes:r.S},props:{data:{type:Object,required:!0}},data(){return{header:null,content:null,showRows:[],showCols:[]}},filters:{locale(e){return"number"===typeof e?e.toLocaleString():e}},computed:{chart(){if(0===this.showCols.length&&0===this.showRows.length)return null;if(this.showCols.length>0&&this.showRows.length>0)return{error:"You can only add either rows or columns to the diagram. Please unselect either all rows or all columns."};let e,t;return this.showCols.length>0?(e=this.content.map((e=>e[0])),t=this.showCols.map((e=>({label:this.header[e],data:this.content.map((t=>t[e]))})))):(e=this.header.slice(1),t=this.showRows.map((e=>({label:this.content[e][0],data:this.content[e].slice(1)})))),{labels:e,datasets:t}}},async created(){if(this.data instanceof h.A){let e=this.data.getData();Array.isArray(e)&&e.length>0&&(this.header=e.shift(),this.content=e,this.content.every((e=>!e||"number"===typeof e))||(this.header.unshift("Row"),this.content.forEach(((e,t)=>e.unshift(String(t+1))))))}else if(this.data instanceof i.A){let e=this.data.getData(),t=Object.keys(e),s=Object.values(e),o=new Set;s.forEach((e=>Object.keys(e).forEach((e=>o.add(e))))),this.header=Array.from(o),this.content=s.map((e=>this.header.map((t=>Array.isArray(e[t])&&1===e[t].length?e[t][0]:e[t])))),this.header.unshift(""),this.content.forEach(((e,s)=>e.unshift(t[s])))}else Utils.error(this,"The format is not supported to be shown in a table.")},mounted(){this.$emit("mounted",this)}},c=l;var d=s(81656),w=(0,d.A)(c,o,a,!1,null,null,null);const u=w.exports}}]);
//# sourceMappingURL=3592.80f61927.js.map