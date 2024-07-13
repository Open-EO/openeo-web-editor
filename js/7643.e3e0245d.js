"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[7643],{7643:(t,s,e)=>{e.r(s),e.d(s,{default:()=>d});var i=function(){var t=this,s=t._self._c;return s("Modal",{attrs:{show:t.show,title:t.title},on:{closed:function(s){return t.$emit("closed")}}},[0==t.listCount?s("strong",{staticClass:"listEmpty"},[t._v("No data available.")]):s("ul",{staticClass:"modal-list"},t._l(t.listItems,(function(e,i){return s("li",{key:i,on:{click:function(s){return t.doMainListAction(e,i)}}},[s("strong",[t._v(t._s(Array.isArray(t.listItems)?e:i))]),t._l(t.otherListActions,(function(o){return s("button",{key:o.icon,attrs:{type:"button",title:o.title},on:{click:function(s){return s.preventDefault(),s.stopPropagation(),t.doListAction(e,i,o.callback)}}},[s("i",{class:"fas fa-"+o.icon})])}))],2)})),0)])},o=[],n=e(2566),a=e(94679);const l={name:"ListModal",components:{Modal:a.A},props:{title:{type:String,default:null},list:{type:Array,default:()=>[]},listActions:{type:Array,default:()=>[]}},data(){return{show:!0}},computed:{listCount(){return n.A.size(this.listItems)},listItems(){return"function"==typeof this.list?this.list():this.list},otherListActions(){return Array.isArray(this.listActions)&&this.listActions.length>1?this.listActions.slice(1):[]}},methods:{doListAction(t,s,e){const i=e(t,s);!0===i&&(this.show=!1)},doMainListAction(t,s){this.listActions.length>0&&this.doListAction(t,s,this.listActions[0].callback)}}},r=l;var u=e(81656),c=(0,u.A)(r,i,o,!1,null,"620ec62c",null);const d=c.exports},94679:(t,s,e)=>{e.d(s,{A:()=>d});var i=function(){var t=this,s=t._self._c;return s("div",{staticClass:"modal",style:{"z-index":t.zIndex},on:{mousedown:t.backgroundClose}},[s(t.containerTag,{ref:"container",tag:"component",staticClass:"modal-container",class:{smooth:t.smooth},style:t.style,on:{submit:function(s){return s.preventDefault(),s.stopPropagation(),t.submitFunction.apply(null,arguments)}}},[s("header",{staticClass:"modal-header",on:{mousedown:t.startMove}},[t._t("header",(function(){return[s("h2",[t._v(t._s(t.title))]),s("span",{staticClass:"close",on:{click:t.close}},[s("i",{staticClass:"fa fa-times",attrs:{"aria-hidden":"true"}})])]}))],2),s("main",{staticClass:"modal-content"},[t._t("default")],2),s("footer",{staticClass:"modal-footer"},[t._t("footer",(function(){return[t.submitFunction?s("button",{attrs:{type:"submit"}},[t._v(t._s(t.submitButtonText))]):t._e()]}))],2)])],1)},o=[],n=e(61663),a=e(2566);const l={name:"Modal",mixins:[n.A],props:{title:{type:String,default:null},minWidth:{type:String,default:null},width:{type:String,default:"auto"},show:{type:Boolean,default:!0},submitFunction:{type:Function,default:null},submitButtonText:{type:String,default:"Submit"}},data(){return{zIndex:1e3,position:null,dragPosition:null,smooth:!1}},computed:{...a.A.mapState("editor",["hightestModalZIndex"]),style(){let t={width:this.width};return this.minWidth&&(t["min-width"]=this.minWidth),Array.isArray(this.position)&&(t.position="absolute",t.left=this.position[0]+"px",t.top=this.position[1]+"px"),t},containerTag(){return this.submitFunction?"form":"div"}},watch:{show:{immediate:!0,handler(t){t?this.open():this.close()}},width(){this.smoothResize()},minWidth(){this.smoothResize()}},methods:{...a.A.mapMutations("editor",["openModal","closeModal"]),smoothResize(){this.smooth=!0,setTimeout((()=>this.smooth=!1),600)},submit(t){this.submitFunction(t)},open(){this.openModal(),this.zIndex=this.hightestModalZIndex,window.addEventListener("keydown",this.escCloseListener),this.$emit("shown")},close(){window.removeEventListener("keydown",this.escCloseListener),this.closeModal(),this.$emit("closed")},startMove(t){"H2"!==t.target.tagName&&(this.dragPosition=[t.clientX,t.clientY],document.addEventListener("mousemove",this.move),document.addEventListener("mouseup",this.stopMove),t.preventDefault(),t.stopPropagation())},stopMove(){document.removeEventListener("mousemove",this.move),document.removeEventListener("mouseup",this.stopMove)},move(t){t.preventDefault(),this.position=[this.$refs.container.offsetLeft-(this.dragPosition[0]-t.clientX),this.$refs.container.offsetTop-(this.dragPosition[1]-t.clientY)],this.dragPosition=[t.clientX,t.clientY]},escCloseListener(t){if("Escape"==t.key)return this.close(),t.preventDefault(),t.stopPropagation(),!1},backgroundClose(t){t.target===this.$el&&this.close()}}},r=l;var u=e(81656),c=(0,u.A)(r,i,o,!1,null,null,null);const d=c.exports}}]);
//# sourceMappingURL=7643.e3e0245d.js.map