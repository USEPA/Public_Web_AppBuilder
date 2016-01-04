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
    'dojo/on',
    'dojo/query',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    "dojo/_base/Color",
    "dojo/dom-construct",
    "dojo/promise/all",
    "dojo/dom-style",
    "dojo/dom-class",

    'dijit/_WidgetsInTemplateMixin',
    "dijit/form/Select",
    "dijit/form/Button",
    'dijit/ProgressBar',
    "dijit/layout/AccordionContainer",

    'jimu/BaseWidget',
    'jimu/dijit/TabContainer',
    'jimu/dijit/DrawBox',

    "esri/graphic",
    "esri/config",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "esri/geometry/jsonUtils",
    "esri/tasks/RelationParameters",
    "esri/InfoTemplate",
    
    "dojox/charting/Chart",
    "dojox/charting/axis2d/Default",
    "dojox/charting/plot2d/Lines",
    "dojox/charting/plot2d/Bars",
    "dojox/charting/plot2d/Pie",
    "dojox/charting/plot2d/Columns",
    "dojox/charting/action2d/Tooltip",
    "dojo/fx/easing",
    "dojox/charting/action2d/MouseIndicator",
    "dojox/charting/action2d/Highlight",
    "dojox/charting/action2d/MoveSlice",
    "dojox/charting/themes/MiamiNice",
    "dojox/charting/action2d/Magnify",

    "./FacilityWidget",
    "./PieChartWidget"
],
    function (declare, on, query, lang, array, html, Color, domConstruct, all, domStyle, domClass,
             _WidgetsInTemplateMixin, Select, Button, ProgressBar, AccordionContainer,
             BaseWidget, TabContainer, DrawBox,
             Graphic, esriConfig, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, PictureMarkerSymbol, Query, QueryTask, GraphicsLayer, FeatureLayer, geometryJsonUtils, RelationParameters, InfoTemplate,
             Chart, Default, Lines, Bars, Pie, Columns, Tooltip, easing, MouseIndicator, Highlight, MoveSlice, MiamiNice, Magnify,
             FacilityWidget, PieChartWidget) {
        return declare([BaseWidget,_WidgetsInTemplateMixin], {
            baseClass: 'jimu-widget-chart',
            name: 'Chart',
            chartLayer:null,
            charts:[],
            currentChartIndex: -1,
            widgets: [],
            hasResults: false,
            facilitiesListFields: [],
            facilitiesListAttributes: [],

            postCreate: function () {
                this.inherited(arguments);
                this._initChartLayer();
                this._initSelectTab();
            },

            startup: function () {
                this.inherited(arguments);

                //Bind the click event for the tabs
                this.own(on(this.selectTab, "click", lang.hitch(this, this._setTab)));
                this.own(on(this.resultsTab, "click", lang.hitch(this, this._setTab)));

                //Show the select tab
                this._setTab({ target: this.selectTab });

                //demographic layer
                this._populateDemoCategoryType();

                //Wire up the change event
                this.own(on(this.demoCategoryTypes, "change", lang.hitch(this, this.onChangeDemoCategoryTypes)));

                //Call this to accommodate accordion weird behavior of rendering facilities list and pie chart
                this.acResults.watch("selectedChildWidget", lang.hitch(this, this.onAccordionSelectedChildWidget));
            },

            onClose:function(){
                this.drawBox.deactivate();
            },

            destroy:function(){
                if(this.chartLayer){
                    this.map.removeLayer(this.chartLayer);
                    this.chartLayer = null;
                }
                if(this.drawBox){
                    this.drawBox.destroy();
                    this.drawBox = null;
                }
                this.inherited(arguments);
            },

            /**
            * Initialize the chart graphics layer and add it to the map  
            */
            _initChartLayer:function(){
                this.chartLayer = new GraphicsLayer();
                this.map.addLayer(this.chartLayer);

                //Bind to mouse over and out events for graphics layer
                this.own(on(this.chartLayer, "mouse-over",
                    lang.hitch(this, this.onChartLayerMouseOver)));
                this.own(on(this.chartLayer, "mouse-out",
                    lang.hitch(this, this.onChartLayerMouseOut)));
            },

            _initSelectTab:function(){
                this._initLayerSelect();
                this._initDraw();
            },

            _initLayerSelect:function(){
                if(!(this.config && this.config.layers)){
                    return;
                }

                for(var i=0; i<this.config.layers.length; i++){
                    var layer = this.config.layers[i];
                    var option = {value: i, label: layer.label};
                    this.layerSelect.addOption(option);
                }
                this.own(on(this.layerSelect,'change',lang.hitch(this,function(){
                    this._clear();
                })));
            },

            /**
            * Initialize drawing toolbar
            **/
            _initDraw: function () {

                // add a removeDrawItem to DrawBox since it is not currently supported
                DrawBox.prototype.removeDrawItem = function (itemToRemove) {
                    var items = query('.draw-item', this.domNode);
                    array.forEach(items, lang.hitch(this, function (item) {
                        var geoType = item.getAttribute('data-geotype');
                        if (geoType == itemToRemove) {
                            html.setStyle(item, 'display', 'none');
                        }                       
                    }));  
                }

                this.drawBox.setMap(this.map);
                // Remove the following items from the draw toolbar
                this.drawBox.removeDrawItem("TRIANGLE");
                this.drawBox.removeDrawItem("CIRCLE");
                this.drawBox.removeDrawItem("ELLIPSE");

                this.own(on(this.drawBox,'Clear',lang.hitch(this,function(){
                    this.chartLayer.clear();
                    this._clearCharts();
                    this.hasResults = false;
                    //Hide the results section
                    this._showResultsSection(false, false, true);
                })));

                this.own(on(this.drawBox,'DrawEnd',lang.hitch(this,function(graphic,geotype,commontype){/*jshint unused: false*/
                    this.drawBox.deactivate();
                    this._clear();
                    this._doQuery(graphic.geometry);
                })));
            },

            /**
            * Create and show an info window when user mouse overs a facility graphic
            * @param evt
            */
            onChartLayerMouseOver: function (evt) {
                if (evt.graphic.getTitle() != this.config.CIKR.infrastructureLayer.title)
                    return;

                this.map.infoWindow.setContent(evt.graphic.getContent());
                this.map.infoWindow.setTitle(evt.graphic.getTitle());
                this.map.infoWindow.show(evt.screenPoint, this.map.getInfoWindowAnchor(evt.screenPoint));
            },

            /**
             * Hide the info window when user hovers away from a facility graphic
             */
            onChartLayerMouseOut: function () {
                this.map.infoWindow.hide();
            },

            /**
             * Determines which tab was clicked and show appropriate components
             * @param evt
             * @private
             */
            _setTab: function (evt) {
                var elements = [{ tab: this.selectTab, section: this.selectSection },
                    { tab: this.resultsTab, section: this.resultsSection }];
                for (var i = 0; i < elements.length; i++) {
                    if (evt.target === elements[i].tab) {
                        domClass.add(elements[i].tab, "arrow_box");
                        domStyle.set(elements[i].section.domNode, "display", "block");
                    } else {
                        domClass.remove(elements[i].tab, "arrow_box");
                        domStyle.set(elements[i].section.domNode, "display", "none");
                    }
                }
                if (this.hasResults) {
                    this._showResultsSection(false, true, false);
                } else {
                    this._showResultsSection(false, false, true);
                }
            },

            /**
            * Clears all graphics and resets draw toolbar
            * @private
            */
            _clear:function(){
                this.drawBox.clear();
                this.chartLayer.clear();
                this._clearCharts();

                this.hasResults = false;
                this.facilitiesListFields = [];
                this.facilitiesListAttributes = [];

                //Clear infrastructure list
                domConstruct.empty(this.facilitiesListSection);
                //Clear results section
                domConstruct.empty(this.resultsSection);
            },

            /**
             * Retrieves chart types for the demographic layer
             * @private
             */
            _populateDemoCategoryType: function () {
                var demoOptions = [];
                for (var i = 0; i < this.config.CIKR.demographicLayer.medias.length; i++) {
                        demoOptions.push({
                            label: this.config.CIKR.demographicLayer.medias[i].title,
                            value: i
                        });
                }
                this.demoCategoryTypes.addOption(demoOptions);
            },

            /**
            * Clears all visible charts 
            * @private
            */
            _clearCharts:function(){
                this.currentChartIndex = -1;

                for(var i=0;i<this.charts.length;i++){
                    var chart = this.charts[i];
                    if(chart){
                        chart.destroy();
                    }
                }
                this.charts = [];
                html.empty(this.pieChartSection);
                html.empty(this.facilitiesListSection);
                html.empty(this.cpFacilities);
            },

            /**
             * Quick and dirty way to check if field exists
             * @param features
             * @param fieldName
             * @returns {boolean}
             * @private
             */
            _fieldExists: function (features, fieldName) {
                return features.some(function (feature) {
                    if (feature.attributes[fieldName] !== undefined) {
                        return true;
                    } else {
                        return false;
                    }
                });
            },

            /**
            * Display error message to console
            * @private
            */
            _showError:function(errMsg){
                console.error(errMsg);
            },

            /**
            * Gets the currently set highlight color
            * @private
            */
            _getHighLightColor:function(){
                var color = new Color('#f5f50e');
                if(this.config && this.config.highLightColor){
                    color = new Color(this.config.highLightColor);
                }
                return color;
            },

            /**
            * Set the feature symbol based on the passed in feature
            * @param f
            * @private
            */
            _setFeatureSymbol:function(f){
                switch(f.geometry.type){
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

            /**
            * Get the feature symbol based on the passed in feature
            * @param f
            * @private
            */
            _getFeatureSymbol: function (f) {
                switch (f.geometry.type) {
                    case 'extent':
                    case 'polygon':
                        return this._getFillSymbol();
                        break;
                    case 'polyline':
                        return this._getLineSymbol();
                        break;
                    default:
                        return this._getMarkerSymbol();
                        break;
                }
            },

            /**
            * Set the highlight symbol based on the passed in feature
            * @private
            * @param g
            */
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

            /**
            * Get the marker symbol
            * @private
            */
            _getMarkerSymbol:function(){
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

            /**
            * Get the marker symbol for a highlighted feature
            * @private
            */
            _getHightLightMarkerSymbol:function(){
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

            /**
            * Get the line symbol for a line feature
            * @private
            */
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

            /**
            * Get the highlighted line symbol for a highlighted line feature
            * @private
            */
            _getHightLightLineSymbol:function(){
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

            /**
            * Get the fill symbol for a polygon feature
            * @private
            */
            _getFillSymbol:function(){
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

            /**
            * Get the highlighted fill symbol for a highlighted polygon feature
            * @private
            */
            _getHightLightFillSymbol:function(){
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

            /**
             * Create the facility point symbol
             * @returns {esri.symbols.SimpleMarkerSymbol}
             * @private
            */
            _getFacilitySymbol: function () {
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

            /**
             * Perform queries using a geometry as the input parameter
             * @param geometry
             * @private
            */ 
            _doQuery: function (geometry) {
                try {
                    //Check if we have the demographic and infrastructure layers
                    if (!this.config.CIKR.demographicLayer.url) {
                        this._onQueryError("Demographic layer was defined incorrectly");
                        return;
                    }
                    if (!this.config.CIKR.infrastructureLayer.url) {
                        this._onQueryError("Demographic layer was defined incorrectly");
                        return;
                    }

                    //Switch to results tab
                    this._setTab({ target: this.resultsTab });
                    this._showResultsSection(true, false, false); //Show the busy signal

                    //Query the demographic layer
                    var queryTaskList = [];
                    
                    //Query demographic layer first
                    var polyQTask = new QueryTask(this.config.CIKR.demographicLayer.url);
                    var polyQ = new Query();
                    polyQ.returnGeometry = true;
                    polyQ.outFields = this.config.CIKR.demographicLayer.fields;
                    polyQ.geometry = geometry;
                    queryTaskList.push(polyQTask.execute(polyQ));

                    //Query the infrastructure layer
                    var pointQTask = new QueryTask(this.config.CIKR.infrastructureLayer.url);
                    var pointQ = new Query();
                    pointQ.returnGeometry = true;
                    pointQ.outFields = this.config.CIKR.infrastructureLayer.fields;
                    pointQ.geometry = geometry;
                    queryTaskList.push(pointQTask.execute(pointQ));

                    all(queryTaskList).then(lang.hitch(this, this._handleQueryResults));
                } catch (err) {
                    window.console.error(err.message);
                }
            },         

            /**
             * Update pie chart and impacted facilities list from all responses from queries
             * @param results
             * @private
            */
            _handleQueryResults: function (results) {

                //Hide the progressbar
                this._showResultsSection(false, true, false);

                this.hasResults = true;

                //Iterate through the results
                for (var idx = 0; idx < results.length; idx++) {
                    var features = results[idx].features;
                    if (features.length > 0 && results[idx].geometryType === "esriGeometryPolygon") {
                        //Create the pie chart                   
                        this._createCharts(features);

                        // add the polygon feature to the map
                        for (var i = 0; i < features.length; i++) {
                            var f = features[i];
                            var outsideSymbol = new SimpleFillSymbol(this.config.CIKR.symbols.outsideFillSymbol);
                            f.setSymbol(outsideSymbol);
                            this.chartLayer.add(f);
                        }
                    }
                    else {
                        // add the facility feature to the map
                        for (var i = 0; i < features.length; i++) {
                            var feature = features[i];
                            var facINFO = "";
                            var facAttributes = "";
                            array.forEach(this.config.CIKR.infrastructureLayer.fields, function (field) {
                                facINFO += field + ": " + feature.attributes[field] + "<br>";
                                facAttributes += feature.attributes[field] + ",";
                            }, this);
                            var facAttr = { "facInfo": facINFO };
                            var facTemplate = new InfoTemplate(this.config.CIKR.infrastructureLayer.title, "${facInfo}");
                            //var facGraphic = new Graphic(feature.geometry, this._getFacilitySymbol(), facAttr, facTemplate);
                            var facGraphic = new Graphic(feature.geometry, this._getFeatureSymbol(feature), facAttr, facTemplate);
                            
                            this.chartLayer.add(facGraphic);

                            this.facilitiesListAttributes.push(facAttributes);
                        }

                        //Create the facilities list
                        this._setFacilitiesDataSource(features);
                    }
                }
            },

            /**
            * Handles query error
            * @param error
            * @private
            */
            _onQueryError: function (error) {
                html.setStyle(this.progressBar.domNode, 'display', 'none');
                this._clear();
                console.error("ChartWidget query failed", error);
                this._showError("Error");
                html.setStyle(this.resultsSection, 'display', 'none');
                html.setStyle(this.noresultsSection, 'display', 'block');
            },

            /**
             * Shows appropriate components given input parameters
             * @param showPB
             * @param showResults
             * @param showNoResults
             * @private
           */
            _showResultsSection: function (showPB, showResults, showNoResults) 
            {
                domStyle.set(this.progressBar, "display", showPB ? "block" : "none");
                domStyle.set(this.resultsDisplaySection, "display", showResults ? "block" : "none");
                domStyle.set(this.noresultsSection, "display", showNoResults ? "block" : "none");
                domStyle.set(this.demoCategoryForm, "display", showResults ? "block" : "none");
            },

            /**
             * Update the pie chart based on the selected option from the demographic
             * drop down list
             * @param newValue
             */
            onChangeDemoCategoryTypes: function (newValue) {

                // Get the selected index of the demoCategoryTypesId select form
                var index = this._getDemoSelectedIndex();

                this._showChart(index);
            },

            /**
            * Returns the js object of the currently selected demographics item
            * @private
            */
            _getDemoSelectedIndex: function () {
                return dijit.byId('demoCategoryTypesId').get('value');
            },

            /**
            * Creates the pie chart for the demographics
            * @param chartNode 
            * @param media
            * @param features
            * @param labelField
            */
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
                        var outsideSymbol = new SimpleFillSymbol(this.config.CIKR.symbols.outsideFillSymbol);
                        g.setSymbol(outsideSymbol);
                    }
                }));

                pieChart.render();

                return pieChart;
            },

            /**
            * Create the facilities list component
            * @param features
            * @private
            */
            _setFacilitiesDataSource: function (features) {

                // Set the title for the content pane from the config file
                this.cpFacilities.set("title", this.config.CIKR.infrastructureLayer.title);
                this.cpDemographic.set("title", this.config.CIKR.demographicLayer.title);

                //Clear out old results
                domConstruct.empty(this.facilitiesListSection);
                if (features.length > 0) {
                    array.forEach(features, function (feature) {
                        var facilityDiv = domConstruct.create("div", { "class": "jimu-widget-chart featureLabel" },
                            this.facilitiesListSection, "last");
                        var facility = new FacilityWidget({
                            graphicsLayer: this.chartLayer,
                            inputGraphic: feature
                        }, facilityDiv);
                        this._trackDijits(facility);
                    }, this);

                    var exportButton = new Button({ label: "Export to CSV" });
                    exportButton.startup();
                    exportButton.placeAt(document.getElementById("facilitiesListDiv"));

                    var self = this;
                    exportButton.on("click", lang.hitch(self, function () {
                        this._exportCSV(self);
                    }));

                } else {
                    //Add no query results message
                    domConstruct.create("div", { innerHTML: "No impacted facilities" }, this.facilitiesListSection);
                }
            },

            /** 
            * Export facilities list to csv file
            * @private
            **/
            _exportCSV: function (self) {
                var csvreport = [], items = [];
                var fields = "";
                array.forEach(this.config.CIKR.infrastructureLayer.fields, function (field) {
                    fields += field + ",";
                }, self);
                csvreport.push(fields);
                csvreport.push("\n");

                for (var i = 0; i < self.facilitiesListAttributes.length; i++) {
                    var attributes = self.facilitiesListAttributes[i];
                    csvreport.push(attributes);
                    csvreport.push("\n");
                }

                if (csvreport.length > 0) {
                    var url = "widgets/CI_KR_Chart/webservices/csv.ashx";
                    var data = csvreport.join("");
                    var f = dojo.byId("downloadform");
                    f.action = url;
                    dojo.byId("reportinput").value = data;
                    f.submit();
                }
            },

            /**
            * Keeps track of dijits created in this widget
            * @private
            */
            _trackDijits: function () {
                array.forEach(arguments, function (argument) {
                    if (argument && argument.destroyRecursive) {
                        this.widgets.push(argument);
                    }
                }, this);
            },

            /**
            * Displays the pie chart
            * @param index
            * @private
            **/
            _showChart: function (index) {
                
                this.currentChartIndex = -1;
                var chartDivs = query('.chart-div', this.pieChartSection);
                chartDivs.style({display:'none'});
 
                if(index < 0){
                    return;
                }

                var chartDiv = chartDivs[index];
                if(chartDiv){
                    this.currentChartIndex = index;
                    html.setStyle(chartDiv, { display: 'block' });  
                }
                var chart = this.charts[index];
                if(chart&&chart.media){
                    this.description.innerHTML = chart.media.description||"";
                }
            },

            /**
            * Ability to create different types of charts based on what is set in the config
            * @param features
            * @private
            */
            _createCharts: function (features) {
                this._clearCharts();
                html.setStyle(this.resultsSection,'display','block');
                html.setStyle(this.noresultsSection, 'display', 'none');
                html.setStyle(this.pieChartSection, 'display', 'block');

                var medias = this.config.CIKR.demographicLayer.medias;
                var labelField = this.config.CIKR.demographicLayer.labelField;
                var box = html.getMarginBox(this.pieChartSection);
                var w = box.w + "px";
                var h = box.h + "px";

                var i, chart;

                for(i=0;i<medias.length;i++){
                    chart = null;
                    var media = medias[i];
                    var type = media.type.toLowerCase();
                    var chartDiv = html.create('div', { 'class': 'chart-div', style: { width: w, height: h } }, this.pieChartSection);
                    if(type === 'barschart'){
                        chart = this._creatBarsChart(chartDiv,media,features,labelField);
                    }
                    else if(type === 'columnschart'){
                        chart = this._creatColumnsChart(chartDiv,media,features,labelField);
                    }
                    else if(type === 'linechart'){
                        chart = this._creatLineChart(chartDiv,media,features,labelField);
                    }
                    else if(type === 'piechart'){
                        chart = this._createPieChart(chartDiv,media,features,labelField);
                    }

                    if(chart){
                        chart.media = media;
                        this.charts.push(chart);
                        html.setStyle(chartDiv,'display','none');
                    }
                    else{
                        html.destroy(chartDiv);
                    }
                }

                this._showChart(0);
            },

            /**
            * Creates a bar chart
            * @param chartNode
            * @param media
            * @param features
            * @param labelField
            * @private
            */
            _creatBarsChart: function(chartNode, media, features, labelField) {
                var series = [];

                //init series
                for (var i = 0; i < features.length; i++) {
                    var attributes = features[i].attributes;
                    var name = attributes[labelField];
                    var num = attributes[media.chartField];
                    var ele = {
                        y:num,
                        tooltip:"<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>"+name+"</span><br/><span>"+num+"</span></div>"
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

                barsChart.addAxis('x',{
                    vertical:true
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

                barsChart.connectToPlot('default',lang.hitch(this,function(evt){
                    var g = this.chartLayer.graphics[evt.index];
                    if(evt.type === 'onmouseover'){
                        this._setHightLightSymbol(g);
                    }
                    else if(evt.type === 'onmouseout'){
                        this._setFeatureSymbol(g);
                    }
                }));
                barsChart.render();

                return barsChart;
            },

            /**
            * Creates a column chart
            * @param chartNode
            * @param media
            * @param features
            * @param labelField
            * @private
            */
            _creatColumnsChart: function(chartNode, media, features, labelField) {
                var series = [];

                //collect series
                for (var i = 0; i < features.length; i++) {
                    var attributes = features[i].attributes;
                    var name = attributes[labelField];
                    var num = attributes[media.chartField];
                    var ele = {
                        y:num,
                        tooltip:"<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>"+name+"</span><br/><span>"+num+"</span></div>"
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
                    fixUpper: "minor"
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

                columnsChart.connectToPlot('default',lang.hitch(this,function(evt){
                    var g = this.chartLayer.graphics[evt.index];
                    if(evt.type === 'onmouseover'){
                        this._setHightLightSymbol(g);
                    }
                    else if(evt.type === 'onmouseout'){
                        this._setFeatureSymbol(g);
                    }
                }));

                columnsChart.render();

                return columnsChart;
            },

            /**
            * Creates a line chart
            * @param chartNode
            * @param media
            * @param features
            * @param labelField
            * @private
            */
            _creatLineChart: function(chartNode, media, features, labelField) {
                var series = [];

                //init series
                for (var i = 0; i < features.length; i++) {
                    var attributes = features[i].attributes;
                    var name = attributes[labelField];
                    var num = attributes[media.chartField];
                    var ele = {
                        y:num,
                        tooltip:"<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>"+name+"</span><br/><span>"+num+"</span></div>"
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
                    fixUpper:"minor",
                    fixLower:"minor"
                });

                lineChart.addSeries(media.title,series, {
                    stroke: {
                        color: "#FF7F0E"
                    },
                    fill: "#FF7F0E"
                });

                new Magnify(lineChart, "default");
                new Highlight(lineChart, "default");
                new Tooltip(lineChart, "default");

                lineChart.connectToPlot('default',lang.hitch(this,function(evt){
                    var g = this.chartLayer.graphics[evt.index];
                    if(evt.type === 'onmouseover'){
                        this._setHightLightSymbol(g);
                    }
                    else if(evt.type === 'onmouseout'){
                        this._setFeatureSymbol(g);
                    }
                }));

                lineChart.render();

                return lineChart;
            },
            
            /**
             * Refresh pie chart or set the facilities content pane to 100% width
             * @param attr
             * @param oldVal
             * @param newVal
             */
            onAccordionSelectedChildWidget: function (attr, oldVal, newVal) {
                //Call this to accommodate accordion weird behavior of rendering facilities list and pie chart
                if (newVal.title === "Demographics") {
                    this.onChangeDemoCategoryTypes(this.demoCategoryTypes.attr("value"));
                } else {
                    this.cpFacilities.domNode.style.width = "100%";
                }
            }           
        });
    });