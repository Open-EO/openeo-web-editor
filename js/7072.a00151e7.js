"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[7072],{2571:(e,t,s)=>{s.d(t,{Z:()=>i});var l=s(65973);const a={cpu:"CPU usage",memory:"Memory usage",duration:"Wall time",network:"Network Transfer IO",disk:"Storage IO",storage:"Storage space"},i={computed:{hasUsageMetrics(){return l.Z.size(this.usage)>0}},filters:{usageLabel(e){return a[e]?a[e]:l.Z.prettifyString(e)},usageValue(e){return"number"===typeof e?e.toLocaleString():e}}}},63115:(e,t,s)=>{s.d(t,{Z:()=>u});var l=function(){var e=this,t=e._self._c;return t("li",{staticClass:"vue-component log-entry",class:{[e.log.level]:!0,expanded:e.expanded}},[t("summary",[t("span",{staticClass:"toggle",on:{click:function(t){return e.toggle()}}},[e._v("▸")]),t("span",{staticClass:"log-message",on:{click:function(t){!e.expanded&&e.toggle()}}},[e._v(e._s(e.log.message))]),e.log.level?t("ul",{staticClass:"badges small inline"},[e.relativeTime?t("li",{staticClass:"badge time",attrs:{title:e.formattedTime}},[e._v(e._s(e.relativeTime))]):e._e(),t("li",{staticClass:"badge",class:e.log.level},[e._v(e._s(e.log.level))])]):e._e()]),e.expanded?t("ul",{staticClass:"details"},[e.log.code?t("li",[e._v("Code: "+e._s(e.log.code))]):e._e(),Array.isArray(e.log.path)&&e.log.path.length?t("li",[e._v(" Path: "),t("ol",{staticClass:"path"},e._l(e.path,(function(s,l){return t("li",{key:l},[t("strong",[t("code",[e._v("#"+e._s(s.node_id))])]),s.process_id?[t("br"),e._v("Process: "),t("code",[e._v(e._s(s.process_id))]),s.namespace?[e._v(" in namespace "),t("code",[e._v(e._s(s.namespace))])]:e._e(),s.parameter?[t("br"),e._v("Parameter: "),t("code",[e._v(e._s(s.parameter))])]:e._e()]:e._e()],2)})),0)]):e._e(),e.hasData?t("li",[e._v(" Data: "),t("ObjectTree",{attrs:{data:e.log.data}})],1):e._e(),e.hasUsageMetrics?t("li",[e._v(" Usage metrics: "),t("ul",{staticClass:"usage"},e._l(e.usage,(function(s,l){return t("li",{key:l},[t("strong",{staticClass:"metric"},[e._v(e._s(e._f("usageLabel")(l)))]),e._v(": "+e._s(e._f("usageValue")(s.value))+" "),t("span",{staticClass:"unit"},[e._v(e._s(s.unit))])])})),0)]):e._e(),t("li",[e._v("ID: "+e._s(e.log.id))]),Array.isArray(e.log.links)&&e.log.links.length?t("li",[e._v(" Related Resources: "),t("LinkList",{attrs:{links:e.log.links}})],1):e._e()]):e._e()])},a=[],i=s(65973),r=s(2571);const n=[{length:1e3,unit:"ms"},{length:60,unit:"s"},{length:60,unit:"m"},{length:24,unit:"h"}],o={name:"Log",mixins:[r.Z],components:{LinkList:()=>s.e(8613).then(s.bind(s,38613)),ObjectTree:()=>s.e(2458).then(s.bind(s,2458))},props:{log:{type:Object,default:()=>[]},startTime:{type:String,default:null}},computed:{hasData(){return"undefined"!==typeof this.log.data},usage(){return this.log.usage},relativeTime(){if(!this.startTime||!this.log.time)return null;if(this.log.time===this.startTime)return i.Z.formatTimestamp(this.log.time);try{let e=new Date(this.startTime),t=new Date(this.log.time),s=t-e,l=[];for(let a of n){let e=s%a.length;if(s-=e,0!==e&&l.push(e+a.unit),s<a.length)break;s/=a.length}return"+"+l.reverse().join(" ")}catch(e){return null}},formattedTime(){return i.Z.formatTimestamp(this.log.time)},path(){return this.log.path.reverse()}},data(){return{expanded:!1}},methods:{toggle(){this.expanded=!this.expanded}}},c=o;var h=s(1001),d=(0,h.Z)(c,l,a,!1,null,null,null);const u=d.exports},27072:(e,t,s)=>{s.r(t),s.d(t,{default:()=>_});var l=function(){var e=this,t=e._self._c;return t("div",{staticClass:"log-viewer"},[null===e.logs?t("div",{staticClass:"no-data"},[t("i",{staticClass:"fas fa-spinner fa-spin fa-lg"}),e._v(" Loading logs...")]):t("Logs",{attrs:{logs:e.logs}})],1)},a=[],i=(s(57658),s(79879)),r=s(43334),n=function(){var e=this,t=e._self._c;return t("div",{staticClass:"vue-component logs"},[e.hasLogs?t("div",{staticClass:"log-container"},[t("div",{staticClass:"log-header"},[t("div",{staticClass:"log-search"},[null===e.externalSearchTerm?t("SearchBox",{attrs:{placeholder:"Search in Logs",minLength:2},model:{value:e.searchTerm,callback:function(t){e.searchTerm=t},expression:"searchTerm"}}):e._e(),t("MultiSelect",{attrs:{options:e.availableFields,trackBy:"id",label:"label",multiple:!0,searchable:!1,allowEmpty:!1,closeOnSelect:!1,limit:3,limitText:e=>`+ ${e}`,selectedLabel:"✓",deselectLabel:"␡",selectLabel:"+",title:"Select the log levels shown in the list of logs"},model:{value:e.fields,callback:function(t){e.fields=t},expression:"fields"}})],1),t("MultiSelect",{staticClass:"log-levels",attrs:{options:e.levels,multiple:!0,searchable:!1,allowEmpty:!1,closeOnSelect:!1,selectedLabel:"✓",deselectLabel:"␡",selectLabel:"+",title:"Select the log levels shown in the list of logs"},scopedSlots:e._u([{key:"tag",fn:function(s){return[t("span",{key:s.index,staticClass:"multiselect__tag",class:s.option},[t("span",{domProps:{textContent:e._s(s.option)}}),t("i",{staticClass:"multiselect__tag-icon",attrs:{tabindex:"1"},on:{keypress:function(t){return!t.type.indexOf("key")&&e._k(t.keyCode,"enter",13,t.key,"Enter")?null:(t.preventDefault(),s.remove(s.option))},mousedown:function(e){return e.preventDefault(),s.remove(s.option)}}})])]}}],null,!1,1224176521),model:{value:e.levelsShown,callback:function(t){e.levelsShown=t},expression:"levelsShown"}})],1),t("ul",{staticClass:"log-body"},e._l(e.logs,(function(s,l){return t("Log",{directives:[{name:"show",rawName:"v-show",value:e.shown[l],expression:"shown[i]"}],key:l,attrs:{log:s,startTime:e.startTime}})})),1)]):t("div",{staticClass:"log-empty"},[e._v("No logs available.")])])},o=[],c=s(65973),h=s(63115);const d={name:"Logs",components:{Log:h.Z,MultiSelect:()=>s.e(7907).then(s.t.bind(s,47907,23)),SearchBox:()=>Promise.resolve().then(s.bind(s,56450))},props:{logs:{type:Array,default:()=>[]},externalSearchTerm:{type:String,default:null}},data(){let e=["debug","info","warning","error"],t=[{id:"id",label:"ID"},{id:"code",label:"Code",default:!0},{id:"level",label:"Level"},{id:"message",label:"Message",default:!0},{id:"time",label:"Date and Time"},{id:"data",label:"Data",default:!0},{id:"path",label:"Path"},{id:"usage",label:"Usage Metrics"},{id:"links",label:"Related Resources"}];return{levels:e,levelsShown:e,searchTerm:"",availableFields:t,fields:t.filter((e=>Boolean(e.default)))}},computed:{shown(){return this.logs.map((e=>{if(!this.levelsShown.includes(e.level))return!1;if(this.searchTerm.length>=2){if(this.fields.length!=this.availableFields.length){let t=this.fields.map((e=>e.id));e=c.Z.pickFromObject(e,t)}return c.Z.search(this.searchTerm,e)}return!0}))},startTime(){if(this.hasLogs){let e=this.logs.find((e=>c.Z.isObject(e)&&"string"===typeof e.time&&e.time.length>10));if(c.Z.isObject(e)&&e.time)return e.time}return null},hasLogs(){return Array.isArray(this.logs)&&this.logs.length>0}},watch:{externalSearchTerm:{immediate:!0,handler(e){this.searchTerm="string"===typeof e?e:""}}},beforeCreate(){c.Z.enableHtmlProps(this)}},u=d;var g=s(1001),m=(0,g.Z)(u,n,o,!1,null,null,null);const p=m.exports,v={name:"LogViewer",mixins:[r.Z],components:{Logs:p},props:{data:{type:[Object,Array],required:!0}},data(){return{logs:null,syncTimer:null}},computed:{...i.Z.mapState(["connection"]),isJob(){return i.Z.isObject(this.data)&&"function"===typeof this.data.debugJob},isService(){return i.Z.isObject(this.data)&&"function"===typeof this.data.debugService},logIterator(){return this.isJob?this.data.debugJob():this.isService?this.data.debugService():null}},created(){this.isJob&&this.listen("jobStatusUpdated",this.onJobStatusUpdated)},mounted(){this.$emit("mounted",this)},beforeDestroy(){this.onHide()},methods:{onShow(){this.loadNext(),this.isJob?this.onJobStatusUpdated(this.data):this.isService&&this.startWatcher()},onHide(){this.stopWatcher()},onJobStatusUpdated(e){e===this.data&&"string"===typeof this.data.status&&(i.Z.isActiveJobStatusCode(this.data.status)?this.startWatcher():this.stopWatcher())},startWatcher(){null===this.syncTimer&&(this.syncTimer=setInterval(this.loadNext.bind(this),1e4))},stopWatcher(){null!==this.syncTimer&&(clearInterval(this.syncTimer),this.syncTimer=null)},async loadNext(){try{if(this.logIterator){let e=await this.logIterator.nextLogs();if(!Array.isArray(this.logs)||this.logs.length>0&&e[0].id==this.logs[0].id)this.logs=e;else for(let t of e)this.logs.push(t)}else Array.isArray(this.data)&&!this.logs&&(this.logs=this.data)}catch(e){i.Z.exeption(this,e,"Loading logs failed")}}}},f=v;var b=(0,g.Z)(f,l,a,!1,null,null,null);const _=b.exports}}]);
//# sourceMappingURL=7072.a00151e7.js.map