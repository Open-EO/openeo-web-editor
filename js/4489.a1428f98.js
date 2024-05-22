"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[4489],{94489:(e,t,a)=>{a.r(t),a.d(t,{default:()=>c});var s=function(){var e=this,t=e._self._c;return t("div",{staticClass:"vue-component items"},[t("SearchableList",{ref:"list",attrs:{data:e.data,summaryKey:"title",showSummaryOnExpand:!1,externalSearchTerm:e.searchTerm,externalHideDeprecated:e.hideDeprecated,deprecatedFilter:e.deprecatedFilter,sort:e.sort,offerDetails:e.offerDetails,heading:e.heading,collapsed:e.collapsed,loadAdditionalData:e.loadAdditionalData},on:{summaries:e.updateFeatures,detailsToggled:e.detailsToggled},scopedSlots:e._u([{key:"heading",fn:function(t){return[e._t("heading",null,null,t)]}},{key:"after-search-box",fn:function(){return[e.showMap?e._t("map",(function(){return[t("div",{ref:"mapContainer",staticClass:"map overview"})]}),{geojson:e.geojson,mapOptions:e.mapOptions}):e._e()]},proxy:!0},{key:"summary",fn:function(t){return[e._t("summary",null,null,t)]}},{key:"details",fn:function(a){return[t("Item",{attrs:{data:a.item,mapOptions:e.mapOptions},scopedSlots:e._u([{key:"title",fn:function(){return[t("span",{staticClass:"hidden"})]},proxy:!0},{key:"before-description",fn:function(t){return[e._t("item-before-description",null,null,t)]}},{key:"end",fn:function(t){return[e._t("item-end",null,null,t)]}},{key:"location",fn:function(t){return[e._t("item-location",null,null,t)]}}],null,!0)})]}}],null,!0)})],1)},i=[],n=a(86975),o=a(44924),l=a(35254);const r={color:"#3388ff",fillOpacity:.2},d={name:"Items",components:{Item:()=>n.A.loadAsyncComponent(a.e(1026).then(a.bind(a,38645))),SearchableList:()=>n.A.loadAsyncComponent(a.e(1845).then(a.bind(a,31845)))},mixins:[l.A],props:{items:{type:[Array,Object],default:()=>[]},showMap:{type:Boolean,default:!1},mapOptions:o.A.props.mapOptions,searchTerm:{type:String,default:null},sort:{type:Boolean,default:!0},offerDetails:{type:Boolean,default:!0},heading:{type:String,default:"Items"},collapsed:{type:Boolean,default:null},hideDeprecated:{type:Boolean,default:!1},deprecatedFilter:{type:Boolean,default:!1},loadAdditionalData:{type:Function,default:null},missing:{type:Array,default:null},...l.A.props},data(){return Object.assign(o.A.data(),{summaries:[]})},computed:{leafletOptions:o.A.computed.leafletOptions,data(){return Array.isArray(this.items)?this.items:n.A.isObject(this.items)&&"FeatureCollection"===this.items.type&&Array.isArray(this.items.features)?this.items.features:[]},geojson(){let e={type:"FeatureCollection",features:[]};for(let t of this.summaries)t.show&&e.features.push(this.data[t.index]);return e}},watch:{showMap:o.A.watch.showMap,geojson(){this.map?this.setFeatures():this.initMap()}},beforeCreate:o.A.beforeCreate,mounted:o.A.mounted,methods:{initMap:o.A.methods.initMap,updateMapView:o.A.methods.updateMapView,updateFeatures(e){this.summaries=e},addFeatures(){return this.setFeatures(!1),this.map.geometries},setFeatures(e=!0){if(!this.map||!this.map.instance)return;this.map.geometries&&this.map.geometries.remove();let t=this.map.leaflet.geoJSON(this.geojson,{style:r});t.on("click",(e=>{var a=this.map.leaflet.latLngBounds(e.latlng,e.latlng);t.eachLayer((e=>{let t=e.getBounds(),s=this.summaries.findIndex((t=>t.identifier===e.feature.id));this.$refs.list.toggleDetails(s,a.intersects(t))}))})),e&&t.addTo(this.map.instance),this.map.geometries=t},detailsToggled(...e){this.$emit("detailsToggled",...e)}}},u=d;var p=a(81656),m=(0,p.A)(u,s,i,!1,null,null,null);const c=m.exports}}]);
//# sourceMappingURL=4489.a1428f98.js.map