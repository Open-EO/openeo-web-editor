"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[4818],{14818:(t,e,s)=>{s.r(e),s.d(e,{default:()=>h});var i=function(){var t=this,e=t._self._c;return e("Modal",{attrs:{show:t.show,title:t.title},on:{closed:function(e){return t.$emit("closed")}}},[0==t.listCount?e("strong",{staticClass:"listEmpty"},[t._v("No data available.")]):e("ul",{staticClass:"modal-list"},t._l(t.listItems,(function(s,i){return e("li",{key:i,on:{click:function(e){return t.doMainListAction(s,i)}}},[e("strong",[t._v(t._s(Array.isArray(t.listItems)?s:i))]),t._l(t.otherListActions,(function(o){return e("button",{key:o.icon,attrs:{type:"button",title:o.title},on:{click:function(e){return e.preventDefault(),e.stopPropagation(),t.doListAction(s,i,o.callback)}}},[e("i",{class:"fas fa-"+o.icon})])}))],2)})),0)])},o=[],n=s(2566),a=s(23827);const l={name:"ListModal",components:{Modal:a.A},props:{title:{type:String,default:null},list:{type:Array,default:()=>[]},listActions:{type:Array,default:()=>[]}},data(){return{show:!0}},computed:{listCount(){return n.A.size(this.listItems)},listItems(){return"function"==typeof this.list?this.list():this.list},otherListActions(){return Array.isArray(this.listActions)&&this.listActions.length>1?this.listActions.slice(1):[]}},methods:{async doListAction(t,e,s){const i=await s(t,e);!0===i&&(this.show=!1)},async doMainListAction(t,e){this.listActions.length>0&&await this.doListAction(t,e,this.listActions[0].callback)}}},r=l;var u=s(81656),c=(0,u.A)(r,i,o,!1,null,"9e34dcd0",null);const h=c.exports},23827:(t,e,s)=>{s.d(e,{A:()=>h});var i=function(){var t=this,e=t._self._c;return e("div",{staticClass:"modal",style:{"z-index":t.zIndex},on:{mousedown:t.backgroundClose}},[e(t.containerTag,{ref:"container",tag:"component",staticClass:"modal-container",class:{smooth:t.smooth},style:t.style,on:{submit:function(e){return e.preventDefault(),e.stopPropagation(),t.submitFunction.apply(null,arguments)}}},[e("header",{staticClass:"modal-header",on:{mousedown:t.startMove}},[t._t("header",(function(){return[e("h2",[t._v(t._s(t.title))]),e("span",{staticClass:"close",on:{click:t.close}},[e("i",{staticClass:"fa fa-times",attrs:{"aria-hidden":"true"}})])]}))],2),e("main",{staticClass:"modal-content"},[t._t("default")],2),e("footer",{staticClass:"modal-footer"},[t._t("footer",(function(){return[t.submitFunction?e("button",{attrs:{type:"submit"}},[t._v(t._s(t.submitButtonText))]):t._e()]}))],2)])],1)},o=[],n=s(61663),a=s(2566);const l={name:"Modal",mixins:[n.A],props:{title:{type:String,default:null},minWidth:{type:String,default:null},width:{type:String,default:"auto"},height:{type:String,default:"auto"},show:{type:Boolean,default:!0},submitFunction:{type:Function,default:null},submitButtonText:{type:String,default:"Submit"}},data(){return{zIndex:1e3,position:null,dragPosition:null,smooth:!1}},computed:{...a.A.mapState("editor",["hightestModalZIndex"]),style(){let t={width:this.width};return this.minWidth&&(t["min-width"]=this.minWidth),this.height&&(t["height"]=this.height),Array.isArray(this.position)&&(t.position="absolute",t.left=this.position[0]+"px",t.top=this.position[1]+"px"),t},containerTag(){return this.submitFunction?"form":"div"}},watch:{show:{immediate:!0,handler(t){t?this.open():this.close()}},width(){this.smoothResize()},minWidth(){this.smoothResize()}},methods:{...a.A.mapMutations("editor",["openModal","closeModal"]),smoothResize(){this.smooth=!0,setTimeout((()=>this.smooth=!1),600)},submit(t){this.submitFunction(t)},open(){this.openModal(),this.zIndex=this.hightestModalZIndex,window.addEventListener("keydown",this.escCloseListener),this.$emit("shown")},close(){window.removeEventListener("keydown",this.escCloseListener),this.closeModal(),this.$emit("closed")},startMove(t){"H2"!==t.target.tagName&&(this.dragPosition=[t.clientX,t.clientY],document.addEventListener("mousemove",this.move),document.addEventListener("mouseup",this.stopMove),t.preventDefault(),t.stopPropagation())},stopMove(){document.removeEventListener("mousemove",this.move),document.removeEventListener("mouseup",this.stopMove)},move(t){t.preventDefault(),this.position=[this.$refs.container.offsetLeft-(this.dragPosition[0]-t.clientX),this.$refs.container.offsetTop-(this.dragPosition[1]-t.clientY)],this.dragPosition=[t.clientX,t.clientY]},escCloseListener(t){if("Escape"==t.key)return this.close(),t.preventDefault(),t.stopPropagation(),!1},backgroundClose(t){t.target===this.$el&&this.close()}}},r=l;var u=s(81656),c=(0,u.A)(r,i,o,!1,null,null,null);const h=c.exports}}]);
//# sourceMappingURL=4818.544d77b8.js.map