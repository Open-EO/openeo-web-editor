"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[1845],{84542:(e,t,a)=>{a.d(t,{A:()=>i});const i={data(){return{canCopy:!1}},mounted(){this.canCopy=navigator&&navigator.clipboard&&"function"===typeof navigator.clipboard.writeText},methods:{copyText(e,t=null,a=null){if(this.canCopy){const i=navigator.clipboard.writeText(e);t&&i.then(t),a&&i.catch(a)}},toggleIcon(e,t){if(e){let a=e.innerText;e.innerText=t,setTimeout((()=>e.innerText=a),2e3)}}}}},31845:(e,t,a)=>{a.r(t),a.d(t,{default:()=>p});var i=function(){var e=this,t=e._self._c;return t("div",{staticClass:"vue-component searchable-list",class:{expandable:null!==e.collapsed,expanded:e.showList,noResults:0===e.filteredCount}},[e._t("heading",(function(){return[e.heading?t("h2",{staticClass:"heading",on:{click:function(t){return e.toggleHeading(null)}}},[e._v(" "+e._s(e.heading)+" "),null!==e.filteredCount&&e.filteredCount!==e.totalCount?[e._v("("+e._s(e.filteredCount)+"/"+e._s(e.totalCount)+")")]:[e._v("("+e._s(e.totalCount)+")")]],2):e._e()]}),{filteredCount:e.filteredCount,totalCount:e.totalCount}),null!==e.showList?t("div",{directives:[{name:"show",rawName:"v-show",value:!0===e.showList,expression:"showList === true"}],staticClass:"body"},[e._t("content-start"),0===e.totalCount?[t("p",[e._v("No data available.")])]:[t("section",{staticClass:"action-bar"},[null===e.externalSearchTerm?t("SearchBox",{attrs:{placeholder:e.searchPlaceholder,minLength:e.searchMinLength},model:{value:e.searchTerm,callback:function(t){e.searchTerm=t},expression:"searchTerm"}}):e._e(),e.deprecatedFilter?t("label",{staticClass:"deprecated",attrs:{title:"Show deprecated elements?"}},[t("input",{directives:[{name:"model",rawName:"v-model",value:e.hideDeprecated,expression:"hideDeprecated"}],attrs:{type:"checkbox","true-value":!1,"false-value":!0},domProps:{checked:Array.isArray(e.hideDeprecated)?e._i(e.hideDeprecated,null)>-1:e._q(e.hideDeprecated,!1)},on:{change:function(t){var a=e.hideDeprecated,i=t.target,s=!i.checked;if(Array.isArray(a)){var r=null,l=e._i(a,r);i.checked?l<0&&(e.hideDeprecated=a.concat([r])):l>-1&&(e.hideDeprecated=a.slice(0,l).concat(a.slice(l+1)))}else e.hideDeprecated=s}}}),e._v(" Show deprecated ")]):e._e()],1),e._t("after-search-box",null,{filteredCount:e.filteredCount,summaries:e.summaries}),0===e.filteredCount?t("p",[e._v("No search results found.")]):t("ul",{staticClass:"list",class:{expandable:e.offerDetails}},e._l(e.summaries,(function(a,i){return t("li",{directives:[{name:"show",rawName:"v-show",value:a.show,expression:"summary.show"}],key:a.identifier,class:{expanded:e.showDetails[i]}},[t("summary",{staticClass:"summary",class:{experimental:a.experimental,deprecated:a.deprecated},on:{click:function(t){return e.toggleDetails(i)}}},[e._t("summary",(function(){return[t("strong",[e._v(" "+e._s(a.identifier)+" "),e.allowCopy&&e.canCopy?t("span",{staticClass:"copy",attrs:{title:"Copy identifier"},on:{click:function(t){return t.preventDefault(),t.stopPropagation(),e.copyIdentifier(t,a)}}},[e._v("📋")]):e._e()]),a.summary?t("small",{class:{hideOnExpand:!e.showSummaryOnExpand}},[e._v(e._s(a.summary))]):e._e(),e.showKeywords&&a.keywords.length>0?t("ul",{staticClass:"badges small block hideOnExpand"},e._l(a.keywords,(function(a){return t("li",{key:a,staticClass:"badge"},[e._v(e._s(a))])})),0):e._e()]}),{summary:a,item:a.data})],2),"boolean"===typeof e.showDetails[i]?t("div",{directives:[{name:"show",rawName:"v-show",value:!0===e.showDetails[i],expression:"showDetails[i] === true"}],staticClass:"details"},[a.loaded?e._t("details",(function(){return[e._v(" No details available! ")]}),{summary:a,item:a.data}):t("Loading")],2):e._e()])})),0)]],2):e._e()],2)},s=[],r=a(86975),l=a(12018),n=a(84542),o=a(85471),d=a(96763);const h={name:"SearchableList",components:{Loading:l.A,SearchBox:()=>a.e(9409).then(a.bind(a,9409))},mixins:[n.A],props:{data:{type:[Array,Object],default:()=>[]},identifierKey:{type:String,default:"id"},summaryKey:{type:String,default:"summary"},keywordsKey:{type:String,default:null},showKeywords:{type:Boolean,default:!1},externalSearchTerm:{type:String,default:null},searchPlaceholder:{type:String,default:"Search"},sort:{type:Boolean,default:!0},offerDetails:{type:Boolean,default:!0},showSummaryOnExpand:{type:Boolean,default:!0},heading:{type:String,default:null},collapsed:{type:Boolean,default:null},searchMinLength:{type:Number,default:2},loadAdditionalData:{type:Function,default:null},allowCopy:{type:Boolean,default:!1},externalHideDeprecated:{type:Boolean,default:!1},deprecatedFilter:{type:Boolean,default:!1}},data(){return{searchTerm:"",showDetails:{},showList:!this.collapsed||null,hideDeprecated:this.externalHideDeprecated,summaries:[]}},watch:{loadAdditionalData:{handler(){this.generateSummaries(this.summaries)}},data:{immediate:!0,handler(e,t){e!==t&&this.generateSummaries(e)}},externalSearchTerm:{immediate:!0,handler(e){this.searchTerm="string"===typeof e?e:""}},externalHideDeprecated:{immediate:!0,handler(e){this.hideDeprecated=e}},summaries:{immediate:!0,handler(){this.$emit("summaries",this.summaries)}},searchTerm(){this.filter()},hideDeprecated(){null!==this.hideDeprecatedByDefault&&this.filter()},collapsed(e){!1===e?this.showList=!0:null!==this.showList&&(this.showList=!1)}},computed:{totalCount(){return r.A.size(this.data)},filteredCount(){return this.hasActiveFilter()?this.summaries.filter((e=>!0===e.show)).length:null}},created(){this.filter()},methods:{hasActiveFilter(){return this.searchTerm.length>=this.searchMinLength||null!==this.hideDeprecatedByDefault&&this.hideDeprecated},filter(){const e=this.searchTerm.length>=this.searchMinLength;this.summaries.forEach((t=>{let a=!0;null!==this.hideDeprecatedByDefault&&this.hideDeprecated&&t.deprecated?a=!1:e&&(a=r.A.search(this.searchTerm,[t.identifier,t.summary].concat(t.keywords))),this.$set(t,"show",a)})),this.$emit("summaries",this.summaries)},copyIdentifier(e,t){if(this.allowCopy){const a=e.composedPath()[0];this.copyText(t.identifier,(()=>this.toggleIcon(a,"✅")),(()=>this.toggleIcon(a,"❌")))}},generateSummaries(){let e="function"===typeof this.loadAdditionalData,t=[];for(let a in this.data){let i=this.data[a],s={identifier:a,summary:"",show:!0,loaded:!e,index:a,experimental:i.experimental,deprecated:i.deprecated,data:null};"string"===typeof this.identifierKey&&"string"===typeof i[this.identifierKey]&&(s.identifier=i[this.identifierKey]),"string"===typeof this.summaryKey&&"string"===typeof i[this.summaryKey]&&(s.summary=i[this.summaryKey]),"string"===typeof this.keywordsKey&&Array.isArray(i[this.keywordsKey])?s.keywords=i[this.keywordsKey]:s.keywords=[];let r=o.Ay.observable(s);r.data=i,t.push(r)}this.sort&&t.sort(((e,t)=>r.A.compareStringCaseInsensitive(e.identifier,t.identifier))),this.summaries=t},toggleHeading(e=null){null!==this.collapsed&&(this.showList=null===e?!this.showList:e,this.$emit("headingToggled",this.showList),this.$parent&&this.$parent.$emit("headingToggled",this.showList))},async toggleDetails(e,t){if(!this.offerDetails)return;if("undefined"===typeof t&&(t=!this.showDetails[e]),"undefined"===typeof this.showDetails[e]&&!1===t)return;this.$set(this.showDetails,e,t);let a=this.summaries[e];if(t&&"function"===typeof this.loadAdditionalData&&!a.loaded)try{a.data=await this.loadAdditionalData(a.index,a.identifier,a.data),a.loaded=!0}catch(i){d.error(i)}this.$emit("detailsToggled",t,a.index,a.identifier,a.data)}}},c=h;var u=a(81656),m=(0,u.A)(c,i,s,!1,null,null,null);const p=m.exports}}]);
//# sourceMappingURL=1845.c4c0495c.js.map