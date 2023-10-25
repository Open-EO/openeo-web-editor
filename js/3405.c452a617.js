"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[3405],{15554:(t,e,n)=>{n.d(e,{Z:()=>l});const l={components:{FederationNotice:()=>n.e(8407).then(n.bind(n,78407)),FederationMissingNotice:()=>n.e(3559).then(n.bind(n,73559))},props:{federation:{type:Object,default:()=>({})}}}},82358:(t,e,n)=>{n.d(e,{Z:()=>u});var l=function(){var t=this,e=t._self._c;return e("div",{staticClass:"vue-component collections"},[e("SearchableList",{attrs:{data:t.collections,identifierKey:"id",summaryKey:"title",keywordsKey:"keywords",showKeywords:t.showKeywords,showSummaryOnExpand:!1,externalSearchTerm:t.searchTerm,sort:t.sort,offerDetails:t.offerDetails,heading:t.heading,collapsed:t.collapsed,loadAdditionalData:t.loadAdditionalData,allowCopy:""},on:{detailsToggled:t.detailsToggled},scopedSlots:t._u([{key:"heading",fn:function(e){return[t._t("heading",null,null,e)]}},t.missing?{key:"content-start",fn:function(){return[e("FederationMissingNotice",{attrs:{missing:t.missing,federation:t.federation}})]},proxy:!0}:null,{key:"summary",fn:function(e){return[t._t("summary",null,null,e)]}},{key:"details",fn:function(n){return[e("Collection",{attrs:{data:n.item,mapOptions:t.mapOptions,federation:t.federation},scopedSlots:t._u([{key:"title",fn:function(){return[e("span",{staticClass:"hidden"})]},proxy:!0},{key:"before-description",fn:function(e){return[t._t("collection-before-description",null,null,e)]}},{key:"end",fn:function(e){return[t._t("collection-end",null,null,e)]}},{key:"spatial-extents",fn:function(e){return[t._t("collection-spatial-extents",null,null,e)]}},{key:"temporal-extents",fn:function(e){return[t._t("collection-temporal-extents",null,null,e)]}}],null,!0)})]}}],null,!0)})],1)},o=[],i=n(40465),s=n(15554);const a={name:"Collections",components:{Collection:()=>i.Z.loadAsyncComponent(Promise.all([n.e(5062),n.e(5834),n.e(8370),n.e(5799),n.e(8356)]).then(n.bind(n,35799))),SearchableList:()=>i.Z.loadAsyncComponent(n.e(3250).then(n.bind(n,33250)))},mixins:[s.Z],props:{collections:{type:Array,default:()=>[]},mapOptions:{type:Object,default:()=>({})},searchTerm:{type:String,default:null},sort:{type:Boolean,default:!0},offerDetails:{type:Boolean,default:!0},heading:{type:String,default:"Collections"},collapsed:{type:Boolean,default:null},loadAdditionalData:{type:Function,default:null},showKeywords:{type:Boolean,default:!1},missing:{type:Array,default:null},...s.Z.props},beforeCreate(){i.Z.enableHtmlProps(this)},methods:{detailsToggled(...t){this.$emit("detailsToggled",...t)}}},r=a;var c=n(1001),d=(0,c.Z)(r,l,o,!1,null,null,null);const u=d.exports},23405:(t,e,n)=>{n.r(e),n.d(e,{default:()=>f});var l=function(){var t=this,e=t._self._c;return e("div",{staticClass:"step choose-collection"},[e("p",[t._v("Please select the collection which you want to download data for.")]),e("Collections",{attrs:{heading:"",collections:t.filteredCollections,offerDetails:!1},scopedSlots:t._u([{key:"summary",fn:function({item:n}){return[e("div",{class:{element:!0,selected:n.id==t.value}},[e("div",{staticClass:"summary",on:{click:function(e){return t.update(n.id)}}},[e("strong",{attrs:{title:n.id}},[t._v(t._s(n.id))]),n.title?e("small",{attrs:{title:n.title}},[t._v(t._s(n.title))]):t._e()]),e("button",{staticClass:"button",attrs:{type:"button",title:"Show collection details"},on:{click:function(e){return t.showCollectionInfo(n.id)}}},[e("i",{staticClass:"fas fa-info"})])])]}}])})],1)},o=[],i=n(82358),s=n(79879),a=n(43334);const r={name:"ChooseCollection",mixins:[a.Z],components:{Collections:i.Z},props:{value:{type:String,default:null},filter:{type:Function,default:null}},computed:{...s.Z.mapState(["collections"]),filteredCollections(){return"function"===typeof this.filter?this.collections.filter(this.filter):this.collections}},methods:{...s.Z.mapActions(["describeCollection"]),async update(t){this.$emit("input",t)},showCollectionInfo(t){this.broadcast("showCollection",t)}}},c=r;var d=n(1001),u=(0,d.Z)(c,l,o,!1,null,null,null);const f=u.exports}}]);
//# sourceMappingURL=3405.c452a617.js.map