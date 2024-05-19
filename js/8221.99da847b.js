"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[8221],{82634:(e,t,a)=>{a.r(t),a.d(t,{default:()=>w});var s=function(){var e=this,t=e._self._c;return t("Modal",{attrs:{width:"80%",title:"Export as Source Code"},on:{closed:function(t){return e.$emit("closed")}}},[t("section",{staticClass:"exportCode"},[t("h3",[e._v("Choose Programming Language")]),t("input",{directives:[{name:"model",rawName:"v-model",value:e.language,expression:"language"}],attrs:{type:"radio",id:"js",value:"JavaScript"},domProps:{checked:e._q(e.language,"JavaScript")},on:{change:function(t){e.language="JavaScript"}}}),t("label",{attrs:{for:"js"}},[e._v("JavaScript")]),t("input",{directives:[{name:"model",rawName:"v-model",value:e.language,expression:"language"}],attrs:{type:"radio",id:"py",value:"Python"},domProps:{checked:e._q(e.language,"Python")},on:{change:function(t){e.language="Python"}}}),t("label",{attrs:{for:"py"}},[e._v("Python")]),t("input",{directives:[{name:"model",rawName:"v-model",value:e.language,expression:"language"}],attrs:{type:"radio",id:"r",value:"R"},domProps:{checked:e._q(e.language,"R")},on:{change:function(t){e.language="R"}}}),t("label",{attrs:{for:"r"}},[e._v("R")]),t("h3",[e._v("Generated Code")]),e.error?t("div",{staticClass:"message error"},[t("i",{staticClass:"fas fa-exclamation-circle"}),t("span",[e._v(" Sorry, the code generation failed due to the following reason:"),t("br"),t("em",[e._v(e._s(e.error))])])]):[t("div",{staticClass:"message warning"},[t("i",{staticClass:"fas fa-bullhorn"}),t("span",[e._v("Please note that this feature is "),t("strong",[e._v("experimental")]),e._v(" and there are chances that the generated code won't work. Also, the code generated is not always following best practices nor will the implementation use the most efficient way of implementing processes, which is the nature of automatic code generation.")])]),t("TextEditor",{ref:"editor",attrs:{id:e.language,title:e.language,value:e.code,language:e.language,editable:!1},scopedSlots:e._u([{key:"file-toolbar",fn:function(){return[t("button",{attrs:{type:"button",title:"Download code"},on:{click:e.download}},[t("i",{staticClass:"fas fa-download"})])]},proxy:!0}])})]],2)])},n=[],r=a(73902),i=a(57497),o=a(94679),l=a(2566),c=a(47067),d=a(16125);const h=["and","as","assert","break","class","continue","def","del","elif","else","except","exec","finally","for","from","global","if","import","in","is","lambda","not","or","pass","print","raise","return","try","while","with","yield","openeo","connection","process","builder"];class u extends d.A{createProcessGraphInstance(e){let t=new u(e,this.processRegistry,this.getJsonSchemaValidator());return this.copyProcessGraphInstanceProperties(t)}getKeywords(){return h}comment(e){this.addCode(e,"# ")}generateImports(){this.addCode("import openeo"),this.addCode("from openeo.processes import process")}generateConnection(){this.addCode(`connection = openeo.connect("${this.getServerUrl()}")`)}generateAuthentication(){this.comment("ToDo: Here you need to authenticate with authenticate_basic() or authenticate_oidc()")}generateBuilder(){}generateMetadataEntry(e,t){this.comment(`${e}: ${this.e(t)}`)}makeNull(){return"None"}makeBoolean(e){return e?"True":"False"}getTab(){return"    "}hasCallbackParameter(e){return Boolean(Object.values(e.arguments).find((e=>e instanceof u)))}async generateFunction(e){let t,a=this.var(e.id,this.varPrefix()),s=!0,n=null;if(e.getParent())t="process";else{let a=e.getProcessGraph().getStartNodeIds();if(a.includes(e.id))"load_collection"===e.process_id?(t="connection.load_collection",e.arguments=Object.assign({collection_id:e.arguments.id},l.A.omitFromObject(e.arguments,["id"])),s=!1):t="connection.datacube_from_process";else{let a=e.getPreviousNodes(),r=this.var(a[0].id,this.varPrefix());this.hasCallbackParameter(e)||"save_result"===e.process_id?(t=`${r}.${e.process_id}`,s=!1,n=(e,t)=>l.A.isObject(t)&&t.from_node&&this.var(t.from_node,this.varPrefix())===r):t=`${r}.process`}}let r=await this.generateArguments(e,!1,n);e.namespace&&(r.namespace=this.makeString(e.namespace)),r=l.A.mapObject(r,((e,t)=>`${t} = ${this.e(e)}`)),s&&r.unshift(this.makeString(e.process_id)),this.comment(e.description),this.addCode(`${a} = ${t}(${r.join(", ")})`)}generateMissingParameter(e){this.comment(e.description);let t=this.var(e.name,"param"),a="undefined"!==typeof e.default?e.default:null;this.addCode(`${t} = ${this.e(a)}`)}async generateCallback(e,t,a){let s=this.generateFunctionParams(t);0===s.length&&s.push("builder"),this.newLine(),this.addCode(`def ${a}(${s.join(", ")}):`),this.addCode(await e.toCode(!0),"",1),this.newLine()}generateResult(e,t){if(!e)return;let a=this.var(e.id,this.varPrefix());t?this.addCode(`return ${a}`):this.addCode(`result = connection.execute(${a})`)}}const m=["if","else","repeat","while","function","for","in","next","break","true","false","null","inf","nan","na","na_integer_","na_real_","na_complex_","na_character_","openeo","connect","connection","datacube","p","compute_result"];class p extends d.A{createProcessGraphInstance(e){let t=new p(e,this.processRegistry,this.getJsonSchemaValidator());return this.copyProcessGraphInstanceProperties(t)}getKeywords(){return m}makeNull(){return"NULL"}makeBoolean(e){return e?"TRUE":"FALSE"}makeArray(e){return`list(${e.join(", ")})`}makeObject(e){let t=l.A.mapObject(e,((e,t)=>`${this.makeString(t)} = ${e}`));return`list(${t.join(", ")})`}comment(e){this.addCode(e,"# ")}generateImports(){this.addCode("library(openeo)")}generateConnection(){this.addCode(`connection = connect(host = "${this.getServerUrl()}")`)}generateAuthentication(){this.comment("ToDo: Authentication with login()")}generateBuilder(){this.addCode("p = processes()")}generateMetadataEntry(e,t){this.comment(`${e}: ${this.e(t)}`)}async generateFunction(e){let t=this.var(e.id,this.varPrefix()),a=await this.generateArguments(e);if(e.namespace)throw new Error("The R client doesn't support namespaced processes yet");a=l.A.mapObject(a,((e,t)=>`${t} = ${this.e(e)}`)),this.comment(e.description),this.addCode(`${t} = p$${e.process_id}(${a.join(", ")})`)}generateMissingParameter(e){this.comment(e.description);let t=this.var(e.name,"param"),a="undefined"!==typeof e.default?e.default:null;this.addCode(`${t} = ${this.e(a)}`)}async generateCallback(e,t,a){let s=!1;if(s);else{let s=this.generateFunctionParams(t);this.newLine(),this.addCode(`${a} = function(${s.join(", ")}) {`),this.addCode(await e.toCode(!0),"",1),this.addCode("}")}}generateResult(e,t){if(!e)return;let a=this.var(e.id,this.varPrefix());t?this.addCode(`return(${a})`):this.addCode(`result = compute_result(graph = ${a})`)}}const g={name:"ExportCodeModal",components:{Modal:o.A,TextEditor:i.A},data(){return{language:"JavaScript",code:"",error:null}},computed:{...l.A.mapState(["connection"]),...l.A.mapState("editor",["process"]),...l.A.mapGetters(["processes","supportsMath"])},watch:{language:{immediate:!0,async handler(){try{let e;if("JavaScript"===this.language)e=new c.A(this.process,this.processes,this.connection,this.supportsMath);else if("Python"===this.language)e=new u(this.process,this.processes,this.connection);else{if("R"!==this.language)throw new Error("Unsupported programming language selected");e=new p(this.process,this.processes,this.connection)}this.code=e?await e.toCode():"",this.error=null}catch(e){this.code="",this.error=e instanceof Error?e.message:e}}}},methods:{download(){let e;"JavaScript"===this.language?e="code.js":"Python"===this.language?e="code.py":"R"===this.language&&(e="code.r"),r.OpenEO.Environment.saveToFile(this.code,e)}}},f=g;var y=a(81656),v=(0,y.A)(f,s,n,!1,null,null,null);const w=v.exports},94679:(e,t,a)=>{a.d(t,{A:()=>h});var s=function(){var e=this,t=e._self._c;return t("div",{staticClass:"modal",style:{"z-index":e.zIndex},on:{mousedown:e.backgroundClose}},[t(e.containerTag,{ref:"container",tag:"component",staticClass:"modal-container",class:{smooth:e.smooth},style:e.style,on:{submit:function(t){return t.preventDefault(),t.stopPropagation(),e.submitFunction.apply(null,arguments)}}},[t("header",{staticClass:"modal-header",on:{mousedown:e.startMove}},[e._t("header",(function(){return[t("h2",[e._v(e._s(e.title))]),t("span",{staticClass:"close",on:{click:e.close}},[t("i",{staticClass:"fa fa-times",attrs:{"aria-hidden":"true"}})])]}))],2),t("main",{staticClass:"modal-content"},[e._t("default")],2),t("footer",{staticClass:"modal-footer"},[e._t("footer",(function(){return[e.submitFunction?t("button",{attrs:{type:"submit"}},[e._v(e._s(e.submitButtonText))]):e._e()]}))],2)])],1)},n=[],r=a(61663),i=a(2566);const o={name:"Modal",mixins:[r.A],props:{title:{type:String,default:null},minWidth:{type:String,default:null},width:{type:String,default:"auto"},show:{type:Boolean,default:!0},submitFunction:{type:Function,default:null},submitButtonText:{type:String,default:"Submit"}},data(){return{zIndex:1e3,position:null,dragPosition:null,smooth:!1}},computed:{...i.A.mapState("editor",["hightestModalZIndex"]),style(){let e={width:this.width};return this.minWidth&&(e["min-width"]=this.minWidth),Array.isArray(this.position)&&(e.position="absolute",e.left=this.position[0]+"px",e.top=this.position[1]+"px"),e},containerTag(){return this.submitFunction?"form":"div"}},watch:{show:{immediate:!0,handler(e){e?this.open():this.close()}},width(){this.smoothResize()},minWidth(){this.smoothResize()}},methods:{...i.A.mapMutations("editor",["openModal","closeModal"]),smoothResize(){this.smooth=!0,setTimeout((()=>this.smooth=!1),600)},submit(e){this.submitFunction(e)},open(){this.openModal(),this.zIndex=this.hightestModalZIndex,window.addEventListener("keydown",this.escCloseListener),this.$emit("shown")},close(){window.removeEventListener("keydown",this.escCloseListener),this.closeModal(),this.$emit("closed")},startMove(e){"H2"!==e.target.tagName&&(this.dragPosition=[e.clientX,e.clientY],document.addEventListener("mousemove",this.move),document.addEventListener("mouseup",this.stopMove),e.preventDefault(),e.stopPropagation())},stopMove(){document.removeEventListener("mousemove",this.move),document.removeEventListener("mouseup",this.stopMove)},move(e){e.preventDefault(),this.position=[this.$refs.container.offsetLeft-(this.dragPosition[0]-e.clientX),this.$refs.container.offsetTop-(this.dragPosition[1]-e.clientY)],this.dragPosition=[e.clientX,e.clientY]},escCloseListener(e){if("Escape"==e.key)return this.close(),e.preventDefault(),e.stopPropagation(),!1},backgroundClose(e){e.target===this.$el&&this.close()}}},l=o;var c=a(81656),d=(0,c.A)(l,s,n,!1,null,null,null);const h=d.exports},16125:(e,t,a)=>{a.d(t,{A:()=>i});var s=a(14894),n=a(2566);class r extends s.BaseProcess{constructor(e,t){super(e),this.exporter=t}async execute(e){await this.exporter.generateFunction(e)}}class i extends s.ProcessGraph{constructor(e,t,a){super(n.A.isObject(e)?e:{},t),this.connection=a,this.code=[],this.fnCounter=1,this.allowEmpty(),this.fillUndefinedParameters()}createProcessGraphInstance(e){let t=new i(e,this.processRegistry,this.getJsonSchemaValidator());return this.copyProcessGraphInstanceProperties(t)}copyProcessGraphInstanceProperties(e){return e=super.copyProcessGraphInstanceProperties(e),e.connection=this.connection,e}createProcessInstance(e){return new r(e,this)}isKeyword(e){return this.getKeywords().includes(e.toLowerCase())}getKeywords(){return[]}comment(){}generateImports(){}generateConnection(){}generateAuthentication(){}generateBuilder(){}generateMetadata(){}generateMissingParameter(){}async generateFunction(){}generateFunctionParams(e){return e.map((e=>"undefined"!==typeof e.default?`${e.name} = ${this.e(e.default)}`:e.name))}async generateCallback(){}generateResult(){}makeNull(){return"null"}makeBoolean(e){return e?"true":"false"}makeArray(e){return`[${e.join(", ")}]`}makeObject(e){let t=n.A.mapObject(e,((e,t)=>`${this.makeString(t)}: ${e}`));return`{${t.join(", ")}}`}makeString(e){return JSON.stringify(e)}makeNumber(e){return e}e(e){return null===e?this.makeNull():"boolean"===typeof e?this.makeBoolean(e):"number"===typeof e?this.makeNumber(e):"string"===typeof e?this.makeString(e):Array.isArray(e)?this.makeArray(e.map((e=>this.e(e)))):n.A.isObject(e)?this.makeObject(n.A.mapObjectValues(e,(e=>this.e(e)))):"function"===typeof e?e():this.makeNull()}generateMetadata(){let e=!1;for(let t in this.process){if("process_graph"===t)continue;let a=this.process[t];Array.isArray(a)&&0===a.length||("string"===typeof a&&0===a.length||("boolean"!==typeof a||a)&&(e||(this.newLine(),this.comment("Set the metadata for the process"),e=!0),this.generateMetadataEntry(t,a)))}}async resolveArguments(e,t,a){let s=Array.isArray(e)?[]:{};for(let r in e){let o=e[r];if(!a||!a(r,o))if(n.A.isObject(o)){if(o.from_node){s[r]=()=>this.var(o.from_node,this.varPrefix());continue}if(o.from_parameter){s[r]=()=>this.var(o.from_parameter);continue}if(o instanceof i){let e=await t(r);s[r]=()=>e;continue}s[r]=await this.resolveArguments(o,t,a)}else Array.isArray(o)?s[r]=await this.resolveArguments(o,t,a):s[r]=o}return s}async resolveCallback(e,t){let a;if("load_collection"===e.process_id){let s=e.getArgument("properties");a=s[t]}else a=e.getArgument(t);let s=a.getCallbackParameters();await a.execute(s);let n=this.var(`${t}${this.fnCounter++}`,"fn_"),r=await this.generateCallback(a,s,n);return r||n}async generateArguments(e,t=!1,a=null){let s=await this.resolveArguments(e.arguments,(async t=>await this.resolveCallback(e,t)),a);return t&&(s=this.orderArguments(e,s)),s}orderArguments(e,t){let a=e.getProcessGraph().getProcess(e);if(a&&Array.isArray(a.parameters)){let e=a.parameters.map((e=>"undefined"!==typeof t[e.name]?t[e.name]:e.optional?void 0:null)),s=!1;for(let t=e.length-1;t>=0;t--)"undefined"===typeof e[t]?s?e[t]=null:e.pop():s=!0;return e}}varPrefix(){return this.getParent()?"data":"datacube"}var(e,t="var"){return e=String(e),this.isKeyword(e)?`${e}_`:e.match(/^[a-z_]\w*$/)?e:t+e.replace(/[^\w]+/g,"_")}getTab(){return"\t"}addCode(e,t="",a=0){if("string"!==typeof e)return;let s=this.getTab().repeat(a),n=e.trim().split(/\r\n|\r|\n/g);for(let r of n)this.code.push(`${s}${t}${r}\n`)}newLine(e=1){for(let t=0;t<e;t++)this.addCode("")}getServerUrl(){return this.connection.getUrl()}async toCode(e=!1){this.code=[],e||(this.comment("Import required packages"),this.generateImports(),this.newLine(),this.comment("Connect to the back-end"),this.generateConnection(),this.generateAuthentication(),this.newLine(),this.generateBuilder(),this.generateMetadata(),this.newLine());let t=this.getProcessParameters();if(t.length>0){this.comment("ToDo: Here you need to set values for the parameters");for(let e of t)this.generateMissingParameter(e);this.newLine()}return await this.execute(),e||(this.newLine(),this.comment("The process can be executed synchronously (see below), as batch job or as web service now")),this.generateResult(this.getResultNode(),e),this.code.join("").trim()}async execute(){return await this.validate(),this.reset(),await this.executeNodes(this.getStartNodes()),this.getResultNode()}isMath(){return"undefined"===typeof this._isMath&&(this._isMath=this.processRegistry.isMath(this)),this._isMath}}},47067:(e,t,a)=>{a.d(t,{A:()=>o});var s=a(2566),n=a(16125),r=a(73902);const i=["abstract","arguments","await","boolean","break","byte","case","catch","char","class","const","continue","debugger","default","delete","do","double","else","enum","eval","export","extends","false","final","finally","float","for","function","goto","if","implements","import","in","instanceof","int","interface","let","long","native","new","null","package","private","protected","public","return","short","static","super","switch","synchronized","this","throw","throws","transient","true","try","typeof","var","void","volatile","while","with","yield","builder","connection","formula","openeo","result"];class o extends n.A{constructor(e,t,a,s=!1){super(e,t,a),this.generateFormula=s}createProcessGraphInstance(e){let t=new o(e,this.processRegistry,this.getJsonSchemaValidator(),this.generateFormula);return this.copyProcessGraphInstanceProperties(t)}parse(){this.parsed||super.parse()}getKeywords(){return i}comment(e){this.addCode(e,"// ")}generateImports(){this.addCode("import { OpenEO, Formula } from '@openeo/js-client';")}generateConnection(){this.addCode(`let connection = await OpenEO.connect('${this.getServerUrl()}');`)}generateAuthentication(){this.comment("ToDo: Here you need to add your authentication steps")}generateBuilder(){this.addCode("let builder = await connection.buildProcess();")}generateMetadataEntry(e,t){this.addCode(`builder.${e} = ${this.e(t)};`)}async generateFunction(e){let t=e.getParent()?"this":"builder",a=this.var(e.id,this.varPrefix()),n=await this.generateArguments(e,!e.namespace);if(this.comment(e.description),s.A.isObject(n)){let s=e.namespace?`${e.process_id}@${e.namespace}`:e.process_id;this.addCode(`let ${a} = ${t}.process("${s}", ${this.e(n)});`)}else this.addCode(`let ${a} = ${t}.${e.process_id}(${n.map((e=>this.e(e))).join(", ")});`)}generateMissingParameter(e){this.comment(e.description);let t=this.var(e.name,"param"),a="undefined"!==typeof e.default?e.default:null;this.addCode(`let ${t} = ${this.e(a)};`)}async generateCallback(e,t,a){if(this.generateFormula&&e&&e.isMath()){let t=e.toFormulaString(),a=JSON.stringify(t);return`new Formula(${a})`}{let s=this.generateFunctionParams(t);this.newLine(),this.addCode(`let ${a} = function(${s.join(", ")}) {`),this.addCode(await e.toCode(!0),"",1),this.addCode("}")}}generateResult(e,t){if(!e)return;let a=this.var(e.id,this.varPrefix());t?this.addCode(`return ${a};`):this.addCode(`let result = await connection.computeResult(${a});`)}toFormulaString(){return this.isMath()?this.nodeToFormula(this.getResultNode()):""}getArrayElementPlaceholder(e){if("array_element"===e.process_id&&"parameter"===e.getArgumentType("data")){let t=e.getRawArgument("data").from_parameter,a=this.getCallbackParameters().findIndex((e=>e.name===t));if(a>=0)return"$".repeat(a+1)+(e.getArgument("label")||e.getArgument("index"))}return null}nodeToFormula(e,t=null){if("array_element"===e.process_id){let t=this.getArrayElementPlaceholder(e);if(t)return t}let a=r.Formula.reverseOperatorMapping[e.process_id],n=this.processRegistry.get(e.process_id),i="undefined"!==typeof r.Formula.arrayOperatorMapping[e.process_id],o=t=>{if(s.A.isObject(t))if(t.from_node){let s=e.getProcessGraph().getNode(t.from_node);t=s?this.nodeToFormula(s,a):"#"+t.from_node}else{if(!t.from_parameter)throw new Error("Objects not allowed");t=t.from_parameter}return t},l=[],c=Array.isArray(n.parameters)?n.parameters:[];for(let s of c){let t=o(e.getRawArgument(s.name));if(i&&Array.isArray(t)&&"data"===s.name){l=t.map((e=>o(e)));break}if("undefined"!==typeof t)l.push(t);else{if("undefined"===typeof s.default)throw new Error('Argument for parameter "'+s.name+'" missing');l.push(s.default)}}if(i&&(l=l.filter((e=>null!==e))),a){let e=["/","*"],s=["-","+"],n=l.map((e=>e<0?"("+e+")":e)).join(a);return!t||s.includes(t)&&s.includes(a)||"^"===a||s.includes(t)&&e.includes(a)?n:"("+n+")"}return e.process_id+"("+l.join(", ")+")"}}}}]);
//# sourceMappingURL=8221.99da847b.js.map