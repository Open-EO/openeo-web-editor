"use strict";(globalThis["webpackChunk_openeo_web_editor"]=globalThis["webpackChunk_openeo_web_editor"]||[]).push([[1189],{82488:()=>{},7771:(t,e,n)=>{n.d(e,{DT:()=>u,FT:()=>c,Wl:()=>d,_p:()=>s,cr:()=>l,ew:()=>h,j:()=>a,oF:()=>o});const i="undefined"!==typeof navigator&&"undefined"!==typeof navigator.userAgent?navigator.userAgent.toLowerCase():"",s=i.includes("firefox"),r=i.includes("safari")&&!i.includes("chrom"),o=r&&(i.includes("version/15.4")||/cpu (os|iphone os) 15_4 like mac os x/.test(i)),a=i.includes("webkit")&&!i.includes("edge"),h=i.includes("macintosh"),l="undefined"!==typeof devicePixelRatio?devicePixelRatio:1,d="undefined"!==typeof WorkerGlobalScope&&"undefined"!==typeof OffscreenCanvas&&self instanceof WorkerGlobalScope,u="undefined"!==typeof Image&&Image.prototype.decode,c=function(){let t=!1;try{const e=Object.defineProperty({},"passive",{get:function(){t=!0}});window.addEventListener("_",null,e),window.removeEventListener("_",null,e)}catch(e){}return t}()},6292:(t,e,n)=>{n.d(e,{Ay:()=>l,D2:()=>h,e4:()=>a});var i=n(34120),s=n(82187),r=n(93474);class o extends i.A{constructor(t){super(),this.on,this.once,this.un,t&&t.handleEvent&&(this.handleEvent=t.handleEvent),this.map_=null,this.setActive(!0)}getActive(){return this.get(s.A.ACTIVE)}getMap(){return this.map_}handleEvent(t){return!0}setActive(t){this.set(s.A.ACTIVE,t)}setMap(t){this.map_=t}}function a(t,e,n){const i=t.getCenterInternal();if(i){const s=[i[0]+e[0],i[1]+e[1]];t.animateInternal({duration:void 0!==n?n:250,easing:r.sn,center:t.getConstrainedCenter(s)})}}function h(t,e,n,i){const s=t.getZoom();if(void 0===s)return;const o=t.getConstrainedZoom(s+e),a=t.getResolutionForZoom(o);t.getAnimating()&&t.cancelAnimations(),t.animate({resolution:a,anchor:n,duration:void 0!==i?i:250,easing:r.vT})}const l=o},21409:(t,e,n)=>{n.d(e,{A:()=>a,v:()=>o});var i=n(6292),s=n(73445);class r extends i.Ay{constructor(t){t=t||{},super(t),t.handleDownEvent&&(this.handleDownEvent=t.handleDownEvent),t.handleDragEvent&&(this.handleDragEvent=t.handleDragEvent),t.handleMoveEvent&&(this.handleMoveEvent=t.handleMoveEvent),t.handleUpEvent&&(this.handleUpEvent=t.handleUpEvent),t.stopDown&&(this.stopDown=t.stopDown),this.handlingDownUpSequence=!1,this.targetPointers=[]}getPointerCount(){return this.targetPointers.length}handleDownEvent(t){return!1}handleDragEvent(t){}handleEvent(t){if(!t.originalEvent)return!0;let e=!1;if(this.updateTrackedPointers_(t),this.handlingDownUpSequence){if(t.type==s.A.POINTERDRAG)this.handleDragEvent(t),t.originalEvent.preventDefault();else if(t.type==s.A.POINTERUP){const e=this.handleUpEvent(t);this.handlingDownUpSequence=e&&this.targetPointers.length>0}}else if(t.type==s.A.POINTERDOWN){const n=this.handleDownEvent(t);this.handlingDownUpSequence=n,e=this.stopDown(n)}else t.type==s.A.POINTERMOVE&&this.handleMoveEvent(t);return!e}handleMoveEvent(t){}handleUpEvent(t){return!1}stopDown(t){return t}updateTrackedPointers_(t){t.activePointers&&(this.targetPointers=t.activePointers)}}function o(t){const e=t.length;let n=0,i=0;for(let s=0;s<e;s++)n+=t[s].clientX,i+=t[s].clientY;return{clientX:n/e,clientY:i/e}}const a=r},82187:(t,e,n)=>{n.d(e,{A:()=>i});const i={ACTIVE:"active"}},42770:(t,e,n)=>{n.d(e,{A:()=>E});var i=n(50071),s=n(32135),r=n(1685),o=n(86717),a=n(6292),h=n(82986),l=n(74238),d=n(43530),u=n(29276),c=n(66514),g=n(4087),_=n(58704);const p={SELECT:"select"};class m extends r.Ay{constructor(t,e,n,i){super(t),this.selected=e,this.deselected=n,this.mapBrowserEvent=i}}const y={};class A extends a.Ay{constructor(t){let e;if(super(),this.on,this.once,this.un,t=t||{},this.boundAddFeature_=this.addFeature_.bind(this),this.boundRemoveFeature_=this.removeFeature_.bind(this),this.condition_=t.condition?t.condition:_.t5,this.addCondition_=t.addCondition?t.addCondition:_.Zm,this.removeCondition_=t.removeCondition?t.removeCondition:_.Zm,this.toggleCondition_=t.toggleCondition?t.toggleCondition:_.Kg,this.multi_=!!t.multi&&t.multi,this.filter_=t.filter?t.filter:l.rT,this.hitTolerance_=t.hitTolerance?t.hitTolerance:0,this.style_=void 0!==t.style?t.style:v(),this.features_=t.features||new i.A,t.layers)if("function"===typeof t.layers)e=t.layers;else{const n=t.layers;e=function(t){return n.includes(t)}}else e=l.rT;this.layerFilter_=e,this.featureLayerAssociation_={}}addFeatureLayerAssociation_(t,e){this.featureLayerAssociation_[(0,g.v6)(t)]=e}getFeatures(){return this.features_}getHitTolerance(){return this.hitTolerance_}getLayer(t){return this.featureLayerAssociation_[(0,g.v6)(t)]}setHitTolerance(t){this.hitTolerance_=t}setMap(t){const e=this.getMap();e&&this.style_&&this.features_.forEach(this.restorePreviousStyle_.bind(this)),super.setMap(t),t?(this.features_.addEventListener(s.A.ADD,this.boundAddFeature_),this.features_.addEventListener(s.A.REMOVE,this.boundRemoveFeature_),this.style_&&this.features_.forEach(this.applySelectedStyle_.bind(this))):(this.features_.removeEventListener(s.A.ADD,this.boundAddFeature_),this.features_.removeEventListener(s.A.REMOVE,this.boundRemoveFeature_))}addFeature_(t){const e=t.element;if(this.style_&&this.applySelectedStyle_(e),!this.getLayer(e)){const t=this.getMap().getAllLayers().find((function(t){if(t instanceof h["default"]&&t.getSource()&&t.getSource().hasFeature(e))return t}));t&&this.addFeatureLayerAssociation_(e,t)}}removeFeature_(t){this.style_&&this.restorePreviousStyle_(t.element)}getStyle(){return this.style_}applySelectedStyle_(t){const e=(0,g.v6)(t);e in y||(y[e]=t.getStyle()),t.setStyle(this.style_)}restorePreviousStyle_(t){const e=this.getMap().getInteractions().getArray();for(let i=e.length-1;i>=0;--i){const n=e[i];if(n!==this&&n instanceof A&&n.getStyle()&&-1!==n.getFeatures().getArray().lastIndexOf(t))return void t.setStyle(n.getStyle())}const n=(0,g.v6)(t);t.setStyle(y[n]),delete y[n]}removeFeatureLayerAssociation_(t){delete this.featureLayerAssociation_[(0,g.v6)(t)]}handleEvent(t){if(!this.condition_(t))return!0;const e=this.addCondition_(t),n=this.removeCondition_(t),i=this.toggleCondition_(t),s=!e&&!n&&!i,r=t.map,a=this.getFeatures(),h=[],l=[];if(s){(0,d.I)(this.featureLayerAssociation_),r.forEachFeatureAtPixel(t.pixel,((t,e)=>{if(t instanceof o["default"]&&this.filter_(t,e))return this.addFeatureLayerAssociation_(t,e),l.push(t),!this.multi_}),{layerFilter:this.layerFilter_,hitTolerance:this.hitTolerance_});for(let t=a.getLength()-1;t>=0;--t){const e=a.item(t),n=l.indexOf(e);n>-1?l.splice(n,1):(a.remove(e),h.push(e))}0!==l.length&&a.extend(l)}else{r.forEachFeatureAtPixel(t.pixel,((t,s)=>{if(t instanceof o["default"]&&this.filter_(t,s))return!e&&!i||a.getArray().includes(t)?(n||i)&&a.getArray().includes(t)&&(h.push(t),this.removeFeatureLayerAssociation_(t)):(this.addFeatureLayerAssociation_(t,s),l.push(t)),!this.multi_}),{layerFilter:this.layerFilter_,hitTolerance:this.hitTolerance_});for(let t=h.length-1;t>=0;--t)a.remove(h[t]);a.extend(l)}return(l.length>0||h.length>0)&&this.dispatchEvent(new m(p.SELECT,l,h,t)),!0}}function v(){const t=(0,u.createEditingStyle)();return(0,c.X$)(t["Polygon"],t["LineString"]),(0,c.X$)(t["GeometryCollection"],t["LineString"]),function(e){return e.getGeometry()?t[e.getGeometry().getType()]:null}}const E=A},94848:(t,e,n)=>{n.d(e,{N:()=>B});var i=n(50071),s=n(6292),r=n(73445);class o extends s.Ay{constructor(t){super(),t=t||{},this.delta_=t.delta?t.delta:1,this.duration_=void 0!==t.duration?t.duration:250}handleEvent(t){let e=!1;if(t.type==r.A.DBLCLICK){const n=t.originalEvent,i=t.map,r=t.coordinate,o=n.shiftKey?-this.delta_:this.delta_,a=i.getView();(0,s.D2)(a,o,r,this.duration_),n.preventDefault(),e=!0}return!e}}const a=o;var h=n(21409),l=n(74238),d=n(58704),u=n(93474),c=n(6933);class g extends h.A{constructor(t){super({stopDown:l.W8}),t=t||{},this.kinetic_=t.kinetic,this.lastCentroid=null,this.lastPointersCount_,this.panning_=!1;const e=t.condition?t.condition:(0,d.Q7)(d.TS,d.fs);this.condition_=t.onFocusOnly?(0,d.Q7)(d.eL,e):e,this.noKinetic_=!1}handleDragEvent(t){const e=t.map;this.panning_||(this.panning_=!0,e.getView().beginInteraction());const n=this.targetPointers,i=e.getEventPixel((0,h.v)(n));if(n.length==this.lastPointersCount_){if(this.kinetic_&&this.kinetic_.update(i[0],i[1]),this.lastCentroid){const e=[this.lastCentroid[0]-i[0],i[1]-this.lastCentroid[1]],n=t.map,s=n.getView();(0,c.hs)(e,s.getResolution()),(0,c.e$)(e,s.getRotation()),s.adjustCenterInternal(e)}}else this.kinetic_&&this.kinetic_.begin();this.lastCentroid=i,this.lastPointersCount_=n.length,t.originalEvent.preventDefault()}handleUpEvent(t){const e=t.map,n=e.getView();if(0===this.targetPointers.length){if(!this.noKinetic_&&this.kinetic_&&this.kinetic_.end()){const t=this.kinetic_.getDistance(),i=this.kinetic_.getAngle(),s=n.getCenterInternal(),r=e.getPixelFromCoordinateInternal(s),o=e.getCoordinateFromPixelInternal([r[0]-t*Math.cos(i),r[1]-t*Math.sin(i)]);n.animateInternal({center:n.getConstrainedCenter(o),duration:500,easing:u.vT})}return this.panning_&&(this.panning_=!1,n.endInteraction()),!1}return this.kinetic_&&this.kinetic_.begin(),this.lastCentroid=null,!0}handleDownEvent(t){if(this.targetPointers.length>0&&this.condition_(t)){const e=t.map,n=e.getView();return this.lastCentroid=null,n.getAnimating()&&n.cancelAnimations(),this.kinetic_&&this.kinetic_.begin(),this.noKinetic_=this.targetPointers.length>1,!0}return!1}}const _=g;var p=n(24498);class m extends h.A{constructor(t){t=t||{},super({stopDown:l.W8}),this.condition_=t.condition?t.condition:d.IO,this.lastAngle_=void 0,this.duration_=void 0!==t.duration?t.duration:250}handleDragEvent(t){if(!(0,d.A4)(t))return;const e=t.map,n=e.getView();if(n.getConstraints().rotation===p.b8)return;const i=e.getSize(),s=t.pixel,r=Math.atan2(i[1]/2-s[1],s[0]-i[0]/2);if(void 0!==this.lastAngle_){const t=r-this.lastAngle_;n.adjustRotationInternal(-t)}this.lastAngle_=r}handleUpEvent(t){if(!(0,d.A4)(t))return!0;const e=t.map,n=e.getView();return n.endInteraction(this.duration_),!1}handleDownEvent(t){if(!(0,d.A4)(t))return!1;if((0,d.at)(t)&&this.condition_(t)){const e=t.map;return e.getView().beginInteraction(),this.lastAngle_=void 0,!0}return!1}}const y=m;var A=n(1685),v=n(53537);const E={BOXSTART:"boxstart",BOXDRAG:"boxdrag",BOXEND:"boxend",BOXCANCEL:"boxcancel"};class f extends A.Ay{constructor(t,e,n){super(t),this.coordinate=e,this.mapBrowserEvent=n}}class R extends h.A{constructor(t){super(),this.on,this.once,this.un,t=t||{},this.box_=new v.A(t.className||"ol-dragbox"),this.minArea_=void 0!==t.minArea?t.minArea:64,t.onBoxEnd&&(this.onBoxEnd=t.onBoxEnd),this.startPixel_=null,this.condition_=t.condition?t.condition:d.at,this.boxEndCondition_=t.boxEndCondition?t.boxEndCondition:this.defaultBoxEndCondition}defaultBoxEndCondition(t,e,n){const i=n[0]-e[0],s=n[1]-e[1];return i*i+s*s>=this.minArea_}getGeometry(){return this.box_.getGeometry()}handleDragEvent(t){this.startPixel_&&(this.box_.setPixels(this.startPixel_,t.pixel),this.dispatchEvent(new f(E.BOXDRAG,t.coordinate,t)))}handleUpEvent(t){if(!this.startPixel_)return!1;this.box_.setMap(null);const e=this.boxEndCondition_(t,this.startPixel_,t.pixel);return e&&this.onBoxEnd(t),this.dispatchEvent(new f(e?E.BOXEND:E.BOXCANCEL,t.coordinate,t)),!1}handleDownEvent(t){return!!this.condition_(t)&&(this.startPixel_=t.pixel,this.box_.setMap(t.map),this.box_.setPixels(this.startPixel_,this.startPixel_),this.dispatchEvent(new f(E.BOXSTART,t.coordinate,t)),!0)}onBoxEnd(t){}setActive(t){t||(this.box_.setMap(null),this.startPixel_&&(this.dispatchEvent(new f(E.BOXCANCEL,this.startPixel_,null)),this.startPixel_=null)),super.setActive(t)}}const x=R;class D extends x{constructor(t){t=t||{};const e=t.condition?t.condition:d.Kg;super({condition:e,className:t.className||"ol-dragzoom",minArea:t.minArea}),this.duration_=void 0!==t.duration?t.duration:200,this.out_=void 0!==t.out&&t.out}onBoxEnd(t){const e=this.getMap(),n=e.getView();let i=this.getGeometry();if(this.out_){const t=n.rotatedExtentForGeometry(i),e=n.getResolutionForExtentInternal(t),s=n.getResolution()/e;i=i.clone(),i.scale(s*s)}n.fitInternal(i,{duration:this.duration_,easing:u.vT})}}const I=D;var S=n(6837),O=n(28686);class L extends s.Ay{constructor(t){super(),t=t||{},this.defaultCondition_=function(t){return(0,d.TS)(t)&&(0,d.tE)(t)},this.condition_=void 0!==t.condition?t.condition:this.defaultCondition_,this.duration_=void 0!==t.duration?t.duration:100,this.pixelDelta_=void 0!==t.pixelDelta?t.pixelDelta:128}handleEvent(t){let e=!1;if(t.type==S.A.KEYDOWN){const n=t.originalEvent,i=n.key;if(this.condition_(t)&&(i==O.A.DOWN||i==O.A.LEFT||i==O.A.RIGHT||i==O.A.UP)){const r=t.map,o=r.getView(),a=o.getResolution()*this.pixelDelta_;let h=0,l=0;i==O.A.DOWN?l=-a:i==O.A.LEFT?h=-a:i==O.A.RIGHT?h=a:l=a;const d=[h,l];(0,c.e$)(d,o.getRotation()),(0,s.e4)(o,d,this.duration_),n.preventDefault(),e=!0}}return!e}}const T=L;class w extends s.Ay{constructor(t){super(),t=t||{},this.condition_=t.condition?t.condition:function(t){return!(0,d.GB)(t)&&(0,d.tE)(t)},this.delta_=t.delta?t.delta:1,this.duration_=void 0!==t.duration?t.duration:100}handleEvent(t){let e=!1;if(t.type==S.A.KEYDOWN||t.type==S.A.KEYPRESS){const n=t.originalEvent,i=n.key;if(this.condition_(t)&&("+"===i||"-"===i)){const r=t.map,o="+"===i?this.delta_:-this.delta_,a=r.getView();(0,s.D2)(a,o,void 0,this.duration_),n.preventDefault(),e=!0}}return!e}}const b=w;var C=n(4792),P=n(7771),M=n(61597);class N extends s.Ay{constructor(t){t=t||{},super(t),this.totalDelta_=0,this.lastDelta_=0,this.maxDelta_=void 0!==t.maxDelta?t.maxDelta:1,this.duration_=void 0!==t.duration?t.duration:250,this.timeout_=void 0!==t.timeout?t.timeout:80,this.useAnchor_=void 0===t.useAnchor||t.useAnchor,this.constrainResolution_=void 0!==t.constrainResolution&&t.constrainResolution;const e=t.condition?t.condition:d.Gk;this.condition_=t.onFocusOnly?(0,d.Q7)(d.eL,e):e,this.lastAnchor_=null,this.startTime_=void 0,this.timeoutId_,this.mode_=void 0,this.trackpadEventGap_=400,this.trackpadTimeoutId_,this.deltaPerZoom_=300}endInteraction_(){this.trackpadTimeoutId_=void 0;const t=this.getMap();if(!t)return;const e=t.getView();e.endInteraction(void 0,this.lastDelta_?this.lastDelta_>0?1:-1:0,this.lastAnchor_)}handleEvent(t){if(!this.condition_(t))return!0;const e=t.type;if(e!==S.A.WHEEL)return!0;const n=t.map,i=t.originalEvent;let s;if(i.preventDefault(),this.useAnchor_&&(this.lastAnchor_=t.coordinate),t.type==S.A.WHEEL&&(s=i.deltaY,P._p&&i.deltaMode===WheelEvent.DOM_DELTA_PIXEL&&(s/=P.cr),i.deltaMode===WheelEvent.DOM_DELTA_LINE&&(s*=40)),0===s)return!1;this.lastDelta_=s;const r=Date.now();void 0===this.startTime_&&(this.startTime_=r),(!this.mode_||r-this.startTime_>this.trackpadEventGap_)&&(this.mode_=Math.abs(s)<4?"trackpad":"wheel");const o=n.getView();if("trackpad"===this.mode_&&!o.getConstrainResolution()&&!this.constrainResolution_)return this.trackpadTimeoutId_?clearTimeout(this.trackpadTimeoutId_):(o.getAnimating()&&o.cancelAnimations(),o.beginInteraction()),this.trackpadTimeoutId_=setTimeout(this.endInteraction_.bind(this),this.timeout_),o.adjustZoom(-s/this.deltaPerZoom_,this.lastAnchor_),this.startTime_=r,!1;this.totalDelta_+=s;const a=Math.max(this.timeout_-(r-this.startTime_),0);return clearTimeout(this.timeoutId_),this.timeoutId_=setTimeout(this.handleWheelZoom_.bind(this,n),a),!1}handleWheelZoom_(t){const e=t.getView();e.getAnimating()&&e.cancelAnimations();let n=-(0,M.qE)(this.totalDelta_,-this.maxDelta_*this.deltaPerZoom_,this.maxDelta_*this.deltaPerZoom_)/this.deltaPerZoom_;(e.getConstrainResolution()||this.constrainResolution_)&&(n=n?n>0?1:-1:0),(0,s.D2)(e,n,this.lastAnchor_,this.duration_),this.mode_=void 0,this.totalDelta_=0,this.lastAnchor_=null,this.startTime_=void 0,this.timeoutId_=void 0}setMouseAnchor(t){this.useAnchor_=t,t||(this.lastAnchor_=null)}}const F=N;class Z extends h.A{constructor(t){t=t||{};const e=t;e.stopDown||(e.stopDown=l.W8),super(e),this.anchor_=null,this.lastAngle_=void 0,this.rotating_=!1,this.rotationDelta_=0,this.threshold_=void 0!==t.threshold?t.threshold:.3,this.duration_=void 0!==t.duration?t.duration:250}handleDragEvent(t){let e=0;const n=this.targetPointers[0],i=this.targetPointers[1],s=Math.atan2(i.clientY-n.clientY,i.clientX-n.clientX);if(void 0!==this.lastAngle_){const t=s-this.lastAngle_;this.rotationDelta_+=t,!this.rotating_&&Math.abs(this.rotationDelta_)>this.threshold_&&(this.rotating_=!0),e=t}this.lastAngle_=s;const r=t.map,o=r.getView();o.getConstraints().rotation!==p.b8&&(this.anchor_=r.getCoordinateFromPixelInternal(r.getEventPixel((0,h.v)(this.targetPointers))),this.rotating_&&(r.render(),o.adjustRotationInternal(e,this.anchor_)))}handleUpEvent(t){if(this.targetPointers.length<2){const e=t.map,n=e.getView();return n.endInteraction(this.duration_),!1}return!0}handleDownEvent(t){if(this.targetPointers.length>=2){const e=t.map;return this.anchor_=null,this.lastAngle_=void 0,this.rotating_=!1,this.rotationDelta_=0,this.handlingDownUpSequence||e.getView().beginInteraction(),!0}return!1}}const U=Z;class k extends h.A{constructor(t){t=t||{};const e=t;e.stopDown||(e.stopDown=l.W8),super(e),this.anchor_=null,this.duration_=void 0!==t.duration?t.duration:400,this.lastDistance_=void 0,this.lastScaleDelta_=1}handleDragEvent(t){let e=1;const n=this.targetPointers[0],i=this.targetPointers[1],s=n.clientX-i.clientX,r=n.clientY-i.clientY,o=Math.sqrt(s*s+r*r);void 0!==this.lastDistance_&&(e=this.lastDistance_/o),this.lastDistance_=o;const a=t.map,l=a.getView();1!=e&&(this.lastScaleDelta_=e),this.anchor_=a.getCoordinateFromPixelInternal(a.getEventPixel((0,h.v)(this.targetPointers))),a.render(),l.adjustResolutionInternal(e,this.anchor_)}handleUpEvent(t){if(this.targetPointers.length<2){const e=t.map,n=e.getView(),i=this.lastScaleDelta_>1?1:-1;return n.endInteraction(this.duration_,i),!1}return!0}handleDownEvent(t){if(this.targetPointers.length>=2){const e=t.map;return this.anchor_=null,this.lastDistance_=void 0,this.lastScaleDelta_=1,this.handlingDownUpSequence||e.getView().beginInteraction(),!0}return!1}}const K=k;function B(t){t=t||{};const e=new i.A,n=new C.A(-.005,.05,100),s=void 0===t.altShiftDragRotate||t.altShiftDragRotate;s&&e.push(new y);const r=void 0===t.doubleClickZoom||t.doubleClickZoom;r&&e.push(new a({delta:t.zoomDelta,duration:t.zoomDuration}));const o=void 0===t.dragPan||t.dragPan;o&&e.push(new _({onFocusOnly:t.onFocusOnly,kinetic:n}));const h=void 0===t.pinchRotate||t.pinchRotate;h&&e.push(new U);const l=void 0===t.pinchZoom||t.pinchZoom;l&&e.push(new K({duration:t.zoomDuration}));const d=void 0===t.keyboard||t.keyboard;d&&(e.push(new T),e.push(new b({delta:t.zoomDelta,duration:t.zoomDuration})));const u=void 0===t.mouseWheelZoom||t.mouseWheelZoom;u&&e.push(new F({onFocusOnly:t.onFocusOnly,duration:t.zoomDuration}));const c=void 0===t.shiftDragZoom||t.shiftDragZoom;return c&&e.push(new I({duration:t.zoomDuration})),e}},58620:(t,e,n)=>{n.d(e,{A:()=>l});var i=n(34120),s=n(75332),r=n(4087),o=n(90588),a=n(61597);class h extends i.A{constructor(t){super(),this.on,this.once,this.un,this.background_=t.background;const e=Object.assign({},t);"object"===typeof t.properties&&(delete e.properties,Object.assign(e,t.properties)),e[s.A.OPACITY]=void 0!==t.opacity?t.opacity:1,(0,o.v)("number"===typeof e[s.A.OPACITY],"Layer opacity must be a number"),e[s.A.VISIBLE]=void 0===t.visible||t.visible,e[s.A.Z_INDEX]=t.zIndex,e[s.A.MAX_RESOLUTION]=void 0!==t.maxResolution?t.maxResolution:1/0,e[s.A.MIN_RESOLUTION]=void 0!==t.minResolution?t.minResolution:0,e[s.A.MIN_ZOOM]=void 0!==t.minZoom?t.minZoom:-1/0,e[s.A.MAX_ZOOM]=void 0!==t.maxZoom?t.maxZoom:1/0,this.className_=void 0!==e.className?e.className:"ol-layer",delete e.className,this.setProperties(e),this.state_=null}getBackground(){return this.background_}getClassName(){return this.className_}getLayerState(t){const e=this.state_||{layer:this,managed:void 0===t||t},n=this.getZIndex();return e.opacity=(0,a.qE)(Math.round(100*this.getOpacity())/100,0,1),e.visible=this.getVisible(),e.extent=this.getExtent(),e.zIndex=void 0!==n||e.managed?n:1/0,e.maxResolution=this.getMaxResolution(),e.minResolution=Math.max(this.getMinResolution(),0),e.minZoom=this.getMinZoom(),e.maxZoom=this.getMaxZoom(),this.state_=e,e}getLayersArray(t){return(0,r.b0)()}getLayerStatesArray(t){return(0,r.b0)()}getExtent(){return this.get(s.A.EXTENT)}getMaxResolution(){return this.get(s.A.MAX_RESOLUTION)}getMinResolution(){return this.get(s.A.MIN_RESOLUTION)}getMinZoom(){return this.get(s.A.MIN_ZOOM)}getMaxZoom(){return this.get(s.A.MAX_ZOOM)}getOpacity(){return this.get(s.A.OPACITY)}getSourceState(){return(0,r.b0)()}getVisible(){return this.get(s.A.VISIBLE)}getZIndex(){return this.get(s.A.Z_INDEX)}setBackground(t){this.background_=t,this.changed()}setExtent(t){this.set(s.A.EXTENT,t)}setMaxResolution(t){this.set(s.A.MAX_RESOLUTION,t)}setMinResolution(t){this.set(s.A.MIN_RESOLUTION,t)}setMaxZoom(t){this.set(s.A.MAX_ZOOM,t)}setMinZoom(t){this.set(s.A.MIN_ZOOM,t)}setOpacity(t){(0,o.v)("number"===typeof t,"Layer opacity must be a number"),this.set(s.A.OPACITY,t)}setVisible(t){this.set(s.A.VISIBLE,t)}setZIndex(t){this.set(s.A.Z_INDEX,t)}disposeInternal(){this.state_&&(this.state_.layer=null,this.state_=null),super.disposeInternal()}}const l=h},22808:(t,e,n)=>{n.d(e,{A:()=>o});var i=n(60764),s=n(45360);class r extends i.A{constructor(t){t=t||{};const e=Object.assign({},t);delete e.preload,delete e.useInterimTilesOnError,super(e),this.on,this.once,this.un,this.setPreload(void 0!==t.preload?t.preload:0),this.setUseInterimTilesOnError(void 0===t.useInterimTilesOnError||t.useInterimTilesOnError)}getPreload(){return this.get(s.A.PRELOAD)}setPreload(t){this.set(s.A.PRELOAD,t)}getUseInterimTilesOnError(){return this.get(s.A.USE_INTERIM_TILES_ON_ERROR)}setUseInterimTilesOnError(t){this.set(s.A.USE_INTERIM_TILES_ON_ERROR,t)}getData(t){return super.getData(t)}}const o=r},16323:(t,e,n)=>{n.d(e,{A:()=>d});var i=n(60764),s=n(35341),r=n(29276),o=n(77048);const a={RENDER_ORDER:"renderOrder"};class h extends i.A{constructor(t){t=t||{};const e=Object.assign({},t);delete e.style,delete e.renderBuffer,delete e.updateWhileAnimating,delete e.updateWhileInteracting,super(e),this.declutter_=t.declutter?String(t.declutter):void 0,this.renderBuffer_=void 0!==t.renderBuffer?t.renderBuffer:100,this.style_=null,this.styleFunction_=void 0,this.setStyle(t.style),this.updateWhileAnimating_=void 0!==t.updateWhileAnimating&&t.updateWhileAnimating,this.updateWhileInteracting_=void 0!==t.updateWhileInteracting&&t.updateWhileInteracting}getDeclutter(){return this.declutter_}getFeatures(t){return super.getFeatures(t)}getRenderBuffer(){return this.renderBuffer_}getRenderOrder(){return this.get(a.RENDER_ORDER)}getStyle(){return this.style_}getStyleFunction(){return this.styleFunction_}getUpdateWhileAnimating(){return this.updateWhileAnimating_}getUpdateWhileInteracting(){return this.updateWhileInteracting_}renderDeclutter(t,e){const n=this.getDeclutter();n in t.declutter===!1&&(t.declutter[n]=new s(9)),this.getRenderer().renderDeclutter(t,e)}setRenderOrder(t){this.set(a.RENDER_ORDER,t)}setStyle(t){this.style_=void 0===t?r.createDefaultStyle:t;const e=l(t);this.styleFunction_=null===t?void 0:(0,r.toFunction)(e),this.changed()}}function l(t){if(void 0===t)return r.createDefaultStyle;if(!t)return null;if("function"===typeof t)return t;if(t instanceof r["default"])return t;if(!Array.isArray(t))return(0,o.u7)([t]);if(0===t.length)return[];const e=t.length,n=t[0];if(n instanceof r["default"]){const n=new Array(e);for(let i=0;i<e;++i){const e=t[i];if(!(e instanceof r["default"]))throw new Error("Expected a list of style instances");n[i]=e}return n}if("style"in n){const n=new Array(e);for(let i=0;i<e;++i){const e=t[i];if(!("style"in e))throw new Error("Expected a list of rules with a style property");n[i]=e}return(0,o.i7)(n)}const i=t;return(0,o.u7)(i)}const d=h},35598:(t,e,n)=>{n.d(e,{A:()=>y,i:()=>_});var i=n(58620),s=n(50071),r=n(32135),o=n(1685),a=n(6837),h=n(28450),l=n(90588),d=n(43530),u=n(70915),c=n(4087),g=n(9438);class _ extends o.Ay{constructor(t,e){super(t),this.layer=e}}const p={LAYERS:"layers"};class m extends i.A{constructor(t){t=t||{};const e=Object.assign({},t);delete e.layers;let n=t.layers;super(e),this.on,this.once,this.un,this.layersListenerKeys_=[],this.listenerKeys_={},this.addChangeListener(p.LAYERS,this.handleLayersChanged_),n?Array.isArray(n)?n=new s.A(n.slice(),{unique:!0}):(0,l.v)("function"===typeof n.getArray,"Expected `layers` to be an array or a `Collection`"):n=new s.A(void 0,{unique:!0}),this.setLayers(n)}handleLayerChange_(){this.changed()}handleLayersChanged_(){this.layersListenerKeys_.forEach(g.JH),this.layersListenerKeys_.length=0;const t=this.getLayers();this.layersListenerKeys_.push((0,g.KT)(t,r.A.ADD,this.handleLayersAdd_,this),(0,g.KT)(t,r.A.REMOVE,this.handleLayersRemove_,this));for(const n in this.listenerKeys_)this.listenerKeys_[n].forEach(g.JH);(0,d.I)(this.listenerKeys_);const e=t.getArray();for(let n=0,i=e.length;n<i;n++){const t=e[n];this.registerLayerListeners_(t),this.dispatchEvent(new _("addlayer",t))}this.changed()}registerLayerListeners_(t){const e=[(0,g.KT)(t,h.A.PROPERTYCHANGE,this.handleLayerChange_,this),(0,g.KT)(t,a.A.CHANGE,this.handleLayerChange_,this)];t instanceof m&&e.push((0,g.KT)(t,"addlayer",this.handleLayerGroupAdd_,this),(0,g.KT)(t,"removelayer",this.handleLayerGroupRemove_,this)),this.listenerKeys_[(0,c.v6)(t)]=e}handleLayerGroupAdd_(t){this.dispatchEvent(new _("addlayer",t.layer))}handleLayerGroupRemove_(t){this.dispatchEvent(new _("removelayer",t.layer))}handleLayersAdd_(t){const e=t.element;this.registerLayerListeners_(e),this.dispatchEvent(new _("addlayer",e)),this.changed()}handleLayersRemove_(t){const e=t.element,n=(0,c.v6)(e);this.listenerKeys_[n].forEach(g.JH),delete this.listenerKeys_[n],this.dispatchEvent(new _("removelayer",e)),this.changed()}getLayers(){return this.get(p.LAYERS)}setLayers(t){const e=this.getLayers();if(e){const t=e.getArray();for(let e=0,n=t.length;e<n;++e)this.dispatchEvent(new _("removelayer",t[e]))}this.set(p.LAYERS,t)}getLayersArray(t){return t=void 0!==t?t:[],this.getLayers().forEach((function(e){e.getLayersArray(t)})),t}getLayerStatesArray(t){const e=void 0!==t?t:[],n=e.length;this.getLayers().forEach((function(t){t.getLayerStatesArray(e)}));const i=this.getLayerState();let s=i.zIndex;t||void 0!==i.zIndex||(s=0);for(let r=n,o=e.length;r<o;r++){const t=e[r];t.opacity*=i.opacity,t.visible=t.visible&&i.visible,t.maxResolution=Math.min(t.maxResolution,i.maxResolution),t.minResolution=Math.max(t.minResolution,i.minResolution),t.minZoom=Math.max(t.minZoom,i.minZoom),t.maxZoom=Math.min(t.maxZoom,i.maxZoom),void 0!==i.extent&&(void 0!==t.extent?t.extent=(0,u._N)(t.extent,i.extent):t.extent=i.extent),void 0===t.zIndex&&(t.zIndex=s)}return e}getSourceState(){return"ready"}}const y=m},41789:(t,e,n)=>{n.d(e,{A:()=>c});var i=n(16323),s=n(78537),r=n(3973),o=n(61597),a=n(68711);const h={BLUR:"blur",GRADIENT:"gradient",RADIUS:"radius"},l=["#00f","#0ff","#0f0","#ff0","#f00"];class d extends i.A{constructor(t){t=t||{};const e=Object.assign({},t);delete e.gradient,delete e.radius,delete e.blur,delete e.weight,super(e),this.gradient_=null,this.addChangeListener(h.GRADIENT,this.handleGradientChanged_),this.setGradient(t.gradient?t.gradient:l),this.setBlur(void 0!==t.blur?t.blur:15),this.setRadius(void 0!==t.radius?t.radius:8);const n=t.weight?t.weight:"weight";this.weightFunction_="string"===typeof n?function(t){return t.get(n)}:n,this.setRenderOrder(null)}getBlur(){return this.get(h.BLUR)}getGradient(){return this.get(h.GRADIENT)}getRadius(){return this.get(h.RADIUS)}handleGradientChanged_(){this.gradient_=u(this.getGradient())}setBlur(t){this.set(h.BLUR,t)}setGradient(t){this.set(h.GRADIENT,t)}setRadius(t){this.set(h.RADIUS,t)}createRenderer(){const t=(new r.N).addAttribute("float a_prop_weight").addVarying("v_prop_weight","float","a_prop_weight").addUniform("float u_size").addUniform("float u_blurSlope").setSymbolSizeExpression("vec2(u_size)").setSymbolColorExpression("vec4(smoothstep(0., 1., (1. - length(coordsPx * 2. / v_quadSizePx)) * u_blurSlope) * v_prop_weight)");return new s.A(this,{className:this.getClassName(),attributes:[{name:"weight",callback:t=>{const e=this.weightFunction_(t);return void 0!==e?(0,o.qE)(e,0,1):1}}],uniforms:{u_size:()=>2*(this.get(h.RADIUS)+this.get(h.BLUR)),u_blurSlope:()=>this.get(h.RADIUS)/Math.max(1,this.get(h.BLUR))},hitDetectionEnabled:!0,vertexShader:t.getSymbolVertexShader(),fragmentShader:t.getSymbolFragmentShader(),postProcesses:[{fragmentShader:"\n            precision mediump float;\n\n            uniform sampler2D u_image;\n            uniform sampler2D u_gradientTexture;\n            uniform float u_opacity;\n\n            varying vec2 v_texCoord;\n\n            void main() {\n              vec4 color = texture2D(u_image, v_texCoord);\n              gl_FragColor.a = color.a * u_opacity;\n              gl_FragColor.rgb = texture2D(u_gradientTexture, vec2(0.5, color.a)).rgb;\n              gl_FragColor.rgb *= gl_FragColor.a;\n            }",uniforms:{u_gradientTexture:()=>this.gradient_,u_opacity:()=>this.getOpacity()}}]})}renderDeclutter(){}}function u(t){const e=1,n=256,i=(0,a.Y)(e,n),s=i.createLinearGradient(0,0,e,n),r=1/(t.length-1);for(let o=0,a=t.length;o<a;++o)s.addColorStop(o*r,t[o]);return i.fillStyle=s,i.fillRect(0,0,e,n),i.canvas}const c=d},70167:(t,e,n)=>{n.d(e,{A:()=>h});var i=n(60764);class s extends i.A{constructor(t){t=t||{},super(t)}}const r=s;var o=n(69796);class a extends r{constructor(t){super(t)}createRenderer(){return new o.A(this)}getData(t){return super.getData(t)}}const h=a},60764:(t,e,n)=>{n.d(e,{A:()=>g,l:()=>c});var i=n(58620),s=n(6837),r=n(75332),o=n(83984),a=n(866),h=n(90588),l=n(70915),d=n(9438);class u extends i.A{constructor(t){const e=Object.assign({},t);delete e.source,super(e),this.on,this.once,this.un,this.mapPrecomposeKey_=null,this.mapRenderKey_=null,this.sourceChangeKey_=null,this.renderer_=null,this.sourceReady_=!1,this.rendered=!1,t.render&&(this.render=t.render),t.map&&this.setMap(t.map),this.addChangeListener(r.A.SOURCE,this.handleSourcePropertyChange_);const n=t.source?t.source:null;this.setSource(n)}getLayersArray(t){return t=t||[],t.push(this),t}getLayerStatesArray(t){return t=t||[],t.push(this.getLayerState()),t}getSource(){return this.get(r.A.SOURCE)||null}getRenderSource(){return this.getSource()}getSourceState(){const t=this.getSource();return t?t.getState():"undefined"}handleSourceChange_(){this.changed(),this.sourceReady_||"ready"!==this.getSource().getState()||(this.sourceReady_=!0,this.dispatchEvent("sourceready"))}handleSourcePropertyChange_(){this.sourceChangeKey_&&((0,d.JH)(this.sourceChangeKey_),this.sourceChangeKey_=null),this.sourceReady_=!1;const t=this.getSource();t&&(this.sourceChangeKey_=(0,d.KT)(t,s.A.CHANGE,this.handleSourceChange_,this),"ready"===t.getState()&&(this.sourceReady_=!0,setTimeout((()=>{this.dispatchEvent("sourceready")}),0))),this.changed()}getFeatures(t){return this.renderer_?this.renderer_.getFeatures(t):Promise.resolve([])}getData(t){return this.renderer_&&this.rendered?this.renderer_.getData(t):null}isVisible(t){let e;const n=this.getMapInternal();let i;!t&&n&&(t=n.getView()),e=t instanceof a.Ay?{viewState:t.getState(),extent:t.calculateExtent()}:t,!e.layerStatesArray&&n&&(e.layerStatesArray=n.getLayerGroup().getLayerStatesArray()),i=e.layerStatesArray?e.layerStatesArray.find((t=>t.layer===this)):this.getLayerState();const s=this.getExtent();return c(i,e.viewState)&&(!s||(0,l.HY)(s,e.extent))}getAttributions(t){if(!this.isVisible(t))return[];let e;const n=this.getSource();if(n&&(e=n.getAttributions()),!e)return[];const i=t instanceof a.Ay?t.getViewStateAndExtent():t;let s=e(i);return Array.isArray(s)||(s=[s]),s}render(t,e){const n=this.getRenderer();return n.prepareFrame(t)?(this.rendered=!0,n.renderFrame(t,e)):null}unrender(){this.rendered=!1}getDeclutter(){}renderDeclutter(t,e){}renderDeferred(t){const e=this.getRenderer();e&&e.renderDeferred(t)}setMapInternal(t){t||this.unrender(),this.set(r.A.MAP,t)}getMapInternal(){return this.get(r.A.MAP)}setMap(t){this.mapPrecomposeKey_&&((0,d.JH)(this.mapPrecomposeKey_),this.mapPrecomposeKey_=null),t||this.changed(),this.mapRenderKey_&&((0,d.JH)(this.mapRenderKey_),this.mapRenderKey_=null),t&&(this.mapPrecomposeKey_=(0,d.KT)(t,o.A.PRECOMPOSE,(function(t){const e=t,n=e.frameState.layerStatesArray,i=this.getLayerState(!1);(0,h.v)(!n.some((function(t){return t.layer===i.layer})),"A layer can only be added to the map once. Use either `layer.setMap()` or `map.addLayer()`, not both."),n.push(i)}),this),this.mapRenderKey_=(0,d.KT)(this,s.A.CHANGE,t.render,t),this.changed())}setSource(t){this.set(r.A.SOURCE,t)}getRenderer(){return this.renderer_||(this.renderer_=this.createRenderer()),this.renderer_}hasRenderer(){return!!this.renderer_}createRenderer(){return null}disposeInternal(){this.renderer_&&(this.renderer_.dispose(),delete this.renderer_),this.setSource(null),super.disposeInternal()}}function c(t,e){if(!t.visible)return!1;const n=e.resolution;if(n<t.minResolution||n>=t.maxResolution)return!1;const i=e.zoom;return i>t.minZoom&&i<=t.maxZoom}const g=u},75332:(t,e,n)=>{n.d(e,{A:()=>i});const i={OPACITY:"opacity",VISIBLE:"visible",EXTENT:"extent",Z_INDEX:"zIndex",MAX_RESOLUTION:"maxResolution",MIN_RESOLUTION:"minResolution",MAX_ZOOM:"maxZoom",MIN_ZOOM:"minZoom",SOURCE:"source",MAP:"map"}},30945:(t,e,n)=>{n.d(e,{A:()=>o});var i=n(22808),s=n(24029);class r extends i.A{constructor(t){super(t)}createRenderer(){return new s.A(this)}}const o=r},45360:(t,e,n)=>{n.d(e,{A:()=>i});const i={PRELOAD:"preload",USE_INTERIM_TILES_ON_ERROR:"useInterimTilesOnError"}},82986:(t,e,n)=>{n.r(e),n.d(e,{default:()=>o});var i=n(16323),s=n(32348);class r extends i.A{constructor(t){super(t)}createRenderer(){return new s.A(this)}}const o=r},38854:(t,e,n)=>{n.d(e,{A:()=>h});var i=n(16323),s=n(25288),r=n(45360),o=n(90588);class a extends i.A{constructor(t){t=t||{};const e=Object.assign({},t);delete e.preload,delete e.useInterimTilesOnError,super(e),this.on,this.once,this.un;const n=t.renderMode||"hybrid";(0,o.v)("hybrid"==n||"vector"==n,"`renderMode` must be `'hybrid'` or `'vector'`"),this.renderMode_=n,this.setPreload(t.preload?t.preload:0),this.setUseInterimTilesOnError(void 0===t.useInterimTilesOnError||t.useInterimTilesOnError),this.getBackground,this.setBackground}createRenderer(){return new s.A(this)}getFeatures(t){return super.getFeatures(t)}getRenderMode(){return this.renderMode_}getPreload(){return this.get(r.A.PRELOAD)}getUseInterimTilesOnError(){return this.get(r.A.USE_INTERIM_TILES_ON_ERROR)}setPreload(t){this.set(r.A.PRELOAD,t)}setUseInterimTilesOnError(t){this.set(r.A.USE_INTERIM_TILES_ON_ERROR,t)}}const h=a},60942:(t,e,n)=>{n.d(e,{Q7:()=>i});n(89718);function i(t,e){return[[-1/0,-1/0,1/0,1/0]]}},43530:(t,e,n)=>{function i(t){for(const e in t)delete t[e]}function s(t){let e;for(e in t)return!1;return!e}n.d(e,{I:()=>i,p:()=>s})}}]);
//# sourceMappingURL=1189.28d13caa.js.map