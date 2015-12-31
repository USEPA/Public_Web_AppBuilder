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
    "dojo/_base/declare",
    "dojo/on",
    "dojo/query",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/_base/html",
    "dijit/_WidgetsInTemplateMixin",
    "jimu/BaseWidget",
    "esri/tasks/datareviewer/DashboardTask",
    "esri/tasks/datareviewer/ReviewerFilters",
    "./ReviewerMapHelper",
    "esri/tasks/datareviewer/ReviewerResultsTask",
    "esri/tasks/datareviewer/DashboardResult",
    "esri/tasks/datareviewer/ReviewerLifecycle",
    "jimu/dijit/TabContainer",
    "esri/graphic",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/tasks/GeometryService",
    "esri/symbols/SimpleFillSymbol",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/geometry/Extent",
    "esri/layers/FeatureLayer",
    "esri/geometry/Polygon",
    "esri/toolbars/draw",
    "dojo/dom",
    "dojox/charting/Chart",
    "dojox/charting/plot2d/Bars",
    "dojox/charting/plot2d/Pie",
    "dojox/charting/SimpleTheme",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/action2d/MoveSlice",
    "dojo/dom-class", "dijit/Dialog",
    "dojox/charting/axis2d/Default",
    "dijit/form/RadioButton",
    "dijit/form/Select"
  ],
  function(declare, on, query, lang, array, html, _WidgetsInTemplateMixin, BaseWidget,
  DashboardTask, ReviewerFilters, ReviewerMapHelper, ReviewerResultsTask, DashboardResult,
  ReviewerLifecycle, TabContainer, Graphic, ArcGISDynamicMapServiceLayer, GeometryService,
  SimpleFillSymbol, Query, QueryTask, Extent, FeatureLayer, Polygon, Draw,
 dom, Chart, Bars, Pie, SimpleTheme, Tooltip, MoveSlice, domClass, Dialog ) {
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    baseClass: 'drs-widget-dashboard',
    name: 'Dashboard',
    charts:null,
    currentChartIndex:0,
    dashboardTask:null,
    reviewerHelper:null,
    reviewerPointLayer:null,
    reviewerLineLayer:null,
    reviewerPolygonLayer:null,
    spatialFilterLayer:null,
    reviewerResultsTask:null,
    useCurrentMapExtent:false,
    useSpatialFilter:false,
    mapSpatialFilter:null,
    esriQuery:null,
    queryTask:null,
    toolbar:null,
    otherCategoryChartColors:null,
    mapClickEvent:null,
    tabContainer:null,
    isClosed:false,
    otherDashboardResult:null,
    dashboardResult:null,
    layerDrawingOptions:null,
    selectedFieldName:null,
    selectedFieldAlias:null,
    layerUrl:null,
    chartPageLevel:0,
    postCreate: function() {
      this.inherited(arguments);
      this.charts = [];
      this.otherDashboardResult = [];
      lang.hitch(this, this._initResultsTab());
      this._createCharts = lang.hitch(this, this._createCharts);
      this.dashboardTask = new DashboardTask(this.config.drsSOEURL);
      this.reviewerResultsTask = new ReviewerResultsTask(this.config.drsSOEURL);
      this.reviewerHelper = new ReviewerMapHelper(this.config.drsSOEURL, null, null, null, null);
      //load reviewer sessions
      var sessionsDeferred = this.dashboardTask.getReviewerSessions();
      sessionsDeferred.then(lang.hitch(this, function(response) {
        var reviewerSessions = response.reviewerSessions;
        array.forEach(reviewerSessions, lang.hitch(this, function(session) {
          var option = {value: session.sessionId, label: session.toString()};
          this.sessionNameSelect.addOption(option);
        }));
        this._displayResult(null, true);
      }), lang.hitch(this, function(error){
        this._showDialog("Error", error.message);
      }));
      this.own(on(this.sessionNameSelect, 'change', lang.hitch(this, function(){
        this.chartPageLevel = 0;
        this.showHideBackButton(false);
        if(this.useCurrentMapExtent){
          var mapSelectionArea = this._getMapExtent();
          lang.hitch(this, this._displayResult(mapSelectionArea));
        }
        else{
          lang.hitch(this, this._displayResult(this.mapSpatialFilter, true));
        }
      })));
      //set up spatial filters
      this.own(on(this.currentMapExtent, 'click', lang.hitch(this, function(){
        lang.hitch(this, this.setSpatialFilters("currentMapExtentLink", "spatialFilterLink",
        "clearSpatialFilterLink", "censusBlockLink"));
        this.useSpatialFilter = false;
        this.queryTask = null;
        this.useCurrentMapExtent = true;
        var mapSelectionArea = this._getMapExtent();
        lang.hitch(this, this._displayResult(mapSelectionArea));
      })));
      this.own(on(this.clearSpatialFilter, 'click', lang.hitch(this, function(){
        lang.hitch(this, this.setSpatialFilters("clearSpatialFilterLink", "spatialFilterLink",
        "currentMapExtentLink", "censusBlockLink"));
        this.useCurrentMapExtent = false;
        this.useSpatialFilter = false;
        domClass.remove("spatialFilterLink", "current");
        this.queryTask = null;
        lang.hitch(this, this._displayResult());
      })));

      this.own(on(this.drawSpatialFilter, 'click', lang.hitch(this, function(){
        lang.hitch(this, this.setSpatialFilters("spatialFilterLink", "clearSpatialFilterLink",
        "currentMapExtentLink", "censusBlockLink"));
        this.map.graphics.clear();
        this.useCurrentMapExtent = false;
        this.queryTask = null;
        this.useSpatialFilter = true;
        this._initDraw();
      })));

      this.own(on(this.censusBlockGroup, 'click', lang.hitch(this, function(){
        lang.hitch(this, this.setSpatialFilters("censusBlockLink", "clearSpatialFilterLink",
        "currentMapExtentLink", "spatialFilterLink"));
        this.useCurrentMapExtent = false;
        this.useSpatialFilter = false;
        this.mapSpatialFilter = null;
        this.queryTask = new QueryTask(this.config.selectUrl);
        this.mapClickEvent = this.map.on("click", lang.hitch(this, this._executeQuery));
      })));
      this.own(on(this.map, 'extent-change', lang.hitch(this, function(){
        if (this.useCurrentMapExtent === true){
          var mapSelectionArea = this._getMapExtent();
          lang.hitch(this, this._displayResult(mapSelectionArea));
        }
      })));
      //if the number of categories in chart is more than the number specified
      //in the configuraiton, the back button shows up
      this.own(on(this.backButton, 'click', lang.hitch(this, function(){
        if(this.dashboardResult !== null){
          this.chartPageLevel -= 1;
          if (this.chartPageLevel === 0){
            this.showHideBackButton(false);
          }
          var chartData;
          chartData = this._createDrilledChartData();
          this._createCharts(chartData, this.layerDrawingOptions, this.selectedFieldName);
        }
      })));
    },
    setSpatialFilters:function(addClass, removeClass1, removeClass2, removeClass3){
      if (this.mapClickEvent !== null){
        this.mapClickEvent.remove();
      }
      this._clear();
      this.showHideBackButton(false);
      domClass.add(addClass, "current");
      domClass.remove(removeClass1, "current");
      domClass.remove(removeClass2, "current");
      domClass.remove(removeClass3, "current");
    },
    startup: function() {
      this.inherited(arguments);
      this.tabContainer = new TabContainer({
        tabs:[{
          title:this.nls.dashboardTab,
          content:this.resultsTabNode
        }, {
          title:this.nls.filtersTab,
          content:this.selectTabNode
        }],
        selected:this.nls.dashboardTab
      }, this.content);
      this.tabContainer.startup();
      var selectedFieldNames = this.getDashboardFieldNames();
      this._createRadioButtons(selectedFieldNames);
      if (this.config.includeGeographicFilter === "false"){
        var dynamicRows = query('.dynamicRow', this.spatialFilterList);
        if(dynamicRows !== undefined && dynamicRows !== null && dynamicRows.length > 0){
          dynamicRows[0].style.display = 'none';
        }
      }
    },
    onOpen: function(){
      if (this.mapClickEvent !== null){
        this.mapClickEvent.remove();
      }
      this.queryTask = null;
      this.showHideBackButton(false);
      this.useCurrentMapExtent = false;
      this.useSpatialFilter = false;
      domClass.add("clearSpatialFilterLink", "current");
      domClass.remove("currentMapExtentLink", "current");
      domClass.remove("spatialFilterLink", "current");
      domClass.remove("censusBlockLink", "current");
      this.sessionNameSelect.set("value", 'All');
      this._displaySpatialLayer();
      if (this.isClosed === true){
        this._displayResult(null, true);
      }
    },
    getDashboardFieldNames:function(){
      var fieldInfos = this.config.dashboardFieldNames;
      var fieldNamesFilter = [];
      if (fieldInfos.length > 0){
        array.forEach(fieldInfos, function(fieldInfo){
          if (fieldInfo.isVisible){
            fieldNamesFilter.push({fieldName:fieldInfo.dashboardFieldName, alias:fieldInfo.alias});
          }
        });
      }
      return fieldNamesFilter;
    },
    /*Add layers on map for filtering by geometry option*/
    _displaySpatialLayer : function(){
      this.layerUrl = this.dashboardTask.getReviewerMapServerUrl();
      this.spatialFilterLayer = ArcGISDynamicMapServiceLayer(this.config.selectMapUrl);
      this.map.addLayer(this.spatialFilterLayer);
      var visibleLayer = [];
      var serviceLayer = this.config.selectUrl;
      visibleLayer.push(serviceLayer.substring(serviceLayer.lastIndexOf("/") + 1,
      serviceLayer.length));
      this.spatialFilterLayer.setVisibleLayers(visibleLayer);
    },
    /*dynamically create radio button filers based on fields chosen in configuration*/
    _createRadioButtons:function(radioArray){
      //get default field Name
      var defaultField = array.filter(this.config.dashboardFieldNames, function(item){
        return item.isDefault === true ;
      });
      for(var i = 0; i < radioArray.length; i++){
        var strHtmlScript = "<li><label for='" +
        radioArray[i].fieldName + "Radio'><a href='#' id='" +
        radioArray[i].fieldName +
        "'><input type='radio' name='fieldNamesRadio' value='" +
        radioArray[i].fieldName + "'";
        if (defaultField[0].dashboardFieldName.toLowerCase() ===
        radioArray[i].fieldName.toLowerCase()){
          strHtmlScript += " checked='checked'";
        }
        strHtmlScript += "data-dojo-type='dijit/form/RadioButton' id='" + radioArray[i].fieldName +
        "Radio' class='radioButtonLabel' innerText='" + radioArray[i].alias + "'/>";
        strHtmlScript += radioArray[i].alias + "</label></a></li>";
        var domLi = html.toDom(strHtmlScript);
        html.place(domLi, this.filterList);
        on(dom.byId(radioArray[i].fieldName + "Radio"),
       "change", lang.hitch(this, this._radioChange));
        on(dom.byId(radioArray[i].fieldName), "click",
        lang.hitch(this, this._fieldNameClick));
      }
    },
    /*handler for field name change*/
    _fieldNameClick: function(event){
      var selectedLink = event.target;
      var radioSelect = dom.byId(selectedLink.id + "Radio");
      if (radioSelect !== undefined && radioSelect !== null){
        radioSelect.checked = true;
        this._radioChange();
      }
    },
    /*handler for radio button option change*/
    _radioChange:function(){
      this.chartPageLevel = 0;
      this.showHideBackButton(false);
      var mapSelectionArea;
      if(this.useCurrentMapExtent){
        mapSelectionArea = this._getMapExtent();
      }
      else if (this.useCurrentMapExtent === false){
        mapSelectionArea = this.mapSpatialFilter;
      }
      lang.hitch(this, this._displayResult(mapSelectionArea, true));
    },
    /*initialize results tab which displays the charts*/
    _initResultsTab:function(){
      this.own(on(this.pagingUl, 'click', lang.hitch(this, function(event){
          var target = event.target || event.srcElement;
          var tagName = target.tagName.toLowerCase();
          if(tagName === 'a'){
            var as = query('a', this.pagingUl);
            var index = array.indexOf(as, target);
            if(index >= 0){
              this.currentChartIndex = index;
              this._showChart(index);
            }
          }
        })));
    },
    /*initialize draw toolbar for draw result selection area on the map*/
    _initDraw:function(){
      this.toolbar = new Draw(this.map);
      this.toolbar.activate(Draw.POLYGON);
      this.toolbar.on("draw-end", lang.hitch(this, function(graphic){
        this._clear();
        var symbol = new SimpleFillSymbol();
        var mapGraphic = new Graphic(graphic.geometry, symbol);
        this.map.graphics.add(mapGraphic);
        this.mapSpatialFilter = graphic.geometry;
        this._displayResult(this.mapSpatialFilter);
      }));
    },
    /*handle the map click event for filter by geometry spatial filter*/
    _executeQuery: function(evt){
      var qGeom, point;
      var esriQuery = new Query();
      esriQuery.returnGeometry = true;
      point = evt.mapPoint;
      qGeom = new Extent({
        "xmin": point.x,
        "ymin": point.y,
        "xmax": point.x,
        "ymax": point.y,
        "spatialReference": point.spatialReference
      });
      esriQuery.geometry = qGeom;
      this.queryTask.execute(esriQuery, lang.hitch(this, this._handleQueryResults));
    },
    /*get results based on map click, add it to map,
      do a union if there are more than one features,
      and display chart
    */
    _handleQueryResults: function(result){
      var geom = [];
      var censusBlock = result.features;
      var geomService = new GeometryService(this.config.geometryServiceURL);
      var graphics = this.map.graphics.graphics;
      array.forEach(censusBlock, lang.hitch(this, function(feat) {
        feat.setSymbol(new SimpleFillSymbol());
        if (graphics.length === 0){
          this.map.graphics.add(feat);
        }
        else{
          var duplicateGraphic = false;
          array.forEach(graphics, lang.hitch(this, function(graphic){
            var featureCenter = feat.geometry.getExtent().getCenter().x;
            if (graphic.geometry.getExtent().getCenter().x === featureCenter){
              duplicateGraphic = true;
              feat = graphic;
            }
          }));
          if (!duplicateGraphic){
            this.map.graphics.add(feat);
          }
          else{
            this.map.graphics.remove(feat);
          }
        }
      }));
      graphics = this.map.graphics;
      array.forEach(graphics.graphics, lang.hitch(this, function(graphic){
        geom.push(graphic.geometry);
      }));
      if (geom.length > 1){
        geomService.union(geom, lang.hitch(this, function(geometry){
          this.mapSpatialFilter = geometry;
          this._updateChart(geometry);
        }), lang.hitch(this, function(error){
          this._showDialog("Error", error.message);
        }));
      }
      else{
        this.mapSpatialFilter = geom[0];
        this._updateChart(geom[0]);
      }
    },
    /* Get map extent for filter by curret map extent filter */
    _getMapExtent:function(){
      var currentMapExtent = this.map.extent;
      var polygon = new Polygon(currentMapExtent.spatialReference);
      var xmin = currentMapExtent.xmin;
      var xmax = currentMapExtent.xmax;
      var ymin = currentMapExtent.ymin;
      var ymax = currentMapExtent.ymax;
      polygon.addRing([[xmin, ymin], [xmin, ymax], [xmax, ymax], [xmax, ymin], [xmin, ymin]]);
      return polygon;
    },
    /* Handler for creating attribute filters and spatial filter in case a session is chosen
    from the session listbox. Makes a call to create charts based on options chosen by user.
    Geometry filters are passed to displayResults function to only update the charts and not
    the map*/
    _displayResult: function(geometry, changeLayerDrawingOption){
      html.setStyle(this.resultsSection, 'display', 'block');
      this.tabContainer.selectTab(this.nls.dashboardTab);
      var fieldName = "", fieldNameAlias;
      query('[name=\"fieldNamesRadio\"]').forEach(lang.hitch(this, function(radio){
        if(radio.checked){
          fieldName = radio.value;
          fieldNameAlias = radio.getAttribute("innerText");
        }
      }));
      if (fieldName === ""){
        return;
      }
      this.selectedFieldName = fieldName;
      this.selectedFieldAlias = fieldNameAlias;
      var sessionID = this.sessionNameSelect.get('value');
      var deferred;
      var reviewerFilters = new ReviewerFilters();
      if (sessionID !== "All"){
        reviewerFilters.addAttributeFilter("SESSIONID", parseInt(sessionID, 10));
      }
      if (reviewerFilters.getCount() >= 1){
        deferred = this.dashboardTask.getDashboardResults(fieldName.toLowerCase() ===
        this.nls.phaseFieldName.toLowerCase()?
        this.nls.statusFieldName:fieldName, reviewerFilters);
      }
      else{
        deferred = this.dashboardTask.getDashboardResults(fieldName.toLowerCase() ===
        this.nls.phaseFieldName.toLowerCase()?
        this.nls.statusFieldName : fieldName);
      }
      deferred.then(lang.hitch(this, function(response) {
        if (fieldName.toLowerCase() === this.nls.phaseFieldName.toLowerCase()){
          this.dashboardResult = this.getLifecyclePhaseresult(response.dashboardResult);
        }
        else{
          this.dashboardResult = response.dashboardResult;
        }
        var def;
        def = this.reviewerHelper.getLayerDrawingOptions(this.dashboardResult, null, null);
        def.then(lang.hitch(this, function(args){
          //var result=response.dashboardResult;
          var result = this.dashboardResult;
          if (result.fieldValues.length > 0){
            if (geometry && changeLayerDrawingOption){
              this._updateChart(geometry, args.layerDrawingOptions);
            }
            else if(geometry && (changeLayerDrawingOption === null ||
              changeLayerDrawingOption === undefined)){
              this._updateChart(geometry, this.layerDrawingOptions);
            }
            else if(geometry === undefined && changeLayerDrawingOption === undefined){
              this._updateChart(null, this.layerDrawingOptions);
            }
            else{
              this.layerDrawingOptions = args.layerDrawingOptions;
              this._createCharts(result, args.layerDrawingOptions, fieldName);
            }
            if (changeLayerDrawingOption){
              if (result === null || result.filters === null || result.filters.getCount() === 0){
                this._applyUniqueValueRenderer(args.layerDrawingOptions.layerDrawingOptionsArray);
                this.layerDrawingOptions = args.layerDrawingOptions;
              }
              else{
                var deferredRevTask = this.reviewerResultsTask.getLayerDefinition(result.filters);
                deferredRevTask.then(lang.hitch(this, function (response) {
                  this._applyUniqueValueRenderer(args.layerDrawingOptions.layerDrawingOptionsArray,
                  response.whereClause);
                  this.layerDrawingOptions = args.layerDrawingOptions;
                }), lang.hitch(this, function(error){
                  this._showDialog("Error", error.message);
                }));
              }
            }
          }
          else{
            this._clearCharts();
            this.chartTitle.innerHTML = this.nls.noResults;
          }
        }), lang.hitch(this, function(error){
          this._showDialog("Error", error.message);
        }));
      }), lang.hitch(this, function(error){
        this._showDialog("Error", error.message);
      }));
    },
    /* Apply unique value renderer to reviewer layers based on result from dashboard results*/
    _applyUniqueValueRenderer: function(layerDrawingOptionsArray, whereClause){
      var graphiclsLayerIds = this.map.graphicsLayerIds;
      var layer = [];
      for(var j = 0; j < graphiclsLayerIds.length; j++) {
        var layerName = this.map.graphicsLayerIds[j];
        if (layerName === "reviewerPointLayer" ||
        layerName === "reviewerLineLayer" ||
        layerName === "reviewerPolygonLayer"){
          layer.push(this.map.getLayer(layerName)) ;
        }
      }
      for(j = 0; j < layer.length; j++){
        this.map.removeLayer(layer[j]);
      }
      this.reviewerPointLayer = new FeatureLayer(this.layerUrl + "/0", {
        id: "reviewerPointLayer",
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*" ]
      });

      this.reviewerLineLayer = new FeatureLayer(this.layerUrl + "/1", {
        id: "reviewerLineLayer",
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*" ]
      });

      this.reviewerPolygonLayer = new FeatureLayer(this.layerUrl + "/2", {
        id: "reviewerPolygonLayer",
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*" ]
      });
      if (layerDrawingOptionsArray !== "undefined" && layerDrawingOptionsArray.length === 3){
        this.reviewerPointLayer.setRenderer(layerDrawingOptionsArray[0].renderer);
        this.reviewerLineLayer.setRenderer(layerDrawingOptionsArray[1].renderer);
        this.reviewerPolygonLayer.setRenderer(layerDrawingOptionsArray[2].renderer);
      }
      if (whereClause){
        this.reviewerPointLayer.setDefinitionExpression(whereClause);
        this.reviewerLineLayer.setDefinitionExpression(whereClause);
        this.reviewerPolygonLayer.setDefinitionExpression(whereClause);
      }
      this.map.addLayer(this.reviewerPointLayer);
      this.map.addLayer(this.reviewerLineLayer);
      this.map.addLayer(this.reviewerPolygonLayer);
    },
    /*Update chart based on spatial filters chosen on the map*/
    _updateChart:function(geometry, layerDrawingOptions){
      html.setStyle(this.resultsSection, 'display', 'block');
      this.tabContainer.selectTab(this.nls.dashboardTab);
      var reviewerFilters = new ReviewerFilters();
      var sessionID = this.sessionNameSelect.get('value');
      var chartDeferred;
      if (sessionID !== "All"){
        reviewerFilters.addAttributeFilter("SESSIONID", parseInt(sessionID, 10));
      }
      if (geometry){
        reviewerFilters.addSpatialFilter(geometry);
      }
      if (reviewerFilters.getCount() >= 1){
        chartDeferred = this.dashboardTask.getDashboardResults(
        this.selectedFieldName.toLowerCase() === this.nls.phaseFieldName.toLowerCase()?
        this.nls.statusFieldName : this.selectedFieldName,
        reviewerFilters);
      }
      else{
        chartDeferred = this.dashboardTask.getDashboardResults(
        this.selectedFieldName.toLowerCase() === this.nls.phaseFieldName.toLowerCase() ?
        this.nls.statusFieldName : this.selectedFieldName);
      }
      chartDeferred.then(lang.hitch(this, function(response) {
        if (this.selectedFieldName.toLowerCase() === this.nls.phaseFieldName.toLowerCase()){
          this.dashboardResult = this.getLifecyclePhaseresult(response.dashboardResult);
        }
        else{
          this.dashboardResult = response.dashboardResult;
        }
        if (this.dashboardResult.fieldValues.length > 0){
          if (layerDrawingOptions){
            this.layerDrawingOptions = layerDrawingOptions;
            this._createCharts(this.dashboardResult, layerDrawingOptions,
            this.selectedFieldName);
          }
          else{
            this._createCharts(this.dashboardResult,
            this.layerDrawingOptions, this.selectedFieldName);
          }
        }
        else{
          this._clearCharts();
          this.chartTitle.innerHTML = this.nls.noResults;
        }
      }), lang.hitch(this, function (error){
        this._showDialog("Error", error.message);
      }));
    },
    /*Clear any previous charts and display the chart based on filters chosen*/
    _createCharts:function(dashboardResult, layerDrawingOptions, fieldName){
      this._clearCharts(fieldName);
      var w = '280px';
      var h = '210px;';
      var series = [];
      var chartDisplayText, chartColor;
      var resultOtherCategory;
      resultOtherCategory = this._createOtherCategory(dashboardResult);
      array.forEach(resultOtherCategory.fieldValues, lang.hitch(this, function(item) {
        if(resultOtherCategory.fieldName.toLowerCase() === this.nls.statusFieldName.toLowerCase() &&
        item !== this.nls.OtherCategory){
          chartDisplayText = ReviewerLifecycle.toLifecycleStatusString(item);
        }
        else if (resultOtherCategory.fieldName.toLowerCase() ===
        this.nls.phaseFieldName.toLowerCase()){
          chartDisplayText = ReviewerLifecycle.toLifecyclePhaseString(parseInt(item, 10));
        }
        else{
          chartDisplayText = item;
        }
        if (layerDrawingOptions.colorMap && chartDisplayText !== this.nls.OtherCategory){
          chartColor = layerDrawingOptions.colorMap[item].toHex();
        }
        if (chartDisplayText === this.nls.OtherCategory){
          chartColor = '#000000';
        }
        series.push({
          text : resultOtherCategory.getCount(item),
          y : resultOtherCategory.getCount(item),
          name:item.toString(),
          tooltip:  chartDisplayText + ": " + resultOtherCategory.getCount(item),
          color: chartColor
        });
      }));
      var pieChartMedia = {
        chartField : dashboardResult.fieldName,
        description : "",
        title : fieldName,
        type : "pieChart"
      };
      var chartDivPieChart = html.create('div', {
        'class':'chart-div',
        id : 'pieChart',
        style:{width:w, height:h}},
        this.chartContainer);
      var pieChart = this._createPieChart(chartDivPieChart, pieChartMedia, series);
      pieChart.media = pieChartMedia;
      this.charts.push(pieChart);
      html.setStyle(chartDivPieChart, 'display', 'none');
      var chartDivBarChart = html.create('div', {
        'class':'chart-div',
        style:{width:'320px', height:h}},
        this.chartContainer);
      var barChartMedia = {
        chartField:dashboardResult.fieldName,
        description:"",
        title:fieldName,
        type:"barsChart"
      };
      var barChart = this._creatBarsChart(chartDivBarChart, series);
      barChart.media = barChartMedia ;
      this.charts.push(barChart);
      html.setStyle(chartDivBarChart, 'display', 'none');
      var chartCount = this.charts.length;
      for(var i = 0; i < chartCount; i++){
        var strLi = "<li><a title='" + this.charts[i].media.type + "'></a></li>";
        var domLi = html.toDom(strLi);
        html.place(domLi, this.pagingUl);
      }
      this._showChart(this.currentChartIndex);
    },
    /*Set the visibility of the charts*/
    _showChart:function(index){
      this.chartTitle.innerHTML = "";
      var chartDivs = query('.chart-div', this.chartContainer);
      chartDivs.style({display:'none'});
      var lis = query("li", this.pagingUl);
      lis.removeClass('selected');
      if(index < 0){
        return;
      }
      var chartDiv = chartDivs[index];
      if(chartDiv){
        this.currentChartIndex = index;
        html.setStyle(chartDiv, {display:'block'});
      }
      this.chartTitle.innerHTML = this.nls.resultsBy + this.selectedFieldAlias;
      this.chartTitle.title = this.nls.resultsBy + this.selectedFieldAlias;
      var li = lis[index];
      if(li){
        html.addClass(li, 'selected');
      }
    },
    /*Create bar chart*/
    _creatBarsChart: function(chartDiv, series) {
      var barsChart = new Chart(chartDiv);
      var yaxisLabels = [];
      array.forEach(series, function(value){
        yaxisLabels.push(value.name);
      });
      barsChart.addPlot('default', {
        type: Bars,
        enableCache: true,
        markers: true,
        minBarSize: 1,
        maxBarSize: 15,
        label:false
      });
      barsChart.addAxis("x", {
      fixLower: "minor",
      fixUpper: "minor",
      natural: true,
      includeZero: true });
      barsChart.addAxis("y", { vertical: true,
       includeZero: true,
       fixLower: "minor", fixUpper: "micro", natural: true,
       labels:array.map(yaxisLabels, function(value, index){
         return {value: index + 1, text: value};
       }),
        maxLabelSize: 40
      });
      var barsTheme =  new SimpleTheme();
      barsTheme.plotarea.fill = "transparent";
      barsTheme.chart.fill = "transparent";
      barsChart.setTheme(barsTheme);
      barsChart.addSeries("default", series, {
        stroke: {
          color: "#FFFFFF"
        },
        fill: "#1f77b4"
      });
      new Tooltip(barsChart, "default");
      barsChart.connectToPlot("default", lang.hitch(this, function(args) {
        if(args.type === "onclick") {
          if(args.run.chart.series[0].data[args.index].name === this.nls.OtherCategory){
            this.chartPageLevel += 1;
            this._createCharts(this.otherDashboardResult,
            this.layerDrawingOptions, this.selectedFieldName);
            this.showHideBackButton(true);
          }
        }
      }));
      barsChart.render();
      return barsChart;
    },
    /* Create Pie chart*/
    _createPieChart: function(chartDiv, media, series) {
      var pieChart = new Chart(chartDiv);
      pieChart.addPlot('default', {
        type: Pie,
        stroke:{
          color: "white"
        },
        radius: 80,
        min:10,
        labelStyle: "default",
        htmlLabels: true,
        majorLabels: true,
        labelOffset: -15
      });
      var pieTheme =  new SimpleTheme();
      pieTheme.plotarea.fill = "transparent";
      pieTheme.chart.fill = "transparent";
      pieChart.setTheme(pieTheme);
      pieChart.addSeries(media.title, series);
      new Tooltip(pieChart, "default");
      new MoveSlice(pieChart, "default");
      pieChart.render();
      pieChart.connectToPlot("default", lang.hitch(this, function(args) {
        if(args.type === "onclick") {
          if(args.run.chart.series[0].data[args.index].name === this.nls.OtherCategory){
            this.chartPageLevel += 1;
            this._createCharts(this.otherDashboardResult,
            this.layerDrawingOptions, this.selectedFieldName);
            this.showHideBackButton(true);
          }
        }
      }));
      return pieChart;
    },
    /* Creates a dashboard result of lifecycle phases.
    */
    getLifecyclePhaseresult:function (result){
      var lifecyclePhases = new DashboardResult();
      lifecyclePhases.fieldName = this.nls.phaseFieldName;
      var indexReviewed = -1;
      var indexCorrected = -1;
      var indexVerified = -1;
      array.forEach(result.fieldValues, lang.hitch(this, function(fieldValue, i){
        var phase = ReviewerLifecycle.getCurrentLifecyclePhase(parseInt(fieldValue, 10));
        if (phase === this.nls.reviewed){
          if(indexReviewed === -1){
            indexReviewed = lifecyclePhases.fieldValues.push(parseInt(2, 10)) - 1;
          }
          if(lifecyclePhases.counts.length > indexReviewed){
            lifecyclePhases.counts[indexReviewed] += result.counts[i];
          }
          else{
            indexReviewed = lifecyclePhases.counts.push(result.counts[i]) - 1;
          }
        }
        else if (phase === this.nls.corrected){
          if( indexCorrected === -1){
            indexCorrected = lifecyclePhases.fieldValues.push(parseInt(4, 10)) - 1;
          }
          if(lifecyclePhases.counts.length > indexCorrected){
            lifecyclePhases.counts[indexCorrected] += result.counts[i];
          }
          else{
            indexCorrected = lifecyclePhases.counts.push(result.counts[i]) - 1;
          }
        }
        else if (phase === this.nls.verified){
          if(indexVerified === -1 ){
            indexVerified = lifecyclePhases.fieldValues.push(parseInt(6, 10)) - 1;
          }
          if(lifecyclePhases.counts.length > indexVerified){
            lifecyclePhases.counts[indexVerified] += result.counts[i];
          }
          else{
            indexVerified = lifecyclePhases.counts.push(result.counts[i]) - 1;
          }
        }
      }));
      var sessionID = this.sessionNameSelect.get('value');
      var reviewerFilters = new ReviewerFilters();
      if (sessionID !== "All"){
        reviewerFilters.addAttributeFilter("SESSIONID", parseInt(sessionID, 10));
      }
      lifecyclePhases.filters = reviewerFilters;
      return lifecyclePhases;
    },
    /*This function creates an other category based on the number of slices
    defined in the widget configuration */
    _createOtherCategory: function(result){
      var resultCount = {};
      var otherCategoryCount = 0;
      var otherCategoryFieldvalues = [], otherCategoryCounts = [];
      var newResult = new DashboardResult();
      this.otherDashboardResult = new DashboardResult();
      this.otherDashboardResult.fieldName = result.fieldName;
      if (result.fieldValues.length > this.config.numberChartSections){
        array.forEach(result.fieldValues, lang.hitch(this, function(fieldValue, i){
          resultCount[result.fieldValues[i]] = result.getCount(fieldValue);
        }));
        var resultSortedOrder = [];
        for (var counts in resultCount){
          resultSortedOrder.push([counts, resultCount[counts]]);
        }
        resultSortedOrder.sort(function(a, b) {return b[1] - a[1];});
        for (var i = 0; i < resultSortedOrder.length; i++){
          if (i < this.config.numberChartSections){
            newResult.fieldValues.push(resultSortedOrder[i][0]) ;
            newResult.counts.push(resultSortedOrder[i][1]);
          }
          else{
            otherCategoryCount += resultSortedOrder[i][1];
            otherCategoryFieldvalues.push(resultSortedOrder[i][0]);
            otherCategoryCounts.push(resultSortedOrder[i][1]);
            this.otherDashboardResult.fieldValues.push(resultSortedOrder[i][0]);
            this.otherDashboardResult.counts.push(resultSortedOrder[i][1]);
          }
        }
        newResult.fieldValues.push(this.nls.OtherCategory);
        newResult.counts.push(otherCategoryCount);
        newResult.fieldName = result.fieldName;
        return newResult;
      }
      else{
        return result;
      }
    },
    /*Handles the drill down of pie chart and barschart.*/
    _createDrilledChartData:function(){
      var drilledResult = new DashboardResult();
      var resultCount = {};
      var startingRecord;
      array.forEach(this.dashboardResult.fieldValues,
        lang.hitch(this, function(fieldValue, i){
          resultCount[this.dashboardResult.fieldValues[i]] =
            this.dashboardResult.getCount(fieldValue);
        }));
      var resultSortedOrder = [];
      for (var counts in resultCount){
        resultSortedOrder.push([counts, resultCount[counts]]);
      }
      resultSortedOrder.sort(function(a, b) {
        return b[1] - a[1];});
      if (this.chartPageLevel === 0){
        drilledResult = this.dashboardResult;
      }
      else{
        startingRecord = ((this.chartPageLevel) * this.config.numberChartSections);
      }
      for (var i = parseInt(startingRecord, 10);i < resultSortedOrder.length; i++){
        drilledResult.fieldValues.push(resultSortedOrder[i][0]);
        drilledResult.counts.push(resultSortedOrder[i][1]);
      }
      return drilledResult;
    },
    /*Manages the visibility of the back button*/
    showHideBackButton:function(bShowHide){
      var backButton = query(this.backButtonContainer);
      if (bShowHide){
        backButton.style({'display':'block'});
      }
      else{
        backButton.style({'display':'none'});
      }
    },
    /*Opens a dialog to display messages to the user*/
    _showDialog : function(title, message){
      var messageDialog = new Dialog({
        title: title,
        style: "width: 200px"
      });
      messageDialog.set("content", message);
      messageDialog.show();
    },
    /*clear charts*/
    _clearCharts:function(){
      this.chartTitle.innerHTML = "";
      var chartDivs = query('.chart-div', this.chartContainer);
      chartDivs.style({display:'none'});
      var lis = query("li", this.pagingUl);
      lis.removeClass('selected');
      for(var i = 0;i < this.charts.length;i++){
        var chart = this.charts[i];
        if(chart){
          chart.destroy();
        }
      }
      this.charts = [];
      html.empty(this.pagingUl);
      html.empty(this.chartContainer);
      html.setStyle(this.resultsSection, 'display', 'block');
    },
    /*clean up of the widget and map*/
    _clear:function(){
      if (this.toolbar !== null){
        this.toolbar.deactivate();
      }
      this.mapSpatialFilter = null;
      this.map.graphics.clear();
    },
    /*Executes when the widgets is closed*/
    onClose: function(){
      var graphiclsLayerIds = this.map.graphicsLayerIds;
      var layer = [];
      for(var j = 0; j < graphiclsLayerIds.length; j++) {
        var layerName = this.map.graphicsLayerIds[j];
        if (layerName === "reviewerPointLayer" ||
        layerName === "reviewerLineLayer" ||
        layerName === "reviewerPolygonLayer"){
          layer.push(this.map.getLayer(layerName)) ;
        }
      }
      for(j = 0; j < layer.length; j++){
        this.map.removeLayer(layer[j]);
      }
      this._clear();
      this._clearCharts();
      this.map.removeLayer(this.spatialFilterLayer);
      this.isClosed = true;
    }
  });
});