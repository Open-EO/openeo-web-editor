"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[3504,8324],{35254:(t,e,a)=>{a.d(e,{A:()=>r});const r={components:{FederationNotice:()=>a.e(2604).then(a.bind(a,52604)),FederationMissingNotice:()=>a.e(5363).then(a.bind(a,35363))},props:{federation:{type:Object,default:()=>({})}}}},13504:(t,e,a)=>{a.r(e),a.d(e,{default:()=>d});var r=function(){var t=this,e=t._self._c;return e("article",{staticClass:"vue-component file-format"},[t._t("title",(function(){return[e("a",{staticClass:"anchor",attrs:{name:t.id}}),e("h2",[t.format.title?[t._v(" "+t._s(t.format.title)+" ("),e("code",{staticClass:"id"},[t._v(t._s(t._f("abbrev")(t.id)))]),t._v(") ")]:e("code",{staticClass:"id"},[t._v(t._s(t._f("abbrev")(t.id)))])],2)]}),null,t.$props),t._t("badges",(function(){return[e("ul",{staticClass:"badges"},["input"===t.type?e("li",{staticClass:"badge option1"},[t._v("Import")]):t._e(),"output"===t.type?e("li",{staticClass:"badge option2"},[t._v("Export")]):t._e(),Array.isArray(t.format.gis_data_types)?t._l(t.format.gis_data_types,(function(a){return e("li",{key:a,staticClass:"badge gis"},[t._v(t._s(a))])})):t._e()],2)]}),null,t.$props),t._t("before-description",null,null,t.$props),t.format.description?e("section",{staticClass:"description"},[e("h3",[t._v("Description")]),e("Description",{attrs:{description:t.format.description}}),t.format.deprecated?e("DeprecationNotice",{attrs:{entity:"file format"}}):t._e(),t.format.experimental?e("ExperimentalNotice",{attrs:{entity:"file format"}}):t._e(),t.format["federation:backends"]?e("FederationNotice",{attrs:{backends:t.format["federation:backends"],federation:t.federation,entity:"file format"}}):t._e()],1):t._e(),e("section",{staticClass:"parameters"},[e("h3",[t._v("Parameters")]),t._l(t.parameters,(function(a){return e("ProcessParameter",{key:a.name,attrs:{parameter:a,federation:t.federation}})})),0===t.parameters.length?e("p",[t._v("This file format has no parameters.")]):t._e()],2),e("section",{staticClass:"links"},[e("LinkList",{attrs:{links:t.format.links,heading:"See Also",headingTag:"h3"}})],1),t._t("end",null,null,t.$props)],2)},i=[],s=a(86975),n=a(35254);const o={name:"FileFormat",components:{DeprecationNotice:()=>a.e(6238).then(a.bind(a,36238)),Description:()=>Promise.all([a.e(7261),a.e(1194)]).then(a.bind(a,27261)),ExperimentalNotice:()=>a.e(4387).then(a.bind(a,84387)),ProcessParameter:()=>a.e(8354).then(a.bind(a,88354)),LinkList:()=>a.e(2810).then(a.bind(a,52810))},mixins:[n.A],props:{id:{type:String,default:""},format:{type:Object,default:()=>({})},type:{type:String,default:null},...n.A.props},computed:{parameters(){return s.A.toProcessParameters(this.format.parameters)}},filters:{abbrev:s.A.prettifyAbbreviation},beforeCreate(){s.A.enableHtmlProps(this)}},l=o;var p=a(81656),c=(0,p.A)(l,r,i,!1,null,null,null);const d=c.exports},28324:(t,e,a)=>{a.r(e),a.d(e,{default:()=>d});var r=function(){var t=this,e=t._self._c;return e("Modal",{ref:"modal",attrs:{width:"50%",title:t.title},on:{closed:function(e){return t.$emit("closed")}}},[e("FileFormat",{attrs:{id:t.id,format:t.format,type:t.type}})],1)},i=[],s=a(94679),n=a(13504);const o={name:"FileFormatModal",components:{Modal:s.A,FileFormat:n["default"]},props:{id:{type:String},format:{type:Object},type:{type:String}},computed:{title(){return this.format.title||this.id}}},l=o;var p=a(81656),c=(0,p.A)(l,r,i,!1,null,"3a7ce09e",null);const d=c.exports}}]);
//# sourceMappingURL=8324.b31ffedf.js.map