///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/i18n!esri/nls/jsapi',
    'dojo/keys',
    'dojo/on',
    'dojo/dom-class',
    'dojo/dom',
    'dojo/query',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'esri/dijit/editing/Editor',
    'esri/layers/FeatureLayer',
    'esri/dijit/editing/TemplatePicker'
],
    function(declare, lang, html, esriBundle, keys, on, domClass, dom, query, _WidgetsInTemplateMixin, BaseWidget, Editor, FeatureLayer, TemplatePicker) {
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            name: 'Edit',
            baseClass: 'jimu-widget-edit',
            editor: null,
            layers: null,

            onOpen: function() {
                this.layers = [];
                this.disableWebMapPopup();
                this.getLayers();
                this.initEditor(0);
                this.initDivClickEvent();
                this.initMissionsTab();
            },

            initMissionsTab: function() {
                domClass.add(dom.byId("missionsTab"), "active");
                domClass.remove(dom.byId("eventsTab"), "active");
                domClass.remove(dom.byId("controlMeasuresTab"), "active");
            },

            initDivClickEvent: function() {
                this.own(query("#missionsTab").onclick(lang.hitch(this, this.setTab)));
                this.own(query("#eventsTab").onclick(lang.hitch(this, this.setTab)));
                this.own(query("#controlMeasuresTab").onclick(lang.hitch(this, this.setTab)));
            },

            setTab: function(evt) {
                var tabs = ["missionsTab", "eventsTab", "controlMeasuresTab"];
                for (var i = 0; i < tabs.length; i++) {
                    if (evt.target.id === tabs[i]) {
                        domClass.add(evt.target, "active");
                        this.initEditor(i);
                    } else {
                        domClass.remove(dom.byId(tabs[i]), "active");
                    }

                }
            },

            disableWebMapPopup:function(){
                if(this.map && this.map.webMapResponse){
                    var handler = this.map.webMapResponse.clickEventHandle;
                    if(handler){
                        handler.remove();
                        this.map.webMapResponse.clickEventHandle = null;
                    }
                }
            },

            enableWebMapPopup:function(){
                if(this.map && this.map.webMapResponse){
                    var handler = this.map.webMapResponse.clickEventHandle;
                    var listener = this.map.webMapResponse.clickEventListener;
                    if(listener && !handler){
                        this.map.webMapResponse.clickEventHandle = on(this.map,'click',lang.hitch(this.map,listener));
                    }
                }
            },

            getLayerFromMap: function(url) {
                var ids = this.map.graphicsLayerIds;
                var len = ids.length;
                for (var i = 0; i < len; i++) {
                    var layer = this.map.getLayer(ids[i]);
                    if (layer.url === url) {
                        return layer;
                    }
                }
                return null;
            },

            getLayers:function(){
                var layerInfos = this.config.editor.layerInfos;
                for (var i = 0; i < layerInfos.length; i++) {
                    var featureLayer = layerInfos[i].featureLayer;
                    var layer = this.getLayerFromMap(featureLayer.url);
                    if (!layer) {
                        if(!layerInfos[i].featureLayer.options){
                            layerInfos[i].featureLayer.options = {};
                        }
                        if(!layerInfos[i].featureLayer.options.outFields){
                            if(layerInfos[i].fieldInfos){
                                layerInfos[i].featureLayer.options.outFields = [];
                                for(var j=0;j<layerInfos[i].fieldInfos.length;j++){
                                    layerInfos[i].featureLayer.options.outFields.push(layerInfos[i].fieldInfos[j].fieldName);
                                }
                            }else{
                                layerInfos[i].featureLayer.options.outFields = ["*"];
                            }
                        }
                        layer = new FeatureLayer(featureLayer.url, featureLayer.options);
                        this.map.addLayer(layer);
                    }
                    if (layer.visible) {
                        layerInfos[i].featureLayer = layer;
                        this.layers.push(layerInfos[i]);
                    }
                }
            },

            initEditor: function(layerIdx) {
                if (this.editor) {
                    this.editor.destroy();
                    this.editor = null;
                    this.editDiv = html.create("div", {
                        style: {
                            width: "100%",
                            height: "100%"
                        }
                    });
                    html.place(this.editDiv, this.domNode);
                }

                var json = this.config.editor;
                var settings = {};
                for (var attr in json) {
                    settings[attr] = json[attr];
                }
                settings.layerInfos = [this.layers[layerIdx]];
                settings.map = this.map;

                var params = {
                    settings: settings
                };

                if(!this.editDiv){
                    this.editDiv = html.create("div", {
                        style: {
                            width: "100%",
                            height: "100%"
                        }
                    });
                    html.place(this.editDiv, this.domNode);
                }
                var height = html.getStyle(this.editDiv, "height");

                var styleNode = html.toDom("<style>.jimu-widget-edit .grid{height: " + (height - 100) + "px;}</style>");
                html.place(styleNode, document.body);

                this.editor = new Editor(params, this.editDiv);
                this.editor.startup();
            },

            onClose: function() {
                this.enableWebMapPopup();
                if(this.editor){
                    this.editor.destroy();
                }
                this.layers = [];
                this.editor = null;
                this.editDiv = html.create("div", {
                    style: {
                        width: "100%",
                        height: "100%"
                    }
                });
                html.place(this.editDiv, this.domNode);
            }

        });
    });