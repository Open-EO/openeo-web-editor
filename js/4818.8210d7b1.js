"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[4818],{14818:(t,s,i)=>{i.r(s),i.d(s,{default:()=>h});var n=function(){var t=this,s=t._self._c;return s("Modal",{attrs:{show:t.show,title:t.title},on:{closed:function(s){return t.$emit("closed")}}},[0==t.listCount?s("strong",{staticClass:"listEmpty"},[t._v("No data available.")]):s("ul",{staticClass:"modal-list"},t._l(t.listItems,(function(i,n){return s("li",{key:n,on:{click:function(s){return t.doMainListAction(i,n)}}},[s("strong",[t._v(t._s(Array.isArray(t.listItems)?i:n))]),t._l(t.otherListActions,(function(o){return s("button",{key:o.icon,attrs:{type:"button",title:o.title},on:{click:function(s){return s.preventDefault(),s.stopPropagation(),t.doListAction(i,n,o.callback)}}},[s("i",{class:"fas fa-"+o.icon})])}))],2)})),0)])},o=[],l=i(2566),e=i(94679);const a={name:"ListModal",components:{Modal:e.A},props:{title:{type:String,default:null},list:{type:Array,default:()=>[]},listActions:{type:Array,default:()=>[]}},data(){return{show:!0}},computed:{listCount(){return l.A.size(this.listItems)},listItems(){return"function"==typeof this.list?this.list():this.list},otherListActions(){return Array.isArray(this.listActions)&&this.listActions.length>1?this.listActions.slice(1):[]}},methods:{async doListAction(t,s,i){const n=await i(t,s);!0===n&&(this.show=!1)},async doMainListAction(t,s){this.listActions.length>0&&await this.doListAction(t,s,this.listActions[0].callback)}}},r=a;var c=i(81656),u=(0,c.A)(r,n,o,!1,null,"9e34dcd0",null);const h=u.exports}}]);
//# sourceMappingURL=4818.8210d7b1.js.map