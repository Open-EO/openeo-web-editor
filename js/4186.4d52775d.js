"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[4186,7066],{35254:(t,e,s)=>{s.d(e,{A:()=>i});const i={components:{FederationNotice:()=>s.e(2604).then(s.bind(s,52604)),FederationMissingNotice:()=>s.e(5363).then(s.bind(s,35363))},props:{federation:{type:Object,default:()=>({})}}}},8588:(t,e,s)=>{s.r(e),s.d(e,{default:()=>b});var i=function(){var t=this,e=t._self._c;return e("Modal",{attrs:{width:"80%",title:t.collection.id},on:{closed:function(e){return t.$emit("closed")}}},[e("div",{staticClass:"docgen"},[e("Collection",{attrs:{data:t.collection}}),t.currentItems?e("section",[e("Items",{attrs:{items:t.currentItems},scopedSlots:t._u([{key:"item-location",fn:function(t){return[e("MapExtentViewer",{attrs:{footprint:t.geometry}})]}}],null,!1,635288746)}),e("div",{staticClass:"pagination"},[e("button",{attrs:{title:"Previous page",disabled:!t.hasPrevItems},on:{click:function(e){return t.paginate(-1)}}},[e("i",{staticClass:"fas fa-arrow-left"}),t._v(" Previous Page")]),e("button",{attrs:{title:"Next page",disabled:!t.hasNextItems},on:{click:function(e){return t.paginate(1)}}},[t._v("Next Page "),e("i",{staticClass:"fas fa-arrow-right"})])])],1):t._e()],1)])},o=[],n=s(94679),a=function(){var t=this,e=t._self._c;return e("VueCollection",{attrs:{data:t.data},scopedSlots:t._u([{key:"spatial-extents",fn:function(s){return[s.worldwide?e("span",{staticClass:"worldwide"},[e("i",{staticClass:"fas fa-globe"}),t._v(" Worldwide")]):e("MapExtentViewer",{staticClass:"map",attrs:{footprint:s.extents}})]}}])})},l=[],r=s(3215),c=s(2566);const u={name:"Collection",components:{MapExtentViewer:()=>Promise.all([s.e(7009),s.e(2159),s.e(2395),s.e(1189),s.e(2997),s.e(9707),s.e(5767),s.e(7394),s.e(9049),s.e(3581),s.e(8828),s.e(9453),s.e(2890)]).then(s.bind(s,46818)),VueCollection:r["default"]},props:{data:{type:Object,required:!0}},computed:{...c.A.mapState(["connection"]),...c.A.mapGetters(["supports"]),bbox(){try{return this.data.extent.spatial.bbox[0]}catch(t){return null}}}},d=u;var m=s(81656),h=(0,m.A)(d,a,l,!1,null,null,null);const p=h.exports,f={name:"CollectionModal",components:{MapExtentViewer:()=>Promise.all([s.e(7009),s.e(2159),s.e(2395),s.e(1189),s.e(2997),s.e(9707),s.e(5767),s.e(7394),s.e(9049),s.e(3581),s.e(8828),s.e(9453),s.e(2890)]).then(s.bind(s,46818)),Modal:n.A,Collection:p,Items:()=>s.e(4489).then(s.bind(s,94489))},data(){return{items:[],itemsPage:0,itemsIterator:null}},props:{collection:{type:Object}},computed:{...c.A.mapState(["connection"]),...c.A.mapGetters(["supports"]),currentItems(){return this.items.length>=this.itemsPage?this.items[this.itemsPage]:null},hasPrevItems(){return this.itemsPage>0},hasNextItems(){return this.itemsPage<this.items.length-1}},async mounted(){this.supports("listCollectionItems")&&(await this.nextItems(),this.nextItems())},methods:{async paginate(t){if(t>0)await this.nextItems();else if(0===this.itemsPage&&t<0)return;this.itemsPage+=t},async nextItems(){this.itemsIterator||(this.itemsIterator=await this.connection.listCollectionItems(this.collection.id));let t=await this.itemsIterator.next();t&&t.value&&!t.done&&this.items.push(t.value)}}},g=f;var v=(0,m.A)(g,i,o,!1,null,null,null);const b=v.exports},94679:(t,e,s)=>{s.d(e,{A:()=>d});var i=function(){var t=this,e=t._self._c;return e("div",{staticClass:"modal",style:{"z-index":t.zIndex},on:{mousedown:t.backgroundClose}},[e(t.containerTag,{ref:"container",tag:"component",staticClass:"modal-container",class:{smooth:t.smooth},style:t.style,on:{submit:function(e){return e.preventDefault(),e.stopPropagation(),t.submitFunction.apply(null,arguments)}}},[e("header",{staticClass:"modal-header",on:{mousedown:t.startMove}},[t._t("header",(function(){return[e("h2",[t._v(t._s(t.title))]),e("span",{staticClass:"close",on:{click:t.close}},[e("i",{staticClass:"fa fa-times",attrs:{"aria-hidden":"true"}})])]}))],2),e("main",{staticClass:"modal-content"},[t._t("default")],2),e("footer",{staticClass:"modal-footer"},[t._t("footer",(function(){return[t.submitFunction?e("button",{attrs:{type:"submit"}},[t._v(t._s(t.submitButtonText))]):t._e()]}))],2)])],1)},o=[],n=s(61663),a=s(2566);const l={name:"Modal",mixins:[n.A],props:{title:{type:String,default:null},minWidth:{type:String,default:null},width:{type:String,default:"auto"},show:{type:Boolean,default:!0},submitFunction:{type:Function,default:null},submitButtonText:{type:String,default:"Submit"}},data(){return{zIndex:1e3,position:null,dragPosition:null,smooth:!1}},computed:{...a.A.mapState("editor",["hightestModalZIndex"]),style(){let t={width:this.width};return this.minWidth&&(t["min-width"]=this.minWidth),Array.isArray(this.position)&&(t.position="absolute",t.left=this.position[0]+"px",t.top=this.position[1]+"px"),t},containerTag(){return this.submitFunction?"form":"div"}},watch:{show:{immediate:!0,handler(t){t?this.open():this.close()}},width(){this.smoothResize()},minWidth(){this.smoothResize()}},methods:{...a.A.mapMutations("editor",["openModal","closeModal"]),smoothResize(){this.smooth=!0,setTimeout((()=>this.smooth=!1),600)},submit(t){this.submitFunction(t)},open(){this.openModal(),this.zIndex=this.hightestModalZIndex,window.addEventListener("keydown",this.escCloseListener),this.$emit("shown")},close(){window.removeEventListener("keydown",this.escCloseListener),this.closeModal(),this.$emit("closed")},startMove(t){"H2"!==t.target.tagName&&(this.dragPosition=[t.clientX,t.clientY],document.addEventListener("mousemove",this.move),document.addEventListener("mouseup",this.stopMove),t.preventDefault(),t.stopPropagation())},stopMove(){document.removeEventListener("mousemove",this.move),document.removeEventListener("mouseup",this.stopMove)},move(t){t.preventDefault(),this.position=[this.$refs.container.offsetLeft-(this.dragPosition[0]-t.clientX),this.$refs.container.offsetTop-(this.dragPosition[1]-t.clientY)],this.dragPosition=[t.clientX,t.clientY]},escCloseListener(t){if("Escape"==t.key)return this.close(),t.preventDefault(),t.stopPropagation(),!1},backgroundClose(t){t.target===this.$el&&this.close()}}},r=l;var c=s(81656),u=(0,c.A)(r,i,o,!1,null,null,null);const d=u.exports}}]);
//# sourceMappingURL=4186.4d52775d.js.map