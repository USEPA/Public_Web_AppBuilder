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
/*jshint loopfunc: true */
define([
    "dojo/_base/declare",
    "dojo/on",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/_base/Deferred",
    "dojo/_base/Color",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/query",
    "dojo/promise/all",

    "dijit/_WidgetsInTemplateMixin",
    "dijit/layout/ContentPane",
    "dijit/form/Select",
    "dijit/ProgressBar",
    "dijit/TitlePane",
    "dijit/layout/AccordionContainer",

    "jimu/BaseWidget",

    "esri/config",
    "esri/request",
    "esri/toolbars/draw",
    "esri/InfoTemplate",
    "esri/SpatialReference",

    "esri/graphic",
    "esri/layers/GraphicsLayer",

    "esri/geometry/Circle",
    "esri/geometry/geometryEngineAsync",

    "esri/tasks/BufferParameters",
    "esri/tasks/GeometryService",
    "esri/tasks/query",
    "esri/tasks/QueryTask",

    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",

    "./PieChartWidget",
    "./FacilityWidget"

], function (declare, on, lang, array, Deferred, Color, domStyle, domConstruct, domClass, query, all,
             _WidgetsInTemplateMixin, ContentPane, Select, ProgressBar, TitlePane, AccordionContainer,
             BaseWiget,
             esriConfig, esriRequest, Draw, InfoTemplate, SpatialReference,
             Graphic, GraphicsLayer,
             EsriCircle, geometryEngineAsync,
             BufferParameters, GeometryService, Query, QueryTask,
             SimpleMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol,
             PieChartWidget, FacilityWidget) {
    /**
     * The Bomb Threat widget allows a user to add a bomb type to the map
     * @type {*}
     * @module widgets/BombThreat
     */
    var bombThreatClass = declare([BaseWiget, _WidgetsInTemplateMixin], {
        baseClass: "jimu-widget-bombThreat",
        name: "bombThreat",

        selectedBombType: null,
        bombLocationGraphicsLayer: null,
        bombBufferGraphicsLayer: null,
        facilitiesGraphicsLayer: null,

        drawToolbar: null,

        widgets: [],
        bombTypeDistances: null,

        pieChartDataList: [],
        pieChart: null,

        bombLocationIndex: 0,
        bombLocationList: [],

        facilitiesDataList: [],

        optionalEvacAreas: [],

        hasResults: false,

        /**
         * Widget postCreate
         */
        postCreate: function () {
            this.inherited(arguments);
            //Check for valid demographic and infrastructure layer URLs
            this._checkValidServices().then(lang.hitch(this, function () {
                //init the geometry service before moving on
                this._initGeometryService().then(lang.hitch(this, function () {
                    this._init();
                }), function (err) {
                    window.console.error(err);
                });
            }), function (err) {
                window.console.error(err);
            });
        },

        /**
         * Widget startup
         */
        startup: function () {
            this.inherited(arguments);
        },

        /**
         * Widget destroy
         */
        destroy: function () {
            this._cleanUp();
        },

        /**
         * Geometry Service error. Display error message to user
         * @param error
         */
        onGeometryServiceOnError: function (error) {
            window.console.error(error);
        },

        /**
         * Create blast zones graphics from results of the geometry service buffer operations.
         * Inside polygon graphic refers to mandatory evac distance.
         * Outside polygon graphic refers to shelter in place zone.
         * @param results
         */
        onGeometryServiceBufferComplete: function (results) {
            var insideSymbol = new SimpleFillSymbol(this.config.bombThreat.symbols.insideFillSymbol);
            var insideAttr = {"Evac": "Mandatory Evacuation Distance"};
            var infoTemplate = new InfoTemplate("Evacuation Zone", "Zone: ${Evac}");
            var insideGraphic = new Graphic(results.geometries[0], insideSymbol, insideAttr, infoTemplate);

            var outsideSymbol = new SimpleFillSymbol(this.config.bombThreat.symbols.outsideFillSymbol);
            var outsideAttr = {"Evac": "Shelter-in-Place Zone"};
            var outInfoTemplate = new InfoTemplate("Evacuation Zone", "Zone: ${Evac}");
            var outsideGraphic = new Graphic(results.geometries[1], outsideSymbol, outsideAttr, outInfoTemplate);

            this.bombBufferGraphicsLayer.add(outsideGraphic);
            this.bombBufferGraphicsLayer.add(insideGraphic);

            //Capture all optional evac areas for demographic and
            //infrastructure queries
            this.optionalEvacAreas.push(outsideGraphic.geometry);
        },

        /**
         * Save bomb type selected by user
         * @param newValue
         */
        onChangeBombType: function (newValue) {
            this.selectedBombType = newValue;
        },

        /**
         * Zoom to selected bomb location
         * @param newValue
         */
        onChangeBombLocations: function (newValue) {
            //Iterate through the bomb location list to get the right value
            var bombLocPt = null;
            array.forEach(this.bombLocationList, function (bombLocation) {
                if (bombLocation.value === newValue) {
                    bombLocPt = bombLocation.geometry;
                }
            }, this);
            var gExtent = new EsriCircle(bombLocPt, {
                "radius": this.bombTypeDistances[this.selectedBombType].OutdoorEvacDistance
            });
            //Zoom to the location
            this.map.setExtent(gExtent.getExtent());

            //Get the index of the selected option
            var selectedIndex = 0;
            array.forEach(this.bombLocations.getOptions(), function (option, idx) {
                if (option.value === newValue) {
                    selectedIndex = idx;
                }
            }, this);

            //Update the pie chart with the first chart series
            this.pieChart.updateSeries(this.pieChartDataList[selectedIndex][0]);
            //Reset the demographics drop down list to the first index
            this.demoCategoryTypes.setValue(this.demoCategoryTypes.options[0].value);
            //Update the facilities list
            this._setFacilitiesDataSource(this.facilitiesDataList[selectedIndex]);
            this._addFacilitiesToMap(this.facilitiesDataList[selectedIndex]);
        },

        /**
         * Update the pie chart based on the selected option from the demographic
         * drop down list
         * @param newValue
         */
        onChangeDemoCategoryTypes: function (newValue) {
            //Get the selected index from the bomb location drop down list
            var selectedIndex = 0;
            array.forEach(this.bombLocations.options, function (option, idx) {
                if (option.value === this.bombLocations.attr("value")) {
                    selectedIndex = idx;
                }
            }, this);
            array.forEach(this.pieChartDataList[selectedIndex], function (chartData) {
                if (newValue === chartData.name) {
                    this.pieChart.updateSeries(chartData);
                }
            }, this);
        },

        /**
         * Create and show an info window when user mouse overs a bomb location graphic
         * @param evt
         */
        onBombLocationGraphicsLayerMouseOver: function (evt) {
            this.map.infoWindow.setContent(evt.graphic.getContent());
            this.map.infoWindow.setTitle(evt.graphic.getTitle());
            this.map.infoWindow.show(evt.screenPoint, this.map.getInfoWindowAnchor(evt.screenPoint));
        },

        /**
         * Hide the info window when user hovers away from a bomb location graphic
         */
        onBombLocationGraphicsLayerMouseOut: function () {
            this.map.infoWindow.hide();
        },

        /**
         * Create the bomb location point and add to the
         * bomb location layer
         * @param evt
         */
        onDrawEndAddBombLocation: function (evt) {
            //Create the bomb type point symbol
            var symbol = new SimpleMarkerSymbol(this.config.bombThreat.symbols.simplemarkersymbol);
            //Show selected bomb type for info template attributes
            var attr = {
                "Evac": this.selectedBombType
            };
            //Create info template, graphic and add graphic to the bomb location layer
            var title = lang.replace("Bomb Location #{index}", {index: ++this.bombLocationIndex});
            var infoTemplate = new InfoTemplate(title, "Bomb Type: ${Evac}");
            var graphic = new Graphic(evt.geometry, symbol, attr, infoTemplate);
            this.bombLocationGraphicsLayer.add(graphic);

            //Keep a list of bomb locations created by the user
            this.bombLocationList.push({
                label: lang.replace("{title} - {bombType}", {title: title, bombType: this.selectedBombType}),
                value: lang.replace("{title} - {bombType}", {title: title, bombType: this.selectedBombType}),
                geometry: evt.geometry,
                bombType: this.selectedBombType
            });
        },

        /**
         * Activates the draw tool for adding bomb locations
         */
        onClickDrawBombType: function () {
            //Disable map navigation
            this.map.disableMapNavigation();
            //Activate the draw tool for adding points
            this.drawToolbar.activate("point");
            //Disable popups on map
            this.map.setInfoWindowOnClick(false);
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
        },

        /**
         * Called when user clicks the "Run" button. It calls the buffer operations
         * from the geometry service. Each bomb type has an evacuation distance and is used
         * to determine the buffer distance for the selected bomb type.
         */
        _executeSearch: function () {
            if (this.bombLocationList.length > 0) {
                //Clear graphics layer of any old graphics
                this.bombBufferGraphicsLayer.clear();

                //deactivate the toolbar
                this.drawToolbar.deactivate();
                //Enable map navigation
                this.map.enableMapNavigation();
                //Enable popups
                this.map.setInfoWindowOnClick(true);

                //Switch to results tab
                this._setTab({target: this.resultsTab});
                this._showResultsSection(true, false, false); //Show the busy signal

                var bufferParams = new BufferParameters();
                bufferParams.unit = GeometryService.UNIT_FOOT;
                bufferParams.outSpatialReference = this.map.spatialReference;
                bufferParams.bufferSpatialReference = new SpatialReference({wkid: 102004});
                //bufferParams.geodesic = true;

                var bufferOps = [];
                array.forEach(this.bombLocationList, function (bombLocation) {
                    bufferParams.distances = [this.bombTypeDistances[bombLocation.bombType].BuildingEvacDistance,
                        this.bombTypeDistances[bombLocation.bombType].OutdoorEvacDistance];
                    bufferParams.geometries = [bombLocation.geometry];
                    //Perform buffer operation
                    bufferOps.push(esriConfig.defaults.geometryService.buffer(bufferParams));
                }, this);

                this.optionalEvacAreas = [];

                all(bufferOps).then(lang.hitch(this, function () {
                    //Zoom map to the shelter in place polygon graphic extent
                    if (this.optionalEvacAreas.length > 1) {
                        geometryEngineAsync.union(this.optionalEvacAreas).then(lang.hitch(this, function (results) {
                            this.map.setExtent(results.getExtent(), true);
                        }));
                    } else {
                        this.map.setExtent(this.optionalEvacAreas[0].getExtent(), true);
                    }

                    //Perform demographic queries using the shelter in place zone
                    //polygon graphic
                    this._doQuery(this.optionalEvacAreas);

                    //Add the bomb locations to the drop down list control
                    this.bombLocations.options.length = 0; //clear out options first before adding
                    this.bombLocations.addOption(this.bombLocationList);

                    this.hasResults = true;
                }));

            } else {
                alert("Please add bomb location(s) to the map");
            }
        },

        /**
         * Called when user clicks "Clear" button. Clear graphic layers and results DOM node
         */
        onClearBtnClicked: function () {
            this._clearResults();
        },

        /**
         * Perform queries using list of geometries input parameter
         * @param geometries
         * @private
         */
        _doQuery: function (geometries) {
            try {
                //Check if we have the demographic and infrastructure layers
                if (!this.config.bombThreat.demographicLayer.url) {
                    this._onQueryError("Demographic layer was defined incorrectly");
                    return;
                }
                if (!this.config.bombThreat.infrastructureLayer.url) {
                    this._onQueryError("Demographic layer was defined incorrectly");
                    return;
                }

                //Query the demographic and infrastructure layers
                var queryTaskList = [];
                for (var idx = 0; idx < geometries.length; idx++) {
                    //Query demographic layer first
                    var polyQTask = new QueryTask(this.config.bombThreat.demographicLayer.url);
                    var polyQ = new Query();
                    polyQ.returnGeometry = true;
                    polyQ.outFields = this.config.bombThreat.demographicLayer.fields;
                    polyQ.geometry = geometries[idx];
                    queryTaskList.push(polyQTask.execute(polyQ));
                }
                for (var index = 0; index < geometries.length; index++) {
                    var pointQTask = new QueryTask(this.config.bombThreat.infrastructureLayer.url);
                    var pointQ = new Query();
                    pointQ.returnGeometry = true;
                    pointQ.outFields = this.config.bombThreat.infrastructureLayer.fields;
                    pointQ.geometry = geometries[index];
                    queryTaskList.push(pointQTask.execute(pointQ));
                }
                all(queryTaskList).then(lang.hitch(this, this._handleQueryResults));
            } catch (err) {
                window.console.error(err.message);
            }
        },

        /**
         * Report error to user via console
         * @param error
         * @private
         */
        _onQueryError: function (error) {
            window.console.error("ChartWidget query failed", error);
            domStyle.set(this.progressBar.domNode, 'display', 'none');
            domStyle.set(this.resultsBombSection, 'display', 'none');
            domStyle.set(this.noResultsSection, 'display', 'block');
        },

        /**
         * Update pie chart and impacted facilities list from all responses from queries
         * @param results
         * @private
         */
        _handleQueryResults: function (results) {
            //Hide the progressbar
            this._showResultsSection(false, true, false);

            //Reset the facilities and pie chart arrays
            this.pieChartDataList = [];
            this.facilitiesDataList = [];

            //Iterate through the results
            for (var idx = 0; idx < results.length; idx++) {
                var features = results[idx].features;
                if (features.length > 0 && results[idx].geometryType === "esriGeometryPolygon") {
                    //Create the pie chart
                    this.pieChartDataList.push(this._setPieChartDataSource(features));
                } else {
                    //Create the facilities
                    this.facilitiesDataList.push(features);
                }
            }
            //Update the pie chart
            if (this.pieChartDataList.length > 0) {
                this.pieChart.updateSeries(this.pieChartDataList[0][0]);
            }
            if (this.facilitiesDataList.length > 0) {
                //Create the facilities list
                this._setFacilitiesDataSource(this.facilitiesDataList[0]);
                //Add facilities to the map
                this._addFacilitiesToMap(this.facilitiesDataList[0]);
            }
        },

        /**
         * Create the facilities list component
         * @param features
         * @private
         */
        _setFacilitiesDataSource: function (features) {
            //Clear out old results
            domConstruct.empty(this.facilitiesListSection);
            if (features.length > 0) {
                array.forEach(features, function (feature) {
                    var facilityDiv = domConstruct.create("div", {"class":"jimu-widget-bombThreat featureLabel"},
                        this.facilitiesListSection, "last");
                    var facility = new FacilityWidget({
                        graphicsLayer: this.facilitiesGraphicsLayer,
                        inputGraphic: feature
                    }, facilityDiv);
                    this._trackDijits(facility);
                }, this);
            } else {
                //Add no query results message
                domConstruct.create("div", {innerHTML: "No impacted facilities"}, this.facilitiesListSection);
            }
        },

        /**
         * Add impacted facilities to the map
         * @param features
         * @private
         */
        _addFacilitiesToMap: function (features) {
            this.facilitiesGraphicsLayer.clear();
            array.forEach(features, function (feature) {
                var facINFO = "";
                array.forEach(this.config.bombThreat.infrastructureLayer.fields, function (field) {
                    facINFO += field + ": " + feature.attributes[field] + "<br>";
                }, this);
                var facAttr = {"facInfo": facINFO};
                var facTemplate = new InfoTemplate("Impacted Facility", "${facInfo}");
                var facGraphic = new Graphic(feature.geometry, this._getFacilitySymbol(), facAttr, facTemplate);
                this.facilitiesGraphicsLayer.add(facGraphic);
            }, this);
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
         * Create and store data source(s) for pie chart
         * @param features
         * @returns {{data: Array, total: number}}
         * @private
         */
        _setPieChartDataSource: function (features) {
            var categoryList = [];
            var layerInfo = this.config.bombThreat.demographicLayer;

            for (var key in layerInfo.charts) {
                if (layerInfo.charts.hasOwnProperty(key)) {
                    var totalCount = 0, dataList = [], medias = layerInfo.charts[key].medias;
                    array.forEach(medias, function (media, idx) {
                        //quick check if field exists
                        if (this._fieldExists(features, media.chartField)) {
                            var catCount = 0;
                            array.forEach(features, function (feature) {
                                var num = feature.attributes[media.chartField];
                                catCount += num;
                                totalCount += num;
                            }, this);
                            var newObj = {
                                id: idx,
                                text: media.title,
                                y: catCount
                            };
                            dataList.push(newObj);
                        }
                    }, this);
                    if (dataList.length > 0) {
                        categoryList.push({
                            data: dataList,
                            total: totalCount,
                            name: layerInfo.charts[key].title
                        });
                    }
                }
            }
            return categoryList;
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
         * Default data source for pie chart after it has been
         * initialized
         * @returns {{data: Array, total: number}}
         * @private
         */
        _setDefaultDataSource: function () {
            return {
                data: [
                    {
                        id: 0,
                        text: "N/A",
                        y: 1
                    }
                ],
                total: 1
            };
        },

        /**
         * Init pie chart
         * @private
         */
        _initPieChart: function () {
            this.pieChart = new PieChartWidget({
                title: this.config.bombThreat.demographicLayer.title,
                seriesName: "series1"
            }, this.pieChartSection);
            this.pieChart.startup();
            this._trackDijits(this.pieChart);
        },

        /**
         * Retrieves chart types for the demographic layer
         * @private
         */
        _populateDemoCategoryType: function () {
            var demoOptions = [];
            for (var key in this.config.bombThreat.demographicLayer.charts) {
                if (this.config.bombThreat.demographicLayer.charts.hasOwnProperty(key)) {
                    demoOptions.push({
                        label: this.config.bombThreat.demographicLayer.charts[key].title,
                        value: this.config.bombThreat.demographicLayer.charts[key].title
                    });
                }
            }
            this.demoCategoryTypes.addOption(demoOptions);
        },

        /**
         * Bind to geometry events and dijit select events.
         * Create graphic layer and bind to its events.
         * Create draw toolbar and bind to its events.
         * @private
         */
        _init: function () {
            //Bind to geometry events
            this.own(on(esriConfig.defaults.geometryService, "buffer-complete",
                lang.hitch(this, this.onGeometryServiceBufferComplete)));
            this.own(on(esriConfig.defaults.geometryService, "error",
                lang.hitch(this, this.onGeometryServiceOnError)));

            //Bind to change event for bomb type drop down list
            this.own(on(this.bombType, "change", lang.hitch(this, this.onChangeBombType)));

            //Create buffer graphics layer and add to the map
            this.bombBufferGraphicsLayer = new GraphicsLayer();
            this.map.addLayer(this.bombBufferGraphicsLayer);
            //Bind to mouse over and out events for graphics layer
            this.own(on(this.bombBufferGraphicsLayer, "mouse-over",
                lang.hitch(this, this.onBombLocationGraphicsLayerMouseOver)));
            this.own(on(this.bombBufferGraphicsLayer, "mouse-out",
                lang.hitch(this, this.onBombLocationGraphicsLayerMouseOut)));

            //Create spill location graphics layer and add to the map
            this.bombLocationGraphicsLayer = new GraphicsLayer();
            this.map.addLayer(this.bombLocationGraphicsLayer);
            //Bind to mouse over and out events for graphics layer
            this.own(on(this.bombLocationGraphicsLayer, "mouse-over",
                lang.hitch(this, this.onBombLocationGraphicsLayerMouseOver)));
            this.own(on(this.bombLocationGraphicsLayer, "mouse-out",
                lang.hitch(this, this.onBombLocationGraphicsLayerMouseOut)));

            //Create the facilities graphics layer and add to the map
            this.facilitiesGraphicsLayer = new GraphicsLayer();
            this.map.addLayer(this.facilitiesGraphicsLayer);
            //Bind to mouse over and out events for graphics layer
            this.own(on(this.facilitiesGraphicsLayer, "mouse-over",
                lang.hitch(this, this.onBombLocationGraphicsLayerMouseOver)));
            this.own(on(this.facilitiesGraphicsLayer, "mouse-out",
                lang.hitch(this, this.onBombLocationGraphicsLayerMouseOut)));

            //Create draw toolbar
            this.drawToolbar = new Draw(this.map);
            this._trackDijits(this.drawToolbar); //track dijit
            //Bind to draw end and click events
            this.own(on(this.drawToolbar, "draw-end", lang.hitch(this, this.onDrawEndAddBombLocation)));

            //Bind to draw bomb type button
            this.own(on(this.drawBombType, "click", lang.hitch(this, this.onClickDrawBombType)));
            //Get building and outdoor distances for bomb types
            this.bombTypeDistances = this._getBombTypeDistances();
            //Wire up the change event
            this.own(on(this.bombLocations, "change", lang.hitch(this, this.onChangeBombLocations)));
            //Populate the bomb type drop down list
            this.bombType.addOption(this._getBombTypes());

            //Bind the click event for the tabs
            this.own(on(this.bombLocationTab, "click", lang.hitch(this, this._setTab)));
            this.own(on(this.resultsTab, "click", lang.hitch(this, this._setTab)));

            //Bind the click events for execute and clear buttons
            this.own(on(this.btnSearch, "click", lang.hitch(this, this._executeSearch)));
            this.own(on(this.btnClear, "click", lang.hitch(this, this.onClearBtnClicked)));

            //Show the bomb location tab
            this._setTab({target: this.bombLocationTab});

            //Init the pie chart
            this._initPieChart();

            //Populate the chart types from the
            //demographic layer
            this._populateDemoCategoryType();
            //Wire up the change event
            this.own(on(this.demoCategoryTypes, "change", lang.hitch(this, this.onChangeDemoCategoryTypes)));

            //Set initial bomb type
            this.selectedBombType = "Pipe bomb";

            //Call this to accommodate accordion weird behavior of rendering facilities list and pie chart
            this.acResults.watch("selectedChildWidget", lang.hitch(this, this.onAccordionSelectedChildWidget));

            query(".dijitAccordionTitle", this.acResults.domNode).forEach(lang.hitch(this, function (node) {
                domClass.add(node, "cp");
            }));
        },

        /**
         * Determines which tab was clicked and show appropriate components
         * @param evt
         * @private
         */
        _setTab: function (evt) {
            var elements = [{tab: this.bombLocationTab, section: this.bombThreatLocationSection},
                {tab: this.resultsTab, section: this.resultsSection}];
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
         * Dictionary of building and outdoor distances
         * @returns {{}}
         * @private
         */
        _getBombTypeDistances: function () {
            var bombTypeDistances = {};
            bombTypeDistances["Pipe bomb"] = {
                BuildingEvacDistance: 70,
                OutdoorEvacDistance: 1200
            };
            bombTypeDistances["Suicide vest"] = {
                BuildingEvacDistance: 110,
                OutdoorEvacDistance: 1750
            };
            bombTypeDistances["Briefcase/suitcase bomb"] = {
                BuildingEvacDistance: 150,
                OutdoorEvacDistance: 1850
            };
            bombTypeDistances["Sedan"] = {
                BuildingEvacDistance: 320,
                OutdoorEvacDistance: 1900
            };
            bombTypeDistances["SUV/van"] = {
                BuildingEvacDistance: 400,
                OutdoorEvacDistance: 2400
            };
            bombTypeDistances["Small delivery truck"] = {
                BuildingEvacDistance: 640,
                OutdoorEvacDistance: 3800
            };
            bombTypeDistances["Container/water truck"] = {
                BuildingEvacDistance: 860,
                OutdoorEvacDistance: 5100
            };
            bombTypeDistances["Semi-trailer"] = {
                BuildingEvacDistance: 1570,
                OutdoorEvacDistance: 9300
            };
            return bombTypeDistances;
        },

        /**
         * Checks if supplied geometry service is valid
         * @returns {Function}
         * @private
         */
        _initGeometryService: function () {
            var deferred = new Deferred();
            if (this.config.bombThreat.geometryService.url) {
                esriRequest({
                    url: this.config.bombThreat.geometryService.url,
                    content: {f: "json"},
                    handleAs: "json",
                    callbackParamName: "callback"
                }).then(lang.hitch(this, function (response) {
                        if (response.hasOwnProperty("serviceDescription")) {
                            if (response.serviceDescription !== undefined || response.serviceDescription !== "") {
                                esriConfig.defaults.geometryService = new GeometryService(this.config.bombThreat.geometryService.url);
                                deferred.resolve();
                            } else {
                                window.console.log("Invalid geometry service supplied. Using default geometry service.");
                            }
                        }
                    }), lang.hitch(this, function (error) {
                        window.console.log(error);
                        deferred.resolve();
                    }));
            } else {
                deferred.reject(new Error("Invalid geometry service supplied"));
            }
            return deferred.promise;
        },

        /**
         * Checks if services provided in config file are valid
         * @returns {Function}
         * @private
         */
        _checkValidServices: function () {
            var deferred = new Deferred();
            var defList = [];
            var layerUrls = [this.config.bombThreat.demographicLayer.url, this.config.bombThreat.infrastructureLayer.url];
            array.forEach(layerUrls, function (layerUrl) {
                defList.push(esriRequest({
                        url: layerUrl,
                        content: {f: "json"},
                        callbackParamName: "callback"
                    }));
            }, this);
            all(defList).then(lang.hitch(this, function (results) {
                var hasError = false;
                array.forEach(results, function (result) {
                    if (!result.hasOwnProperty("type")) {
                        hasError = true;
                    }
                }, this);
                if (hasError) {
                    deferred.reject(new Error("Invalid services supplied"));
                } else {
                    deferred.resolve();
                }
            }));
            return deferred.promise;
        },

        /**
         * Creates a list of bomb types objects for drop down list
         * @returns {Array}
         * @private
         */
        _getBombTypes: function () {
            //Bomb Types
            var bombTypes = ["Pipe bomb", "Suicide vest", "Briefcase/suitcase bomb", "Sedan", "SUV/van",
                "Small delivery truck", "Container/water truck", "Semi-trailer"];
            var bombTypeOptions = [];
            array.forEach(bombTypes, function (bombType) {
                var bombTypeOption = {
                    label: bombType,
                    value: bombType
                };
                bombTypeOptions.push(bombTypeOption);
            }, this);
            return bombTypeOptions;
        },

        /**
         * Clears the results components and resets everything
         * @private
         */
        _clearResults: function () {
            try {
                //deactivate the toolbar
                this.drawToolbar.deactivate();

                //Clear graphics layers
                var gLayers = [this.facilitiesGraphicsLayer, this.bombBufferGraphicsLayer, this.bombLocationGraphicsLayer];
                array.forEach(gLayers, lang.hitch(this, function (gLayer) {
                    if (gLayer) {
                        gLayer.clear();
                    }
                }));

                //Reset
                this.bombLocationIndex = 0;
                this.bombLocations.options.length = 0;
                this.optionalEvacAreas = [];
                this.hasResults = false;
                this.bombLocationList = [];
                this.pieChartDataList = [];
                this.facilitiesDataList = [];

                //Hide the results section
                this._showResultsSection(false, false, true);
                //Clear infrastructure list
                domConstruct.empty(this.facilitiesListSection);

            } catch (err) {
                console.log(err.message);
            }
        },

        /**
         * Shows appropriate components given input parameters
         * @param showPB
         * @param showBombResults
         * @param showNoResults
         * @private
         */
        _showResultsSection: function (showPB, showBombResults, showNoResults) {
            domStyle.set(this.progressBar.domNode, "display", showPB ? "block" : "none");
            domStyle.set(this.resultsBombSection, "display", showBombResults ? "block" : "none");
            domStyle.set(this.noResultsSection, "display", showNoResults ? "block" : "none");
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
         * Cleans up dijits created in this widget
         * @private
         */
        _cleanUp: function () {
            array.forEach(this.widgets, function (widget) {
                if (widget && widget.destroyRecursive) {
                    widget.destroyRecursive(false);
                }
            }, this);
            this.widgets = [];

            array.forEach(dijit.findWidgets(this.id), function (w) {
                w.destroyRecursive(false);
            });
        }
    });
    return bombThreatClass;
});