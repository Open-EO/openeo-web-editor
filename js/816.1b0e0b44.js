"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[816,5865],{20816:(t,e,a)=>{a.r(e),a.d(e,{default:()=>u});var i=function(){var t=this,e=t._self._c;return t.canCopy?e("ShareInterface",{attrs:{id:"share-editor-copy",icon:"fa-columns",title:t.name,description:t.description,action:t.copy,actionDefaultIcon:"fa-clipboard",actionSuccessIcon:"fa-clipboard-check"},on:{stateChanged:t.updateState}}):t._e()},s=[],n=a(27166),r=a(45865),o=a(2566);const c={name:"ShareEditor",components:{ShareInterface:r["default"]},mixins:[n.A],data(){return{state:"default",canCopy:!1}},computed:{...o.A.mapState("editor",["viewerOptions"]),description(){return"error"===this.state?"Copying to clipboard failed":"success"===this.state?"Copied to clipboard":"Publish as an interactive app and copy the URL of the app to the clipboard — experimental"},name(){return this.$config.appName},editorUrl(){const t=new URL(window.location.href),e=new URLSearchParams(t.search);return e.set("result-type",this.type),e.set("result",this.url),"service"===this.type&&e.set("app~service",this.context.type),t.search=e,t.toString()}},methods:{updateState(t){this.state=t},copy(){return this.$clipboard(this.editorUrl)}},mounted(){this.canCopy=navigator&&navigator.clipboard&&"function"===typeof navigator.clipboard.writeText}},l=c;var p=a(81656),d=(0,p.A)(l,i,s,!1,null,null,null);const u=d.exports},45865:(t,e,a)=>{a.r(e),a.d(e,{default:()=>l});var i=function(){var t=this,e=t._self._c;return e("div",{class:t.classes,attrs:{id:t.id}},[e("div",{staticClass:"entry",on:{click:t.toggle}},[t.actionIcon?e("span",{staticClass:"toggle"},[t.actionIconIsImage?e("img",{attrs:{src:t.actionIcon}}):e("i",{class:t.faActionIcon})]):t._e(),t._t("summary",(function(){return[e("div",{staticClass:"summary"},[e("strong",[t.icon?e("span",{staticClass:"icon"},[t.iconIsImage?e("img",{attrs:{src:t.icon}}):e("i",{class:t.faIcon})]):t._e(),t._v(" "+t._s(t.title)+" ")]),t.description?[e("small",{staticClass:"sep"},[t._v("—")]),t.description?e("small",{staticClass:"description"},[t._v(t._s(t.description))]):t._e()]:t._e()],2)]}),{expanded:t.expanded,state:t.state,icon:t.icon},t.$props)],2),t.expanded?e("div",{staticClass:"customize"},[t._t("customize",null,{expanded:t.expanded},t.$props)],2):t._e()])},s=[];const n={name:"ShareInterface",props:{title:{type:String,default:null},description:{type:String,default:null},id:{type:String,default:null},data:{type:Object,default:()=>({})},action:{type:[Function,String],default:null},icon:{type:[String,Array],default:null},actionDefaultIcon:{type:[String,Array],default:"fa-share"},actionLoadingIcon:{type:[String,Array],default:"fa-spinner fa-spin"},actionSuccessIcon:{type:[String,Array],default:"fa-check"},actionErrorIcon:{type:[String,Array],default:"fa-times"}},data(){return{expanded:!1,state:"default"}},computed:{classes(){let t=["shareable"];return this.expanded&&t.push("expanded"),this.action?t.push(this.state):t.push("customizable"),t},iconIsImage(){return this.icon.includes("/")},faIcon(){return Array.isArray(this.icon)?this.icon:["fas",this.icon]},actionIconIsImage(){return this.actionIcon.includes("/")},actionIcon(){if("function"===typeof this.action){let t=this.state[0].toUpperCase()+this.state.substr(1);return this[`action${t}Icon`]}return"string"===typeof this.action?"fa-external-link-alt":this.expanded?"fa-caret-down":"fa-caret-right"},faActionIcon(){return Array.isArray(this.actionIcon)?this.actionIcon:["fas",this.actionIcon]}},watch:{state(t){this.$emit("stateChanged",this.state),"success"!==t&&"error"!==t||setTimeout((()=>this.state="default"),3e3)}},methods:{toggle(){if("function"===typeof this.action)try{this.state="loading";let t=this.action(this.data);t instanceof Promise?t.then((()=>this.state="success")).catch((()=>this.state="error")):this.state=t?"success":"error"}catch(t){this.state="error"}else"string"===typeof this.action?window.open(this.action,"_blank").focus():this.expanded=!this.expanded}}},r=n;var o=a(81656),c=(0,o.A)(r,i,s,!1,null,"6146c28c",null);const l=c.exports},27166:(t,e,a)=>{a.d(e,{A:()=>i});const i={props:{show:{type:Boolean,default:!1},url:{type:String,required:!0},title:{type:String,default:""},extra:{type:Object,default:()=>({})},context:{type:Object,required:!0},type:{type:String,required:!0}}}}}]);
//# sourceMappingURL=816.1b0e0b44.js.map