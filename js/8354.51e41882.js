"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[8354],{88354:(e,t,a)=>{a.r(t),a.d(t,{default:()=>l});var r=function(){var e=this,t=e._self._c;return t("div",{staticClass:"vue-component process-parameter"},[t("h4",[t("code",[e._v(e._s(e.parameter.name))]),e.parameter.optional?e._e():t("strong",{staticClass:"required",attrs:{title:"required"}},[e._v("*")]),e.hasDefault?t("code",{staticClass:"default"},[e._v(" = "+e._s(e.defaultValue))]):e._e()]),t("div",{staticClass:"details"},[e.parameter.description?t("Description",{attrs:{description:e.parameter.description,processUrl:e.processUrl}}):e._e(),!0===e.parameter.deprecated?t("DeprecationNotice",{attrs:{entity:"parameter"}}):e._e(),!0===e.parameter.experimental?t("ExperimentalNotice",{attrs:{entity:"parameter"}}):e._e(),e.parameter["federation:backends"]?t("FederationNotice",{attrs:{backends:e.parameter["federation:backends"],federation:e.federation,entity:"parameter"}}):e._e(),e.parameter.schema?t("div",{staticClass:"json-schema-container"},[t("JsonSchema",{attrs:{schema:e.parameter.schema,processUrl:e.processUrl}})],1):e._e()],1)])},s=[],i=a(35254);const n={name:"ProcessParameter",components:{DeprecationNotice:()=>a.e(6238).then(a.bind(a,36238)),Description:()=>Promise.all([a.e(7261),a.e(1194)]).then(a.bind(a,27261)),ExperimentalNotice:()=>a.e(4387).then(a.bind(a,84387)),JsonSchema:()=>a.e(8152).then(a.bind(a,25771))},mixins:[i.A],props:{parameter:{type:Object},processUrl:{type:String},...i.A.props},computed:{hasDefault(){return"undefined"!==typeof this.parameter.default},defaultValue(){return JSON.stringify(this.parameter.default)}}},o=n;var p=a(81656),c=(0,p.A)(o,r,s,!1,null,null,null);const l=c.exports}}]);
//# sourceMappingURL=8354.51e41882.js.map