(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[2053],{94679:(t,e,o)=>{"use strict";o.d(e,{A:()=>d});var s=function(){var t=this,e=t._self._c;return e("div",{staticClass:"modal",style:{"z-index":t.zIndex},on:{mousedown:t.backgroundClose}},[e(t.containerTag,{ref:"container",tag:"component",staticClass:"modal-container",class:{smooth:t.smooth},style:t.style,on:{submit:function(e){return e.preventDefault(),e.stopPropagation(),t.submitFunction.apply(null,arguments)}}},[e("header",{staticClass:"modal-header",on:{mousedown:t.startMove}},[t._t("header",(function(){return[e("h2",[t._v(t._s(t.title))]),e("span",{staticClass:"close",on:{click:t.close}},[e("i",{staticClass:"fa fa-times",attrs:{"aria-hidden":"true"}})])]}))],2),e("main",{staticClass:"modal-content"},[t._t("default")],2),e("footer",{staticClass:"modal-footer"},[t._t("footer",(function(){return[t.submitFunction?e("button",{attrs:{type:"submit"}},[t._v(t._s(t.submitButtonText))]):t._e()]}))],2)])],1)},i=[],n=o(61663),r=o(2566);const a={name:"Modal",mixins:[n.A],props:{title:{type:String,default:null},minWidth:{type:String,default:null},width:{type:String,default:"auto"},show:{type:Boolean,default:!0},submitFunction:{type:Function,default:null},submitButtonText:{type:String,default:"Submit"}},data(){return{zIndex:1e3,position:null,dragPosition:null,smooth:!1}},computed:{...r.A.mapState("editor",["hightestModalZIndex"]),style(){let t={width:this.width};return this.minWidth&&(t["min-width"]=this.minWidth),Array.isArray(this.position)&&(t.position="absolute",t.left=this.position[0]+"px",t.top=this.position[1]+"px"),t},containerTag(){return this.submitFunction?"form":"div"}},watch:{show:{immediate:!0,handler(t){t?this.open():this.close()}},width(){this.smoothResize()},minWidth(){this.smoothResize()}},methods:{...r.A.mapMutations("editor",["openModal","closeModal"]),smoothResize(){this.smooth=!0,setTimeout((()=>this.smooth=!1),600)},submit(t){this.submitFunction(t)},open(){this.openModal(),this.zIndex=this.hightestModalZIndex,window.addEventListener("keydown",this.escCloseListener),this.$emit("shown")},close(){window.removeEventListener("keydown",this.escCloseListener),this.closeModal(),this.$emit("closed")},startMove(t){"H2"!==t.target.tagName&&(this.dragPosition=[t.clientX,t.clientY],document.addEventListener("mousemove",this.move),document.addEventListener("mouseup",this.stopMove),t.preventDefault(),t.stopPropagation())},stopMove(){document.removeEventListener("mousemove",this.move),document.removeEventListener("mouseup",this.stopMove)},move(t){t.preventDefault(),this.position=[this.$refs.container.offsetLeft-(this.dragPosition[0]-t.clientX),this.$refs.container.offsetTop-(this.dragPosition[1]-t.clientY)],this.dragPosition=[t.clientX,t.clientY]},escCloseListener(t){if("Escape"==t.key)return this.close(),t.preventDefault(),t.stopPropagation(),!1},backgroundClose(t){t.target===this.$el&&this.close()}}},l=a;var u=o(81656),c=(0,u.A)(l,s,i,!1,null,null,null);const d=c.exports},22053:(t,e,o)=>{"use strict";o.r(e),o.d(e,{default:()=>m});var s=function(){var t=this,e=t._self._c;return e("Modal",{attrs:{width:"70%",title:"Export / Share"},on:{closed:function(e){return t.$emit("closed")}}},[e("ul",{staticClass:"share-list"},t._l(t.components,(function(o){return e("li",{key:o},[e(o,t._b({tag:"component"},"component",t.componentProps,!1))],1)})),0)])},i=[],n=o(94679),r=o(73902),a=o(19306);const l=(a.A.supportedBatchJobSharingServices||[]).concat(a.A.supportedWebServiceSharingServices||[]);let u={Modal:n.A};for(let v of l)u[v]=()=>o(59539)(`./${v}.vue`);const c={name:"ShareModal",components:u,props:{url:{type:String,required:!0},title:{type:String,default:""},extra:{type:Object,default:()=>({})},context:{type:Object,required:!0}},computed:{components(){return this.context instanceof r.Job&&Array.isArray(a.A.supportedBatchJobSharingServices)?a.A.supportedBatchJobSharingServices:this.context instanceof r.Service&&Array.isArray(a.A.supportedWebServiceSharingServices)?a.A.supportedWebServiceSharingServices:[]},componentProps(){return{...this.$props,type:this.context.constructor.name.toLowerCase()}}}},d=c;var h=o(81656),p=(0,h.A)(d,s,i,!1,null,"0aa6cf11",null);const m=p.exports},59539:(t,e,o)=>{var s={"./CopyUrl.vue":[38976,8976],"./ShareEditor.vue":[71076,1076],"./ShareInterface.vue":[45865,5865],"./TwitterShare.vue":[30925,925]};function i(t){if(!o.o(s,t))return Promise.resolve().then((()=>{var e=new Error("Cannot find module '"+t+"'");throw e.code="MODULE_NOT_FOUND",e}));var e=s[t],i=e[0];return o.e(e[1]).then((()=>o(i)))}i.keys=()=>Object.keys(s),i.id=59539,t.exports=i}}]);
//# sourceMappingURL=2053.fedd3fbd.js.map