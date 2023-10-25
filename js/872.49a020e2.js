"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[872,6823],{15554:(e,t,s)=>{s.d(t,{Z:()=>a});const a={components:{FederationNotice:()=>s.e(8407).then(s.bind(s,78407)),FederationMissingNotice:()=>s.e(3559).then(s.bind(s,73559))},props:{federation:{type:Object,default:()=>({})}}}},6823:(e,t,s)=>{s.r(t),s.d(t,{default:()=>d});var a=function(){var e=this,t=e._self._c;return t("div",{staticClass:"vue-component process-parameter"},[t("h4",[t("code",[e._v(e._s(e.parameter.name))]),e.parameter.optional?e._e():t("strong",{staticClass:"required",attrs:{title:"required"}},[e._v("*")]),e.hasDefault?t("code",{staticClass:"default"},[e._v(" = "+e._s(e.defaultValue))]):e._e()]),t("div",{staticClass:"details"},[e.parameter.description?t("Description",{attrs:{description:e.parameter.description,processUrl:e.processUrl}}):e._e(),!0===e.parameter.deprecated?t("DeprecationNotice",{attrs:{entity:"parameter"}}):e._e(),!0===e.parameter.experimental?t("ExperimentalNotice",{attrs:{entity:"parameter"}}):e._e(),e.parameter["federation:backends"]?t("FederationNotice",{attrs:{backends:e.parameter["federation:backends"],federation:e.federation,entity:"parameter"}}):e._e(),e.parameter.schema?t("div",{staticClass:"json-schema-container"},[t("JsonSchema",{attrs:{schema:e.parameter.schema,processUrl:e.processUrl}})],1):e._e()],1)])},i=[],o=s(15554);const n={name:"ProcessParameter",components:{DeprecationNotice:()=>s.e(1413).then(s.bind(s,71413)),Description:()=>Promise.all([s.e(8522),s.e(6795)]).then(s.bind(s,8522)),ExperimentalNotice:()=>s.e(7320).then(s.bind(s,87320)),JsonSchema:()=>s.e(783).then(s.bind(s,47187))},mixins:[o.Z],props:{parameter:{type:Object},processUrl:{type:String},...o.Z.props},computed:{hasDefault(){return"undefined"!==typeof this.parameter.default},defaultValue(){return JSON.stringify(this.parameter.default)}}},r=n;var l=s(1001),c=(0,l.Z)(r,a,i,!1,null,null,null);const d=c.exports},33522:(e,t,s)=>{s.d(t,{Z:()=>p});var a=function(){var e=this,t=e._self._c;return t("div",{staticClass:"modal",style:{"z-index":e.zIndex},on:{mousedown:e.backgroundClose}},[t(e.containerTag,{ref:"container",tag:"component",staticClass:"modal-container",class:{smooth:e.smooth},style:e.style,on:{submit:function(t){return t.preventDefault(),t.stopPropagation(),e.submitFunction.apply(null,arguments)}}},[t("header",{staticClass:"modal-header",on:{mousedown:e.startMove}},[e._t("header",(function(){return[t("h2",[e._v(e._s(e.title))]),t("span",{staticClass:"close",on:{click:e.close}},[t("i",{staticClass:"fa fa-times",attrs:{"aria-hidden":"true"}})])]}))],2),t("main",{staticClass:"modal-content"},[e._t("default")],2),t("footer",{staticClass:"modal-footer"},[e._t("footer",(function(){return[e.submitFunction?t("button",{attrs:{type:"submit"}},[e._v(e._s(e.submitButtonText))]):e._e()]}))],2)])],1)},i=[],o=s(43334),n=s(79879);const r={name:"Modal",mixins:[o.Z],props:{title:{type:String,default:null},minWidth:{type:String,default:null},width:{type:String,default:"auto"},show:{type:Boolean,default:!0},submitFunction:{type:Function,default:null},submitButtonText:{type:String,default:"Submit"}},data(){return{zIndex:1e3,position:null,dragPosition:null,smooth:!1}},computed:{...n.Z.mapState("editor",["hightestModalZIndex"]),style(){let e={width:this.width};return this.minWidth&&(e["min-width"]=this.minWidth),Array.isArray(this.position)&&(e.position="absolute",e.left=this.position[0]+"px",e.top=this.position[1]+"px"),e},containerTag(){return this.submitFunction?"form":"div"}},watch:{show:{immediate:!0,handler(e){e?this.open():this.close()}},width(){this.smoothResize()},minWidth(){this.smoothResize()}},methods:{...n.Z.mapMutations("editor",["openModal","closeModal"]),smoothResize(){this.smooth=!0,setTimeout((()=>this.smooth=!1),600)},submit(e){this.submitFunction(e)},open(){this.openModal(),this.zIndex=this.hightestModalZIndex,window.addEventListener("keydown",this.escCloseListener),this.$emit("shown")},close(){window.removeEventListener("keydown",this.escCloseListener),this.closeModal(),this.$emit("closed")},startMove(e){"H2"!==e.target.tagName&&(this.dragPosition=[e.clientX,e.clientY],document.addEventListener("mousemove",this.move),document.addEventListener("mouseup",this.stopMove),e.preventDefault(),e.stopPropagation())},stopMove(){document.removeEventListener("mousemove",this.move),document.removeEventListener("mouseup",this.stopMove)},move(e){e.preventDefault(),this.position=[this.$refs.container.offsetLeft-(this.dragPosition[0]-e.clientX),this.$refs.container.offsetTop-(this.dragPosition[1]-e.clientY)],this.dragPosition=[e.clientX,e.clientY]},escCloseListener(e){if("Escape"==e.key)return this.close(),e.preventDefault(),e.stopPropagation(),!1},backgroundClose(e){e.target===this.$el&&this.close()}}},l=r;var c=s(1001),d=(0,c.Z)(l,a,i,!1,null,null,null);const p=d.exports},50872:(e,t,s)=>{s.r(t),s.d(t,{default:()=>p});var a=function(){var e=this,t=e._self._c;return t("Modal",{attrs:{width:"50%",title:e.title},on:{closed:function(t){return e.$emit("closed")}}},[t("div",{staticClass:"processParameterModal"},["schema"===e.origin?t("p",{staticClass:"message info"},[t("i",{staticClass:"fas fa-info-circle"}),t("span",[e._v(" This is a parameter for a user-defined process. It is a value made available by the parent entity (usually another process or a secondary web service) that is executing this processes for further use. See below for details about this parameter: ")])]):e._e(),t("ProcessParameter",{attrs:{parameter:e.parameter}})],1)])},i=[],o=s(33522),n=s(6823);const r={name:"ProcessParameterModal",components:{Modal:o.Z,ProcessParameter:n["default"]},props:{parameter:{type:Object},origin:{type:String,default:"schema"}},computed:{title(){return this.parameter.name||"Unnamed Parameter"}}},l=r;var c=s(1001),d=(0,c.Z)(l,a,i,!1,null,null,null);const p=d.exports}}]);
//# sourceMappingURL=872.49a020e2.js.map