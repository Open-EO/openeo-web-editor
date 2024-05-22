"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[9224,2327,1194,7123,6843],{84542:(t,e,s)=>{s.d(e,{A:()=>a});const a={data(){return{canCopy:!1}},mounted(){this.canCopy=navigator&&navigator.clipboard&&"function"===typeof navigator.clipboard.writeText},methods:{copyText(t,e=null,s=null){if(this.canCopy){const a=navigator.clipboard.writeText(t);e&&a.then(e),s&&a.catch(s)}},toggleIcon(t,e){if(t){let s=t.innerText;t.innerText=e,setTimeout((()=>t.innerText=s),2e3)}}}}},2327:(t,e,s)=>{s.r(e),s.d(e,{default:()=>d});var a=function(){var t=this,e=t._self._c;return e("div",{staticClass:"vue-component object-tree",class:{inline:0===t.size}},[0===t.size?e("em",[t._v(t._s(t.format(t.data)))]):Array.isArray(t.data)?[e("ol",t._l(t.indicesShown,(function(s){return e("li",{key:s},[t.isStructured(t.data[s])?e("openeo-object-tree",{attrs:{data:t.data[s]}}):t.isUrl(t.data[s])?e("a",{attrs:{href:t.data[s],target:"_blank"}},[t._v(t._s(t.data[s]))]):t.format(t.data[s])?e("em",[t._v(t._s(t.format(t.data[s])))]):[t._v(t._s(t.data[s]))]],2)})),0),t.size!==t.indicesShown.length?e("button",{attrs:{type:"button"},on:{click:t.show}},[t._v("Show all "+t._s(t.data.length)+" entries")]):t._e()]:"object"===typeof t.data?e("ul",t._l(t.data,(function(s,a){return e("li",{key:a},[e("strong",[t._v(t._s(t.prettifyKey(a)))]),t._v(": "),t.isStructured(s)?e("openeo-object-tree",{attrs:{data:s}}):t.isUrl(s)?e("a",{attrs:{href:s,target:"_blank"}},[t._v(t._s(s))]):t.format(s)?e("em",[t._v(t._s(t.format(s)))]):[t._v(t._s(s))]],2)})),0):[t._v(t._s(t.data))]],2)},r=[],n=s(86975);const i={name:"ObjectTree",components:{"openeo-object-tree":()=>Promise.resolve().then(s.bind(s,2327))},props:{data:{default:null},collapseAfter:{type:Number,default:10}},data(){return{expand:!1}},computed:{isSingleValue(){return Array.isArray(this.data)&&1===this.data.length&&0===n.A.size(this.data[0])},size(){return"object"===typeof this.data?n.A.size(this.data):1},indicesShown(){if(!Array.isArray(this.data))return[];let t=this.data;return!this.expand&&null!==this.collapseAfter&&this.size>this.collapseAfter&&(t=Array(this.collapseAfter)),[...t.keys()]}},beforeCreate(){n.A.enableHtmlProps(this)},methods:{prettifyKey(t){return n.A.prettifyString(t)},show(){this.expand=!0},isStructured(t){return n.A.size(t)>0},format(t){return null===t?"N/A":!0===t?"✔️":!1===t?"❌":"object"===typeof t&&0===n.A.size(t)?"Empty":"function"===typeof t?"JavaScript Function":"symbol"===typeof t?"JavaScript Symbol":null},isUrl(t){return n.A.isUrl(t,!1)}}},o=i;var l=s(81656),c=(0,l.A)(o,a,r,!1,null,null,null);const d=c.exports},51255:(t,e,s)=>{s.r(e),s.d(e,{default:()=>f});var a=function(){var t=this,e=t._self._c;return e("li",{staticClass:"vue-component asset"},[e("h4",[e("span",[t._v(t._s(t.asset.title||t.id))]),Array.isArray(t.asset.roles)?e("ul",{staticClass:"badges roles"},t._l(t.asset.roles,(function(s){return e("li",{key:s,staticClass:"badge",class:"data"===s?"green":"secondary"},[t._v(t._s(s))])})),0):t._e()]),e("ul",{staticClass:"badges actions primary"},[e("li",{staticClass:"badge action download"},[e("a",{staticClass:"badge-fill",attrs:{href:t.asset.href,target:"_blank",download:""}},[e("span",{staticClass:"icon"},[t._v("💾")]),t._v(" Download "),t.fileFormat?[t._v(t._s(t.fileFormat))]:t._e()],2)]),e("li",{staticClass:"badge action copy",on:{click:function(e){return e.preventDefault(),e.stopPropagation(),t.copyURL(e,t.asset.href)}}},[e("span",{staticClass:"icon"},[t._v("📋")]),t._v(" Copy URL ")])]),t.asset.description?e("Description",{attrs:{description:t.asset.description,compact:!0}}):t._e(),e("StacFields",{attrs:{type:"Asset",metadata:t.asset,ignore:t.ignore,title:"",context:t.context,headingTag:"h5"}})],1)},r=[],n=s(50735),i=s(27261),o=s(67123),l=s(84542);const c={name:"Asset",components:{Description:i["default"],StacFields:o["default"]},mixins:[l.A],props:{asset:{type:Object,required:!0},id:{type:String,required:!0},context:{type:Object,default:()=>({})}},data(){return{ignore:["href","title","description","type","roles"]}},computed:{fileFormat(){return this.asset.type?n.Formatters.formatMediaType(this.asset.type):null}},methods:{copyURL(t,e){const s=t.composedPath()[0].querySelector(".icon");this.copyText(e,(()=>this.toggleIcon(s,"✅")),(()=>this.toggleIcon(s,"❌")))}}},d=c;var u=s(81656),p=(0,u.A)(d,a,r,!1,null,null,null);const f=p.exports},67123:(t,e,s)=>{s.r(e),s.d(e,{default:()=>m});var a=function(){var t=this,e=t._self._c;return e("section",{staticClass:"vue-component stac stac-fields metadata"},[t._l(t.fields,(function(s){return[e(t.headingTag,{key:s.extension,tag:"component",domProps:{innerHTML:t._s(s.label||"General")}}),e("section",{key:`section_${s.extension}`,staticClass:"group"},t._l(s.properties,(function(a,r){return e("div",{key:s.extension+r,staticClass:"tabular",class:{wrap:Boolean(a.custom||a.items)},attrs:{id:"field_"+r}},[e("label",{attrs:{title:r},domProps:{innerHTML:t._s(a.label)}}),e("div",{staticClass:"value"},[t._t(r,(function(){return[a.items?e("table",{staticClass:"table"},[e("thead",[e("tr",[Array.isArray(a.formatted)?t._e():e("th",[t._v(" ")]),t._l(a.itemOrder,(function(s){return e("th",{key:s,domProps:{innerHTML:t._s(a.items[s].label)}})}))],2)]),e("tbody",t._l(a.formatted,(function(s,r){return e("tr",{key:r},[Array.isArray(a.formatted)?t._e():e("th",[t._v(t._s(r))]),t._l(a.itemOrder,(function(a){return e("td",{key:`${a}_${r}`},[Array.isArray(s[a])?e("ol",{staticClass:"array"},t._l(s[a],(function(s,a){return e("li",{key:a},[e("span",{domProps:{innerHTML:t._s(s)}})])})),0):s[a]&&"object"===typeof s[a]?e("ul",{staticClass:"object"},t._l(s[a],(function(s,a){return e("li",{key:a},[e("strong",[t._v(t._s(t._f("key")(a)))]),t._v(": "),e("span",{domProps:{innerHTML:t._s(s)}})])})),0):e("div",{domProps:{innerHTML:t._s(s[a])}})])}))],2)})),0)]):"card4l:processing_chain"===r?e("Process",{staticClass:"inline",attrs:{process:a.value,provideDownload:!1,showGraph:!0}}):a.formatted?e("div",{staticClass:"formatted",domProps:{innerHTML:t._s(a.formatted)}}):[t._v(t._s(a.value))]]}),{prop:a,field:r})],2)])})),0)]}))],2)},r=[],n=s(50735),i=s.n(n),o=s(86975),l=s(2327);const c=["stac_version","stac_extensions","id","type","title","description","keywords","providers","license","extent","summaries","links","assets","item_assets","conformsTo","deprecated","cube:dimensions"];i().Registry.externalRenderer=!0;const d={name:"StacFields",components:{Process:()=>s.e(4279).then(s.bind(s,34279)),ObjectTree:l["default"]},props:{metadata:{type:Object,default:()=>({})},headingTag:{type:String,default:"h3"},ignore:{type:Array,default:()=>[]},type:{type:String,required:!0},context:{type:Object,default:()=>({})}},filters:{key:o.A.prettifyString},computed:{ignoreFn(){return this.ignore.length>0?t=>!this.ignore.includes(t):null},fields(){if("Collection"===this.type){let t=o.A.deepClone(this.metadata);o.A.isObject(t.summaries)||(t.summaries={});for(let e in t)c.includes(e)||(t.summaries[e]=[t[e]]);return i().formatSummaries(t,this.ignoreFn)}if("Item"===this.type)return i().formatItemProperties(this.metadata,this.ignoreFn);if("Asset"===this.type)return i().formatAsset(this.metadata,this.context,this.ignoreFn);throw new Error("Not implemented yet")}},methods:{label(t,e={}){return i().label(t,e)}}},u=d;var p=s(81656),f=(0,p.A)(u,a,r,!1,null,null,null);const m=f.exports}}]);
//# sourceMappingURL=9224.0d608f92.js.map