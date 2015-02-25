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
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/dijit/TabContainer',
    './List',
    'jimu/utils',
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/tasks/Geoprocessor",
    "esri/tasks/FeatureSet",
    "esri/tasks/BufferParameters",
    "esri/layers/GraphicsLayer",
    "esri/graphic",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/geometry/Polyline",
    "esri/symbols/SimpleLineSymbol",
    "esri/geometry/Polygon",
    "esri/symbols/SimpleFillSymbol",
    "esri/toolbars/draw",
    "esri/InfoTemplate",
    "esri/request",
    "esri/graphicsUtils",
    "esri/geometry/webMercatorUtils",
    "esri/dijit/Geocoder",
    "esri/SpatialReference",
    "esri/tasks/GeometryService",
    "esri/config",
    "dojo/_base/Color",
    "dijit/registry",
    "dijit/Dialog",
    "dijit/ProgressBar",
    "dijit/form/NumberSpinner",
    'dojo/_base/lang',
    'dojo/on',
    'dojo/dom',
    "dojo/dom-style",
    "dijit/form/Select",
    "dijit/form/TextBox",
    "esri/geometry/jsonUtils",
    "dojox/charting/Chart", "dojox/charting/axis2d/Default", "dojox/charting/plot2d/Lines", "dojox/charting/plot2d/Bars", "dojox/charting/plot2d/Pie",
    "dojox/charting/plot2d/Columns", "dojox/charting/action2d/Tooltip", "dojo/fx/easing", "dojox/charting/action2d/MouseIndicator", "dojox/charting/action2d/Highlight",
    "dojox/charting/action2d/MoveSlice", "dojox/charting/themes/MiamiNice", "dojox/charting/action2d/Magnify",
    'dojo/_base/array',
    'dojo/_base/html',
    "esri/tasks/RelationParameters",
    "esri/layers/FeatureLayer",
    'jimu/dijit/DrawBox',
    'dojo/query',
    'dojo/dom-construct',
    './FacilitiesPane'
],
    function (declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, List, utils, Query, QueryTask, Geoprocessor,
              FeatureSet, BufferParameters, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, PictureMarkerSymbol,
              Polyline, SimpleLineSymbol, Polygon, SimpleFillSymbol, Draw, InfoTemplate, esriRequest, graphicsUtils,
              webMercatorUtils, Geocoder, SpatialReference, GeometryService, esriConfig, Color, registry, Dialog,
              ProgressBar, NumberSpinner, lang, on, dom, domStyle, Select, TextBox, jsonUtils, Chart, Default, Lines,
              Bars, Pie, Columns, Tooltip, easing, MouseIndicator, Highlight, MoveSlice, MiamiNice, Magnify, array,
              html, RelationParameters, FeatureLayer, DrawBox, query, domConstruct, FacilitiesPane) {
        /**
         * The Bomb Threat widget allows a user to add a bomb type to the map
         * @type {*}
         * @module widgets/BombThreat
         */
        var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
            // DemoWidget code goes here

            //please note that this property is be set by the framework when widget is loaded.
            //templateString: template,

            baseClass: 'jimu-widget-bombThreat',
            name: 'BombThreat',
            selectedBombType: null,
            bombLocationGraphicsLayer: null,
            addressLocationLayer: null,
            bufferGraphicsLayer: null,
            facilitiesGraphicsLayer: null,
            chartLayer: null,
            charts: [],
            currentChartIndex: -1,

            startup: function () {
                this.inherited(arguments);
//                var geocoder = registry.byId("geocoderWidget");
//                this.own(on(geocoder, "find-results", lang.hitch(this, this.onAddressReturned)));
                console.log('startup');

                this.tabContainer = new TabContainer({
                    tabs: [
                        {
                            title: this.nls.tabBombThreat,
                            content: this.tabNode1
                        },
                        {
                            title: this.nls.tabDemo,
                            content: this.tabNode2
                        },
                        {
                            title: this.nls.tabFacilities,
                            content: this.tabNode3
                        }
                    ],
                    selected: this.nls.tabBombThreat
                }, this.tabBT);
                this.tabContainer.startup();
                utils.setVerticalCenter(this.tabContainer.domNode);

                this.own(on(esriConfig.defaults.geometryService, "buffer-complete",
                    lang.hitch(this, this.geometryServiceBufferComplete)));
                this.own(on(esriConfig.defaults.geometryService, "error",
                    lang.hitch(this, this.geometryServiceOnError)));

                //Bomb Types
                var option = [];
                option[0] = {};
                option[0].label = "Pipe bomb";
                option[0].value = "Pipe bomb";

                option[1] = {};
                option[1].label = "Suicide vest";
                option[1].value = "Suicide vest";

                option[2] = {};
                option[2].label = "Briefcase/suitcase bomb";
                option[2].value = "Briefcase/suitcase bomb";

                option[3] = {};
                option[3].label = "Sedan";
                option[3].value = "Sedan";

                option[4] = {};
                option[4].label = "SUV/van";
                option[4].value = "SUV/van";

                option[5] = {};
                option[5].label = "Small delivery truck";
                option[5].value = "Small delivery truck";

                option[6] = {};
                option[6].label = "Container/water truck";
                option[6].value = "Container/water truck";

                option[7] = {};
                option[7].label = "Semi-trailer";
                option[7].value = "Semi-trailer";

                this.bombType.addOption(option);
                //SELECT MENU Change events wiring...
                this.own(on(this.bombType, "change", lang.hitch(this, this.onChangeBombType)));

                this.selectedBombType = "Pipe bomb"

                //buffer coverage layer
                this.bufferGraphicsLayer = new GraphicsLayer();
                this.map.addLayer(this.bufferGraphicsLayer);
                this.own(on(this.bufferGraphicsLayer, "mouse-over",
                    lang.hitch(this, this.bombLocationGraphicsLayerMouseOver)));
                this.own(on(this.bufferGraphicsLayer, "mouse-out",
                    lang.hitch(this, this.bombLocationGraphicsLayerMouseOut)));

                //spill location graphics layer
                this.bombLocationGraphicsLayer = new GraphicsLayer();
                this.map.addLayer(this.bombLocationGraphicsLayer);
                this.own(on(this.bombLocationGraphicsLayer, "mouse-over",
                    lang.hitch(this, this.bombLocationGraphicsLayerMouseOver)));
                this.own(on(this.bombLocationGraphicsLayer, "mouse-out",
                    lang.hitch(this, this.bombLocationGraphicsLayerMouseOut)));

                // this.addressLocationLayer = new GraphicsLayer();
                // this.map.addLayer(this.addressLocationLayer);

                //affected layers
                // this.facilitiesGraphicsLayer = new GraphicsLayer();
                // this.map.addLayer(this.facilitiesGraphicsLayer);
                // this.own(on(this.facilitiesGraphicsLayer, "click", lang.hitch(this, this.facilitiesGraphicsLayerClick)));

                this.drawToolbar = new Draw(this.map);
                this.own(on(this.drawToolbar, "draw-end", lang.hitch(this, this.addBombLocation)));
                this.own(on(this.drawSpillInfo, "click", lang.hitch(this, this.bindDrawToolbar)));
            },

            // CLEAR THE MAP
            onClearBtnClicked: function () {
                this.bombLocationGraphicsLayer.clear();
                //this.addressLocationLayer.clear();
                this.bufferGraphicsLayer.clear();
                // this.facilitiesGraphicsLayer.clear();
                this.chartLayer.clear();
                this.facilitiesGraphicsLayer.clear();
                this._clearCharts();
                html.empty(this.facilitiesListSection);
            },

            // ADD BOMB LOCATION
            addBombLocation: function (evt) {
                //deactivate the toolbar and clear existing graphics
                this.drawToolbar.deactivate();
                this.map.enableMapNavigation();

                //point symbol
                var symbol = new SimpleMarkerSymbol(this.config.bombThreat.symbols.simplemarkersymbol);
                //var symbol = new PictureMarkerSymbol(this.config.bombThreat.symbols.picturemarkersymbol)

                var attr = {"Evac": this.selectedBombType};
                var infoTemplate = new InfoTemplate("Evacuation", "Bomb Type: ${Evac}");
                var graphic = new Graphic(evt.geometry, symbol, attr, infoTemplate);
                this.bombLocationGraphicsLayer.add(graphic);
            },

            bindDrawToolbar: function (evt) {
                if (evt.target.id === "drawSpillInfo") {
                    return;
                }
                var tool = evt.target.id.toLowerCase();
                this.map.disableMapNavigation();
                this.bombLocationGraphicsLayer.clear();
                //this.addressLocationLayer.clear();
                this.drawToolbar.activate(tool);
            },

            // BUFFER THE BOMB LOCATION BASED ON THE SELECTED BOMB TYPE
            onSolve: function (evt) {
                var BuildingEvacDistance = 0;
                var OutdoorEvacDistance = 0;
                var bufferGeometry = null;

                var bufferParams = new BufferParameters();
                bufferParams.unit = GeometryService.UNIT_FOOT;
                bufferParams.outSpatialReference = this.map.spatialReference;
                bufferParams.bufferSpatialReference = new SpatialReference({wkid: 102004});
                //bufferParams.geodesic = true;

                if (this.selectedBombType === "Pipe bomb") {
                    BuildingEvacDistance = 70;
                    OutdoorEvacDistance = 1200;
                }
                else if (this.selectedBombType === "Suicide vest") {
                    BuildingEvacDistance = 110;
                    OutdoorEvacDistance = 1750;
                }
                else if (this.selectedBombType === "Briefcase/suitcase bomb") {
                    BuildingEvacDistance = 150;
                    OutdoorEvacDistance = 1850;
                }
                else if (this.selectedBombType === "Sedan") {
                    BuildingEvacDistance = 320;
                    OutdoorEvacDistance = 1900;
                }
                else if (this.selectedBombType === "SUV/van") {
                    BuildingEvacDistance = 400;
                    OutdoorEvacDistance = 2400;
                }
                else if (this.selectedBombType === "Small delivery truck") {
                    BuildingEvacDistance = 640;
                    OutdoorEvacDistance = 3800;
                }
                else if (this.selectedBombType === "Container/water truck") {
                    BuildingEvacDistance = 860;
                    OutdoorEvacDistance = 5100;
                }
                else if (this.selectedBombType === "Semi-trailer") {
                    BuildingEvacDistance = 1570;
                    OutdoorEvacDistance = 9300;
                }
                if (BuildingEvacDistance == 0 || OutdoorEvacDistance == 0)
                    return;

                if (this.bombLocationGraphicsLayer.graphics.length > 0) {
                    console.log(this.bombLocationGraphicsLayer.graphics.length)
                    bufferGeometry = this.bombLocationGraphicsLayer.graphics[0].geometry;
                    bufferParams.geometries = [bufferGeometry];
                }
                // else if(this.addressLocationLayer.graphics.length >0){
                //   console.log(this.addressLocationLayer.graphics.length)
                //   bufferGeometry = this.addressLocationLayer.graphics[0].geometry;
                //   bufferParams.geometries = [bufferGeometry];
                // }

                bufferParams.distances = [BuildingEvacDistance, OutdoorEvacDistance];
                esriConfig.defaults.geometryService.buffer(bufferParams);
            },

            //wigdget control events
            onChangeBombType: function (newValue) {
                this.selectedBombType = newValue;
            },

            // BOMB BUFFER IS RETURNED
            geometryServiceBufferComplete: function (results) {
                console.log(results);
                this.bufferGraphicsLayer.clear();

                var insideSymbol = new SimpleFillSymbol(this.config.bombThreat.symbols.insideFillSymbol);
                var insideAttr = {"Evac": "Mandatory Evacuation Distance"};
                var infoTemplate = new InfoTemplate("Evacuation Zone", "Zone: ${Evac}");
                var insideGraphic = new Graphic(results.geometries[0], insideSymbol, insideAttr, infoTemplate);

                var outsideSymbol = new SimpleFillSymbol(this.config.bombThreat.symbols.outsideFillSymbol);
                var outsideAttr = {"Evac": "Shelter-in-Place Zone"};
                var outInfoTemplate = new InfoTemplate("Evacuation Zone", "Zone: ${Evac}");
                var outsideGraphic = new Graphic(results.geometries[1], outsideSymbol, outsideAttr, outInfoTemplate);

                this.bufferGraphicsLayer.add(outsideGraphic);
                this.bufferGraphicsLayer.add(insideGraphic);

                this.map.setExtent(outsideGraphic.geometry.getExtent(), true);

                var data = {};
                data.layerInfo = this.config.bombThreat.demographicLayer;
                data.geometry = outsideGraphic.geometry;
                this.publishData(data);

                this._doQuery(outsideGraphic.geometry);
                this._doFacilitiesQuery(outsideGraphic.geometry)
            },

            geometryServiceOnError: function (evt) {
                console.log(evt);
            },

            //WHEN USER LOCATES AN ADDRESS ON THE MAP
            onAddressReturned: function (results) {
                this.bombLocationGraphicsLayer.clear();
                var address = results.results.results[0];
                var symbol = new PictureMarkerSymbol(this.config.bombThreat.symbols.picturemarkersymbol)

                var attr = {"Evac": this.selectedBombType};
                var infoTemplate = new InfoTemplate("Evacuation", "Bomb Type: ${Evac}");
                var graphic = new Graphic(address.feature.geometry, symbol, attr, infoTemplate);
                //this.addressLocationLayer.add(graphic);
                this.bombLocationGraphicsLayer.add(graphic);
            },

            postCreate: function () {
                this.inherited(arguments);
                console.log('postCreate');
                this._initChartLayer();
                this._initFacilitiesLayer();
                this._initResultsTab();
            },

            bombLocationGraphicsLayerMouseOver: function (evt) {
                console.log('mouse over');

                this.map.infoWindow.setContent(evt.graphic.getContent());
                this.map.infoWindow.setTitle(evt.graphic.getTitle());
                this.map.infoWindow.show(evt.screenPoint, this.map.getInfoWindowAnchor(evt.screenPoint));
            },

            bombLocationGraphicsLayerMouseOut: function (evt) {
                this.map.infoWindow.hide();
            },

            facilitiesGraphicsLayerClick: function (evt) {
                console.log(evt);
                var graphic = evt.graphic;
            },

            onOpen: function () {
                console.log('onOpen');
            },

            onClose: function () {
                console.log('onClose');
            },

            onMinimize: function () {
                console.log('onMinimize');
            },

            onMaximize: function () {
                console.log('onMaximize');
            },

            onSignIn: function (credential) {
                /* jshint unused:false*/
                console.log('onSignIn');
            },

            onSignOut: function () {
                console.log('onSignOut');
            },

            destroy: function () {
                if (this.chartLayer) {
                    this.map.removeLayer(this.chartLayer);
                    this.chartLayer = null;
                }

                if (this.facilitiesGraphicsLayer) {
                    this.map.removeLayer(this.facilitiesGraphicsLayer);
                    this.facilitiesGraphicsLayer = null;
                }
            },

            _doFacilitiesQuery: function(geometry) {
                try {
                    html.setStyle(this.facilitiesListSection, 'display', 'none');
                    if (this.config.bombThreat.infrastructureLayer.url) {
                        this._doFacilitiesQueryByUrl(this.config.bombThreat.infrastructureLayer, geometry);
                    } else {
                        this._onQueryError("Infrastructure layer was defined incorrectly.")
                    }
                } catch (err) {
                    console.log(err.message);
                }
            },

            _doFacilitiesQueryByUrl: function(layerInfo, geometry) {
                var queryTask = new QueryTask(layerInfo.url);
                var q = new Query();
                q.returnGeometry = true;
                q.outFields = layerInfo.fields;
                q.geometry = geometry;
                queryTask.execute(q);
                this.own(on(queryTask, 'complete', lang.hitch(this, this._onFacilitiesQueryComplete)));
                this.own(on(queryTask, 'error', lang.hitch(this, this._onFacilitiesQueryError)));
            },

            _onFacilitiesQueryComplete: function(response) {
                var features = response.featureSet.features;
                if (features.length > 0) {
                    html.empty(this.facilitiesListSection);
                    var parentHeight = domStyle.get(this.domNode.parentNode.parentNode, "height");
                    var listContainer = domConstruct.place("<div></div>", this.facilitiesListSection);
                    var fp = new FacilitiesPane({
                        resultsList: features,
                        frameHeight: parentHeight,
                        gLayer: this.facilitiesGraphicsLayer
                    }, listContainer);
                    html.setStyle(this.facilitiesListSection, 'display', 'block');

                    this.facilitiesGraphicsLayer.clear();
                    for (var i = 0; i < features.length; i++) {
                        var f = features[i];
                        this._setFeatureSymbol(f);
                        this.facilitiesGraphicsLayer.add(f);
                    }
                }
            },

            _onFacilitiesQueryError: function (error) {
                console.error("Facilities list query failed", error);
                this._showError("Error");
            },

            _initChartLayer:function(){
                this.chartLayer = new GraphicsLayer();
                this.map.addLayer(this.chartLayer);
            },

            _initFacilitiesLayer: function() {
                this.facilitiesGraphicsLayer = new GraphicsLayer();
                this.map.addLayer(this.facilitiesGraphicsLayer);
            },

            _initResultsTab:function(){
                this.own(on(this.pagingUl,'click',lang.hitch(this,function(event){
                    var target = event.target||event.srcElement;
                    var tagName = target.tagName.toLowerCase();
                    if(tagName === 'a'){
                        var as = query('a',this.pagingUl);
                        var index = array.indexOf(as,target);
                        if(index >= 0){
                            this._showChart(index);
                        }
                    }
                })));

                this.own(on(this.leftArrow,'click',lang.hitch(this,function(){
                    var index = (this.currentChartIndex - 1 + this.charts.length)%this.charts.length;
                    if(index >= 0){
                        this._showChart(index);
                    }
                })));

                this.own(on(this.rightArrow,'click',lang.hitch(this,function(){
                    var index = (this.currentChartIndex + 1 + this.charts.length)%this.charts.length;
                    if(index >= 0){
                        this._showChart(index);
                    }
                })));
            },

            _doQuery: function (geometry) {
                try {
                    //Change to results tab
                    this.tabContainer.selectTab(this.nls.tabDemo);
                    html.setStyle(this.progressBar.domNode, 'display', 'block');
                    html.setStyle(this.resultsSection, 'display', 'none');
                    html.setStyle(this.noresultsSection, 'display', 'none');

                    if (this.config.bombThreat.demographicLayer.url) {
                        this._doQueryByUrl(this.config.bombThreat.demographicLayer, geometry);
                    } else {
                        this._onQueryError("Demographic layer was defined incorrectly");
                    }
                } catch (err) {
                    console.log(err.message);
                }
            },

            _doQueryByUrl: function (layerInfo, geometry) {
                var queryTask = new QueryTask(layerInfo.url);
                var q = new Query();
                q.returnGeometry = true;
                q.outFields = layerInfo.fields;
                q.geometry = geometry;
                queryTask.execute(q);
                this.own(on(queryTask, 'complete', lang.hitch(this, this._onQueryComplete)));
                this.own(on(queryTask, 'error', lang.hitch(this, this._onQueryError)));
            },

            _onQueryComplete: function (response) {
                var featureSet = response.featureSet;
                var features = featureSet.features;
                this._displayResult(features);
            },

            _onQueryError: function (error) {
                html.setStyle(this.progressBar.domNode, 'display', 'none');
                this._clear();
                console.error("ChartWidget query failed", error);
                this._showError("Error");
                html.setStyle(this.resultsSection, 'display', 'none');
                html.setStyle(this.noresultsSection, 'display', 'block');
            },

            _displayResult: function (features) {
                this.progressBar.domNode.style.display = 'none';
                //html.setStyle(this.progressBar.domNode,'display','none');
                this._clear();
                var length = features.length;
                if (length > 0) {
                    html.setStyle(this.resultsSection, 'display', 'block');
                    html.setStyle(this.noresultsSection, 'display', 'none');
                    for (var i = 0; i < length; i++) {
                        var f = features[i];
                        this._setFeatureSymbol(f);
                        this.chartLayer.add(f);
                    }
                    this._createCharts(features);
                } else {
                    html.setStyle(this.resultsSection, 'display', 'none');
                    html.setStyle(this.noresultsSection, 'display', 'block');
                }
            },

            _setFeatureSymbol: function (f) {
                switch (f.geometry.type) {
                    case 'extent':
                    case 'polygon':
                        f.setSymbol(this._getFillSymbol());
                        break;
                    case 'polyline':
                        f.setSymbol(this._getLineSymbol());
                        break;
                    default:
                        f.setSymbol(this._getMarkerSymbol());
                        break;
                }
            },

            _getHighLightColor:function(){
                var color = new Color('#f5f50e');
                if(this.config && this.config.bombThreat.highLightColor){
                    color = new Color(this.config.bombThreat.highLightColor);
                }
                return color;
            },

            _getMarkerSymbol: function () {
                var style = SimpleMarkerSymbol.STYLE_CIRCLE;
                var size = 15;
                var color = new Color("#FF0000");
                color.a = 1;

                var outlineSymbol = new SimpleLineSymbol();
                var outlineColor = new Color("#000000");
                var outlineWidth = 0;
                outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
                outlineSymbol.setColor(outlineColor);
                outlineSymbol.setWidth(outlineWidth);

                var symbol = new SimpleMarkerSymbol(style, size, outlineSymbol, color);
                return symbol;
            },

            _getHightLightMarkerSymbol: function () {
                var style = SimpleMarkerSymbol.STYLE_CIRCLE;
                var size = 15;
                var color = new Color("#3fafdc");
                color.a = 1;

                var outlineSymbol = new SimpleLineSymbol();
                var outlineColor = this._getHighLightColor();
                var outlineWidth = 3;
                outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
                outlineSymbol.setColor(outlineColor);
                outlineSymbol.setWidth(outlineWidth);

                var symbol = new SimpleMarkerSymbol(style, size, outlineSymbol, color);
                return symbol;
            },

            _getLineSymbol: function () {
                var symbol = new SimpleLineSymbol();
                var style = SimpleLineSymbol.STYLE_SOLID;
                var color = new Color("#3fafdc");
                color.a = 1;
                var width = 5;
                symbol.setStyle(style);
                symbol.setColor(color);
                symbol.setWidth(width);
                return symbol;
            },

            _getHightLightLineSymbol: function () {
                var symbol = new SimpleLineSymbol();
                var style = SimpleLineSymbol.STYLE_SOLID;
                var color = this._getHighLightColor();
                color.a = 1;
                var width = 7;
                symbol.setStyle(style);
                symbol.setColor(color);
                symbol.setWidth(width);
                return symbol;
            },

            _getFillSymbol: function () {
                var style = SimpleFillSymbol.STYLE_SOLID;
                var color = new Color('#3fafdc');
                color.a = 0.5;
                var outlineSymbol = new SimpleLineSymbol();
                var outlineColor = new Color('#000000');
                var outlineWidth = 1;
                outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
                outlineSymbol.setColor(outlineColor);
                outlineSymbol.setWidth(outlineWidth);
                var symbol = new SimpleFillSymbol(style, outlineSymbol, color);
                return symbol;
            },

            _getHightLightFillSymbol: function () {
                var style = SimpleFillSymbol.STYLE_SOLID;
                var color = new Color('#3fafdc');
                color.a = 0.5;
                var outlineSymbol = new SimpleLineSymbol();
                var outlineColor = this._getHighLightColor();
                var outlineWidth = 3;
                outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
                outlineSymbol.setColor(outlineColor);
                outlineSymbol.setWidth(outlineWidth);
                var symbol = new SimpleFillSymbol(style, outlineSymbol, color);
                return symbol;
            },

            _clear: function () {
                this._clearCharts();
            },

            _clearCharts: function () {
                try {
                    this.chartTitle.innerHTML = "";
                    this.currentChartIndex = -1;
                    var chartDivs = query('.chart-div',this.chartContainer);
                    chartDivs.style({display:'none'});
                    var lis = query("li",this.pagingUl);
                    if (lis.className != '')
                        lis.className = ''; //lis.removeClass('selected');

                    if (this.charts.length > 0) {
                        for (var i = 0; i < this.charts.length; i++) {
                            var chart = this.charts[i];
                            if (chart) {
                                chart.destroy();
                            }
                        }
                    }
                    this.charts = [];
                    html.empty(this.pagingUl);
                    html.empty(this.chartContainer);
                    html.setStyle(this.resultsSection, 'display', 'none');
                    html.setStyle(this.noresultsSection, 'display', 'block');
                } catch (err) {
                    console.log(err.message);
                }
            },

            _setHightLightSymbol:function(g){
                switch(g.geometry.type){
                    case 'extent':
                    case 'polygon':
                        g.setSymbol(this._getHightLightFillSymbol());
                        break;
                    case 'polyline':
                        g.setSymbol(this._getHightLightLineSymbol());
                        break;
                    default:
                        g.setSymbol(this._getHightLightMarkerSymbol());
                        break;
                }
            },

            _showChart:function(index){
                this.chartTitle.innerHTML = "";
                this.currentChartIndex = -1;
                var chartDivs = query('.chart-div',this.chartContainer);
                chartDivs.style({display:'none'});
                var lis = query("li",this.pagingUl);
                lis.removeClass('selected');
                if(index < 0){
                    return;
                }

                var chartDiv = chartDivs[index];
                if(chartDiv){
                    this.currentChartIndex = index;
                    html.setStyle(chartDiv,{display:'block'});
                }
                var chart = this.charts[index];
                if(chart&&chart.media){
                    this.chartTitle.innerHTML = chart.media.title;
                    this.description.innerHTML = chart.media.description||"";
                }
                var li = lis[index];
                if(li){
                    html.addClass(li,'selected');
                }
            },

            _createCharts: function (features) {
                try {
                    this._clearCharts();
                    html.setStyle(this.resultsSection, 'display', 'block');
                    html.setStyle(this.noresultsSection, 'display', 'none');
                    //this.tabContainer.selectTab(this.nls.tabDemo);
                    var layerInfo = this.config.bombThreat.demographicLayer;
                    var medias = layerInfo.medias;
                    var labelField = layerInfo.labelField;
                    var box = html.getMarginBox(this.chartContainer);
                    var w = box.w+"px";
                    var h = box.h+"px";

                    var i, chart;
                    for (i = 0; i < medias.length; i++) {
                        chart = null;
                        var media = medias[i];
                        var type = media.type.toLowerCase();
                        var chartDiv = html.create('div', {'class': 'chart-div', style: {width: w, height: h}}, this.chartContainer);
                        if (type === 'barschart') {
                            chart = this._createBarsChart(chartDiv, media, features, labelField);
                        }
                        else if (type === 'columnschart') {
                            chart = this._createColumnsChart(chartDiv, media, features, labelField);
                        }
                        else if (type === 'linechart') {
                            chart = this._createLineChart(chartDiv, media, features, labelField);
                        }
                        else if (type === 'piechart') {
                            chart = this._createPieChart(chartDiv, media, features, labelField);
                        }

                        if (chart) {
                            chart.media = media;
                            this.charts.push(chart);
                            html.setStyle(chartDiv, 'display', 'none');
                        }
                        else {
                            html.destroy(chartDiv);
                        }
                    }

                    var chartCount = this.charts.length;
                    for (i = 0; i < chartCount; i++) {
                        var strLi = "<li><a></a></li>";
                        var domLi = html.toDom(strLi);
                        html.place(domLi, this.pagingUl);
                    }

                    this._showChart(0);
                } catch (err) {
                    console.log(err.message);
                }
            },

            _createBarsChart: function (chartNode, media, features, labelField) {
                var series = [];

                //init series
                for (var i = 0; i < features.length; i++) {
                    var attributes = features[i].attributes;
                    var name = attributes[labelField];
                    var num = attributes[media.chartField];
                    var ele = {
                        y: num,
                        tooltip: "<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>" + name + "</span><br/><span>" + num + "</span></div>"
                    };
                    series.push(ele);
                }

                //construct chart
                var barsChart = new Chart(chartNode);

                barsChart.addPlot('default', {
                    type: Bars,
                    animate: {
                        duration: 2000,
                        easing: easing.bounceInOut
                    },
                    enableCache: true,
                    markers: true,
                    minBarSize: 3,
                    maxBarSize: 20
                });

                barsChart.addAxis('x', {
                    vertical: true
                });

                barsChart.addAxis('y', {
                    type: Default,
                    fixLower: "minor",
                    fixUpper: "minor"
                });

                barsChart.addSeries(media.title, series, {
                    stroke: {
                        color: "#FFFFFF"
                    },
                    fill: "#1f77b4"
                });

                new MoveSlice(barsChart, "default");
                new Highlight(barsChart, "default");
                new Tooltip(barsChart, "default");

                barsChart.connectToPlot('default', lang.hitch(this, function (evt) {
                    var g = this.chartLayer.graphics[evt.index];
                    if (evt.type === 'onmouseover') {
                        this._setHightLightSymbol(g);
                    }
                    else if (evt.type === 'onmouseout') {
                        this._setFeatureSymbol(g);
                    }
                }));
                barsChart.render();

                return barsChart;
            },

            _createColumnsChart: function (chartNode, media, features, labelField) {
                var series = [];

                //collect series
                for (var i = 0; i < features.length; i++) {
                    var attributes = features[i].attributes;
                    var name = attributes[labelField];
                    var num = attributes[media.chartField];
                    var ele = {
                        y: num,
                        tooltip: "<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>" + name + "</span><br/><span>" + num + "</span></div>"
                    };
                    series.push(ele);
                }

                //construct chart
                var columnsChart = new Chart(chartNode);

                columnsChart.addPlot('default', {
                    type: Columns,
                    animate: {
                        duration: 2000,
                        easing: easing.bounceInOut
                    },
                    enableCache: true,
                    markers: true
                });

                columnsChart.addAxis('x', {
                    type: Default
                });

                columnsChart.addAxis('y', {
                    vertical: true,
                    fixLower: "minor",
                    fixUpper: "major",
                    min: 0
                });

                columnsChart.addSeries(media.title, series, {
                    stroke: {
                        color: "#FFFFFF"
                    },
                    fill: "#1f77b4"
                });

                new MoveSlice(columnsChart, "default");
                new Highlight(columnsChart, "default");
                new Tooltip(columnsChart, "default");

                columnsChart.connectToPlot('default', lang.hitch(this, function (evt) {
                    var g = this.chartLayer.graphics[evt.index];
                    if (evt.type === 'onmouseover') {
                        this._setHightLightSymbol(g);
                    }
                    else if (evt.type === 'onmouseout') {
                        this._setFeatureSymbol(g);
                    }
                }));

                columnsChart.render();

                return columnsChart;
            },

            _createLineChart: function (chartNode, media, features, labelField) {
                var series = [];

                //init series
                for (var i = 0; i < features.length; i++) {
                    var attributes = features[i].attributes;
                    var name = attributes[labelField];
                    var num = attributes[media.chartField];
                    var ele = {
                        y: num,
                        tooltip: "<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>" + name + "</span><br/><span>" + num + "</span></div>"
                    };
                    series.push(ele);
                }

                //construct chart
                var lineChart = new Chart(chartNode);

                lineChart.addPlot('default', {
                    type: Lines,
                    animate: {
                        duration: 2000,
                        easing: easing.cubicIn
                    },
                    markers: true,
                    tension: "S"
                });

                lineChart.addAxis('x', {
                    type: Default
                });

                lineChart.addAxis('y', {
                    vertical: true,
                    fixUpper: "minor",
                    fixLower: "minor"
                });

                lineChart.addSeries(media.title, series, {
                    stroke: {
                        color: "#FF7F0E"
                    },
                    fill: "#FF7F0E"
                });

                new Magnify(lineChart, "default");
                new Highlight(lineChart, "default");
                new Tooltip(lineChart, "default");

                lineChart.connectToPlot('default', lang.hitch(this, function (evt) {
                    var g = this.chartLayer.graphics[evt.index];
                    if (evt.type === 'onmouseover') {
                        this._setHightLightSymbol(g);
                    }
                    else if (evt.type === 'onmouseout') {
                        this._setFeatureSymbol(g);
                    }
                }));

                lineChart.render();

                return lineChart;
            },

            _createPieChart: function (chartNode, media, features, labelField) {
                var series = [];
                var i;

                //init series
                var sum = 0.0;
                for (i = 0; i < features.length; i++) {
                    sum += features[i].attributes[media.chartField];
                }

                for (i = 0; i < features.length; i++) {
                    var attributes = features[i].attributes;
                    var name = attributes[labelField];
                    var num = attributes[media.chartField];
                    var percent = (num / sum * 100).toFixed(1) + "%";
                    var ele = {
                        y: num,
                        text: "",
                        tooltip: "<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>" + name + ":" + percent + "</span><br/><span>(" + num + ")</span></div>"
                    };
                    series.push(ele);
                }

                //construct chart
                var pieChart = new Chart(chartNode);

                pieChart.setTheme(MiamiNice);

                pieChart.addPlot('default', {
                    type: Pie,
                    animate: {
                        duration: 2000,
                        easing: easing.bounceInOut
                    },
                    radius: 100,
                    markers: true
                });

                pieChart.addSeries(media.title, series);
                new MoveSlice(pieChart, "default");
                new Highlight(pieChart, "default");
                new Tooltip(pieChart, "default");

                pieChart.connectToPlot('default', lang.hitch(this, function (evt) {
                    var g = this.chartLayer.graphics[evt.index];
                    if (evt.type === 'onmouseover') {
                        this._setHightLightSymbol(g);
                    }
                    else if (evt.type === 'onmouseout') {
                        this._setFeatureSymbol(g);
                    }
                }));

                pieChart.render();

                return pieChart;
            }
        });
        return clazz;
    });