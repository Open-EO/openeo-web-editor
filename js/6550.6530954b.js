"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[6550],{17834:(e,t,s)=>{s.d(t,{A:()=>l});var r=s(86975);const a={cpu:"CPU usage",memory:"Memory usage",duration:"Wall time",network:"Network Transfer IO",disk:"Storage IO",storage:"Storage space"},l={computed:{hasUsageMetrics(){return r.A.size(this.usage)>0}},filters:{usageLabel(e){return a[e]?a[e]:r.A.prettifyString(e)},usageValue(e){return"number"===typeof e?e.toLocaleString():e}}}},66622:(e,t,s)=>{s.d(t,{A:()=>c});var r=function(){var e=this,t=e._self._c;return t("li",{staticClass:"vue-component log-entry",class:{[e.log.level]:!0,expanded:e.expanded}},[t("summary",[t("span",{staticClass:"toggle",on:{click:function(t){return e.toggle()}}},[e._v("▸")]),t("span",{staticClass:"log-message",on:{click:function(t){!e.expanded&&e.toggle()}}},[e._v(e._s(e.log.message))]),e.log.level?t("ul",{staticClass:"badges small inline"},[e.relativeTime?t("li",{staticClass:"badge time",attrs:{title:e.formattedTime}},[e._v(e._s(e.relativeTime))]):e._e(),t("li",{staticClass:"badge",class:e.log.level},[e._v(e._s(e.log.level))])]):e._e()]),e.expanded?t("ul",{staticClass:"details"},[e.log.code?t("li",[e._v("Code: "+e._s(e.log.code))]):e._e(),Array.isArray(e.log.path)&&e.log.path.length?t("li",[e._v(" Path: "),t("ol",{staticClass:"path"},e._l(e.path,(function(s,r){return t("li",{key:r},[t("strong",[t("code",[e._v("#"+e._s(s.node_id))])]),s.process_id?[t("br"),e._v("Process: "),t("code",[e._v(e._s(s.process_id))]),s.namespace?[e._v(" in namespace "),t("code",[e._v(e._s(s.namespace))])]:e._e(),s.parameter?[t("br"),e._v("Parameter: "),t("code",[e._v(e._s(s.parameter))])]:e._e()]:e._e()],2)})),0)]):e._e(),e.hasData?t("li",[e._v(" Data: "),t("ObjectTree",{attrs:{data:e.log.data}})],1):e._e(),e.hasUsageMetrics?t("li",[e._v(" Usage metrics: "),t("ul",{staticClass:"usage"},e._l(e.usage,(function(s,r){return t("li",{key:r},[t("strong",{staticClass:"metric"},[e._v(e._s(e._f("usageLabel")(r)))]),e._v(": "+e._s(e._f("usageValue")(s.value))+" "),t("span",{staticClass:"unit"},[e._v(e._s(s.unit))])])})),0)]):e._e(),t("li",[e._v("ID: "+e._s(e.log.id))]),Array.isArray(e.log.links)&&e.log.links.length?t("li",[e._v(" Related Resources: "),t("LinkList",{attrs:{links:e.log.links}})],1):e._e()]):e._e()])},a=[],l=s(86975),i=s(17834);const o=[{length:1e3,unit:"ms"},{length:60,unit:"s"},{length:60,unit:"m"},{length:24,unit:"h"}],n={name:"Log",mixins:[i.A],components:{LinkList:()=>s.e(2810).then(s.bind(s,52810)),ObjectTree:()=>s.e(2327).then(s.bind(s,2327))},props:{log:{type:Object,default:()=>[]},startTime:{type:String,default:null}},computed:{hasData(){return"undefined"!==typeof this.log.data},usage(){return this.log.usage},relativeTime(){if(!this.startTime||!this.log.time)return null;if(this.log.time===this.startTime)return l.A.formatTimestamp(this.log.time);try{let e=new Date(this.startTime),t=new Date(this.log.time),s=t-e,r=[];for(let a of o){let e=s%a.length;if(s-=e,0!==e&&r.push(e+a.unit),s<a.length)break;s/=a.length}return"+"+r.reverse().join(" ")}catch(e){return null}},formattedTime(){return l.A.formatTimestamp(this.log.time)},path(){return this.log.path.reverse()}},data(){return{expanded:!1}},methods:{toggle(){this.expanded=!this.expanded}}},g=n;var u=s(81656),d=(0,u.A)(g,r,a,!1,null,null,null);const c=d.exports},86550:(e,t,s)=>{s.r(t),s.d(t,{default:()=>c});var r=function(){var e=this,t=e._self._c;return t("Modal",{attrs:{width:"50%",title:e.title},on:{closed:function(t){return e.$emit("closed")},shown:e.expand}},[t("ul",{staticClass:"error-modal"},[t("Log",{ref:"log",attrs:{log:e.log}})],1)])},a=[],l=s(94679),i=s(66622),o=s(2566);const n={name:"ErrorModal",components:{Log:i.A,Modal:l.A},props:{error:{type:Error,default:()=>({})}},computed:{log(){return{id:this.error.id,code:this.error.code,level:"error",message:this.error.message,time:(new Date).toISOString(),data:this.error,links:this.error.links}},title(){if("string"===typeof this.error.code&&this.error.code.length>0){let e=o.A.prettifyString(this.error.code);return`Error: ${e}`}return"Error"}},methods:{expand(){this.$nextTick((()=>{this.$refs.log&&!this.$refs.log.expanded&&this.$refs.log.toggle()}))}}},g=n;var u=s(81656),d=(0,u.A)(g,r,a,!1,null,null,null);const c=d.exports}}]);
//# sourceMappingURL=6550.6530954b.js.map