"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[3559],{73559:(e,t,s)=>{s.r(t),s.d(t,{default:()=>p});var i=function(){var e=this,t=e._self._c;return e.services?t("section",{staticClass:"vue-component message-block federation federation-backends"},[e.retry?t("button",{staticClass:"retry",attrs:{type:"button"},on:{click:e.retry}},[e._t("button-text",(function(){return[e._v("Retry")]}))],2):e._e(),t("strong",{staticClass:"header"},[e._v("Incomplete")]),t("p",[e._v(" The following list is incomplete as at least one of the services in the federation is currently not available. The data for the following services is missing: "+e._s(e.services.join(", "))+" ")])]):e._e()},n=[],r=s(15554),o=s(40465);const a={name:"FederationMissingNotice",mixins:[r.Z],props:{missing:{type:Array,required:!0},retry:{type:Function,default:null},...r.Z.props},computed:{services(){return Array.isArray(this.missing)?this.missing.map((e=>o.Z.isObject(this.federation)&&o.Z.isObject(this.federation[e])&&"string"===typeof this.federation[e].title?this.federation[e].title:e)):null}}},l=a;var c=s(1001),u=(0,c.Z)(l,i,n,!1,null,null,null);const p=u.exports}}]);
//# sourceMappingURL=3559.d2cc532d.js.map