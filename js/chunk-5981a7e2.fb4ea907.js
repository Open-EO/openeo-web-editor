(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-5981a7e2"],{"17bb":function(t,a,e){"use strict";e.r(a);var r=function(){var t=this,a=t.$createElement,e=t._self._c||a;return e("div",{staticClass:"kernel-editor"},[e("div",{staticClass:"size"},[t._v(" Kernel Size (rows × columns): "),e("input",{attrs:{type:"number",min:"0",disabled:!t.editable},domProps:{value:t.rows},on:{blur:t.updateRows}}),t._v(" × "),e("input",{attrs:{type:"number",min:"0",disabled:!t.editable||0===t.rows},domProps:{value:t.cols},on:{blur:t.updateCols}})]),t.rows&&t.cols?e("div",{staticClass:"kernel"},[e("table",[e("tr",[e("th"),t._l(t.colsArray,(function(a){return e("th",{key:"header_"+a},[t._v(t._s(a))])}))],2),t._l(t.rowsArray,(function(a,r){return e("tr",{key:a},[e("th",[t._v(t._s(a))]),t._l(t.colsArray,(function(a,s){return e("td",{key:a},[t.editable?e("input",{directives:[{name:"model",rawName:"v-model",value:t.data[r][s],expression:"data[y][x]"}],attrs:{type:"number"},domProps:{value:t.data[r][s]},on:{input:function(a){a.target.composing||t.$set(t.data[r],s,a.target.value)}}}):e("span",{staticClass:"number"},[t._v(t._s(t.data[r][s]))])])}))],2)}))],2)]):e("p",{staticClass:"kernel"},[t._v("Empty kernel")])])},s=[],n=e("025e"),l={name:"Kernel",props:{value:{type:String,default:null},editable:{type:Boolean,default:!0}},data(){return{data:[]}},computed:{cols(){return this.data.reduce((t,a)=>Math.max(a.length,t),0)},colsArray(){return n["a"].range(1,this.cols)},rows(){return this.data.length},rowsArray(){return n["a"].range(1,this.rows)}},watch:{value:{immediate:!0,handler(t,a){t!==a&&(this.data=Array.isArray(t)?t:[])}},data:{deep:!0,handler(){this.$emit("input",this.data)}}},methods:{updateCols(t){let a=-1;try{a=Number.parseInt(t.target.value,10)}catch(e){}this.data=this.data.map(t=>n["a"].fitArray(t,a))},updateRows(t){let a=-1;try{a=Number.parseInt(t.target.value,10)}catch(e){}this.data=n["a"].fitArray(this.data,a,n["a"].newArray(this.cols))}}},i=l,u=(e("bb8f"),e("2877")),d=Object(u["a"])(i,r,s,!1,null,"2b1289cc",null);a["default"]=d.exports},bb8f:function(t,a,e){"use strict";e("da30")},da30:function(t,a,e){}}]);
//# sourceMappingURL=chunk-5981a7e2.fb4ea907.js.map