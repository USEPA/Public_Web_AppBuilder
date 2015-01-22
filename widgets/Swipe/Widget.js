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
    'dojo/on',
    'dojo/dom',
    'dojo/query',
    'dojo/dom-style',
    'dojo/_base/array',
    'dojo/store/Memory',
    'dojo/dom-construct',

    'esri/arcgis/utils',

    'jimu/BaseWidget',
    'jimu/LayerInfos/LayerInfos',

    'dijit/form/Select',
    'dijit/_WidgetsInTemplateMixin',

    './js/LayerSwipe'
],
    function(declare, lang, on, dom, query, domStyle, array, Memory, domConstruct, arcgisUtils, BaseWidget, LayerInfos, Select, _WidgetsInTemplateMixin, LayerSwipe) {
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            name: 'Swipe',
            baseClass: "jimu-widget-swipe",
            swipeWidget: null,

            postCreate: function() {
                this.inherited(arguments);

                this.activeTool.addOption(this.getToolStore());
                this.own(on(this.activeTool, "change", lang.hitch(this, this.onToolChange)));

                this.layerSelect.addOption(this.getMapStore());
                this.own(on(this.layerSelect, "change", lang.hitch(this, this.onLayerChange)));
            },

            onToolChange: function(value) {
                if (this.swipeWidget) {
                    if (this.activeTool.attr('value') == "vertical")
                        this.swipeWidget.set("type", "vertical");
                    else if (this.activeTool.attr('value') == "horizontal")
                        this.swipeWidget.set("type", "horizontal");
                    else
                        this.swipeWidget.set("type", "scope");
                }
            },

            onLayerChange: function(value) {
                this.destroySwipeWidget();
                this.initSwipeWidget();
            },

            onOpen: function(evt) {
                this.destroySwipeWidget();
                this.initSwipeWidget();
            },

            onClose: function(evt) {
                this.destroySwipeWidget();
            },

            createLayerSwipeDiv: function() {
                var layerSwipeDiv = query("#LayerSwipe");
                if (layerSwipeDiv.length == 0) {
                    var mapDom = dom.byId(this.map.id);
                    var layerSwipeDiv = domConstruct.create("div", {id: "LayerSwipe"}, this.map.id, "first");
                }
            },

            getToolStore: function() {
                var toolOptions = [
                    {label: "Vertical Swipe", value: "vertical"},
                    {label: "Horizontal Swipe", value: "horizontal"},
                    {label: "Scope", value: "scope"}
                ];
                return toolOptions;
            },

            getMapStore: function() {
                var mapStore = [];
                LayerInfos.getInstance(this.map, this.map.itemInfo).then(lang.hitch(this, function(operLayerInfos) {
                    array.forEach(operLayerInfos.layerInfos, lang.hitch(this, function(layerInfo) {
                        var obj = {
                            label: layerInfo.title,
                            value: layerInfo.id
                        };
                        mapStore.push(obj);
                    }))//foreach
                }));
                return mapStore;
            },

            destroySwipeWidget: function() {
                if (this.swipeWidget) {
                    this.swipeWidget.destroy();
                    this.swipeWidget = null;
                }
            },

            initSwipeWidget: function(val) {
                var selectedLayerId = null;
                if (val) {
                    selectedLayerId = val;
                } else {
                    selectedLayerId = this.layerSelect.get("value");
                }
                this.createLayerSwipeDiv();
                var displayedValue = this.layerSelect.get("displayedValue");
                if (selectedLayerId && displayedValue) {
                    var layerSwipeDiv = query("#LayerSwipe");
                    var layer = this.map.getLayer(selectedLayerId);
                    if ((layer) && (layerSwipeDiv.length == 1)) {
                        if (layer.visible) {
                            layer.setVisibility(true);
                        }

                        this.swipeWidget = new LayerSwipe({
                            type: this.activeTool.attr('value'),
                            map: this.map,
                            layers: [layer]
                        }, layerSwipeDiv[0].id);
                        this.swipeWidget.startup();
                    }
                }
            }
        });
    });