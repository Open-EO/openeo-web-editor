(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-11aa48a8"],{"0869":function(t,e,s){},2263:function(t,e,s){"use strict";s.r(e);var a=function(){var t=this,e=t.$createElement,s=t._self._c||e;return s("article",{staticClass:"vue-component stac item"},[t._t("title",(function(){return[s("a",{staticClass:"anchor",attrs:{name:t.stac.id}}),s("h2",[t._v(t._s(t.title))])]}),null,t.$props),t._t("before-description",null,null,t.$props),t.properties.description?s("summary",{staticClass:"description"},[s("Description",{attrs:{description:t.properties.description}}),t.properties.deprecated?s("DeprecationNotice",{attrs:{entity:"item"}}):t._e()],1):t._e(),t.thumbnails.length?s("section",{staticClass:"preview"},[s("h3",[t._v("Previews")]),s("div",{staticClass:"thumbnails"},t._l(t.thumbnails,(function(t){return s("a",{key:t.href,attrs:{href:t.href,target:"_blank"}},[s("img",{attrs:{src:t.href,title:t.title,alt:t.title||"Preview"}})])})),0)]):t._e(),s("section",{staticClass:"metadata properties"},[t.thumbnails.length?s("h3",[t._v("Metadata")]):t._e(),t.stac.geometry||Array.isArray(t.stac.bbox)?t._t("location",(function(){return[s("div",{staticClass:"tabular wrap"},[s("label",[t._v("Location")]),s("div",{ref:"mapContainer",staticClass:"value map"},[t.map?t._e():[t._v(" Latitudes: "+t._s(t.stac.bbox[1])+" / "+t._s(t.stac.bbox[3])+", Longitudes: "+t._s(t.stac.bbox[0])+" / "+t._s(t.stac.bbox[2])+" ")]],2)])]}),{geometry:t.stac.geometry,bbox:t.stac.bbox,mapOptions:t.mapOptions}):t._e(),s("StacFields",{attrs:{type:"Item",metadata:t.data,headingTag:"h4",ignore:t.ignoredFields}})],2),t.hasAssets?s("section",{staticClass:"assets"},[s("h3",[t._v("Assets")]),s("ul",{staticClass:"list"},t._l(t.stac.assets,(function(e,a){return s("StacAsset",{key:a,attrs:{asset:e,id:a,context:t.data}})})),1)]):t._e(),s("section",{staticClass:"links"},[s("LinkList",{attrs:{links:t.stac.links,heading:"See Also",headingTag:"h3",ignoreRel:["self","parent","root","license","cite-as"]}})],1),t._t("end",null,null,t.$props)],2)},i=[],r=s("bd8a"),n=s("8205"),o=s("60a2"),c={name:"Item",mixins:[n["a"]],components:{StacAsset:r["a"]},props:{...n["a"].props},data(){return{ignoredFields:["title","description","deprecated"]}},computed:{properties(){return o["a"].isObject(this.stac.properties)?this.stac.properties:{}},title(){return this.properties.title?`${this.properties.title} (${this.stac.id})`:this.stac.id},showMap(){return Boolean(this.stac.geometry)}},methods:{addFeatures(){let t=this.map.leaflet.geoJSON(this.stac);return t.setStyle({color:"#3388ff",fillOpacity:.2}),t}}},l=c,p=(s("eed3"),s("2877")),d=Object(p["a"])(l,a,i,!1,null,null,null);e["default"]=d.exports},eed3:function(t,e,s){"use strict";s("0869")}}]);
//# sourceMappingURL=chunk-11aa48a8.09ad2c06.js.map