"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[4016],{54016:(e,t,a)=>{a.r(t),a.d(t,{default:()=>c});var s=function(){var e=this,t=e._self._c;return t("div",{staticClass:"datatypeEditor fileFormatOptionsEditor"},[e.hasOptions?e._l(e.parameters,(function(a){return t("div",{key:a.name,staticClass:"fieldRow"},[t("label",{staticClass:"fieldLabel"},[e._v(" "+e._s(a.label)),a.optional?e._e():t("strong",{staticClass:"required",attrs:{title:"required"}},[e._v("*")]),a.description?t("div",{staticClass:"description"},[t("Description",{attrs:{description:a.description}})],1):e._e()]),t("ParameterDataTypes",{ref:a.name,refInFor:!0,attrs:{editable:e.editable,parameter:a},model:{value:e.options[a.name],callback:function(t){e.$set(e.options,a.name,t)},expression:"options[parameter.name]"}})],1)})):[e._v(" The selected file format has no further options. ")]],2)},i=[],r=a(5305),o=a(2566),n=a(27261),p=a(31572);const l={name:"FileFormatOptionsEditor",components:{Description:n["default"],ParameterDataTypes:r["default"]},props:{value:{type:Object,default:()=>({})},format:{type:String},editable:{type:Boolean,default:!0},type:{type:String}},data(){return{options:this.value}},computed:{...o.A.mapState(["fileFormats"]),fileFormat(){return"input-format-options"===this.type?this.fileFormats.getInputType(this.format):this.fileFormats.getOutputType(this.format)},parameters(){var e=[];for(var t in this.fileFormat.parameters){var a=Object.assign({},this.fileFormat.parameters[t]);"undefined"!==typeof a.example&&(a.examples=[a.example],delete a.example);const s=new p.ProcessParameter({name:t,description:a.description,schema:a,optional:!a.required,default:a.default});s.schemas.push(new p.ProcessDataType({subtype:"undefined",not:{}},s)),e.push(s)}return e},hasOptions(){return"string"===typeof this.format&&(o.A.isObject(this.fileFormat)&&o.A.isObject(this.fileFormat.parameters)&&Object.keys(this.fileFormat.parameters).length>0)}},watch:{options:{deep:!0,handler(e){this.$emit("input",e)}},value(e){this.options!==e&&(this.options=e)}}},m=l;var d=a(81656),u=(0,d.A)(m,s,i,!1,null,"6c653ec2",null);const c=u.exports}}]);
//# sourceMappingURL=4016.57373123.js.map