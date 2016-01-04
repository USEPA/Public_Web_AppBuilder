///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
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
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/string',
  'dojo/dom-construct',
  'dojo/dom-style',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/query',
  'dojo/i18n!esri/nls/jsapi',
  'esri/main',
  'esri/layers/FeatureLayer',
  'esri/toolbars/draw',
  'esri/tasks/IdentifyTask',
  'esri/tasks/query',
  'esri/tasks/IdentifyParameters',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/SimpleFillSymbol',
  'esri/geometry/Extent',
  'esri/tasks/datareviewer/ReviewerResultsTask',
  './InfoWindowContent',
  'dojo/text!./SelectFeatureDialog.html'
], function(
  declare, array, lang, on, string, domConstruct, domStyle,
  _WidgetBase, _TemplatedMixin, query, esriBundle, esri, FeatureLayer, Draw,
  IdentifyTask, Query, IdentifyParameters, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
  Extent, ReviewerResultsTask,
  InfoWindowContent,
  template
) {
  var symbolPoint = new SimpleMarkerSymbol({
    "type": "esriSMS",
    "style": "esriSMSCircle",
    "size": 12,
    "xoffset": 0,
    "yoffset": 0,
    "color": [0, 0, 255, 51],
    "outline": {
      "type": "esriSLS",
      "style": "esriSLSSolid",
      "color": [0, 0, 255, 128],
      "width": 1
    }
  });
  var symbolLine = new SimpleLineSymbol({
    "type": "esriSLS",
    "style": "esriSLSSolid",
    "color": [0, 0, 255, 51],
    "width": 2
  });
  var symbolPolygon = new SimpleFillSymbol({
    "type": "esriSFS",
    "style": "esriSFSSolid",
    "color": [0, 0, 255, 26],
    "outline": {
      "type": "esriSLS",
      "style": "esriSLSSolid",
      "color": [0, 0, 255, 128],
      "width": 1
    }
  });

  return declare([_WidgetBase, _TemplatedMixin], {
    templateString: template,
    baseClass: 'drs-widget-selectFeature',

    buildRendering: function() {
      this.inherited(arguments);
      this._initDom();
    },

    // populate layer options list
    _initDom: function() {
      var html = this.getLayerOptions();
      if (html !== undefined  && html !== ""){
        domConstruct.place(html, this.selectLayer);
      }
    },

    // wire up events
    postCreate: function() {
      this.inherited(arguments);
      this._initEvents();

    },

    // wire up events
    _initEvents: function() {
      var _this = this;
      this.selectionToolbar = new Draw(this.map);
      this.selectionToolbar.on("draw-end", lang.hitch(this, this.addGraphic));
      this.own(on(this.selectLayer, 'change', function(e) {
        esriBundle.toolbars.draw.addPoint = _this.nls.selectFeatureMapPoint;
        var val = e.target.value;
        if (val) {
          _this.startSelectFeature(val);
        } else {
          _this.cancelSelectFeature();
        }
      }));

      this.own(on(this.map.infoWindow, 'hide', function() {
        var zoomNode = query('.actionsPane');
        if(zoomNode !== undefined && zoomNode !== null && zoomNode.length > 0){
          zoomNode[0].style.display = '';
        }
        _this.emit('InfoWindowHide');
      }));

    },

    // get map layer
    // init identify task
    // if already listenting for map click, stop
    // do identify on map click
    // and show instructions
    startSelectFeature: function(layerId) {
      var mapLayer;
      var layer = array.filter(this.config.layers, function(layer){
        return layer.id === layerId;
      });
      if (layer !== undefined && layer.length > 0){
        mapLayer = this.map.getLayer(layerId);
        if (mapLayer === undefined){
          this.emit('Error', {}, [this.nls.errorMapService]);
          return;
        }
      }
      this.selectionToolbar.activate(Draw.POINT);
      domStyle.set(this.clickAFeatureNode, 'display', '');
    },
    addGraphic : function (evt){
      var layerId = this.selectLayer.value;
      var layer = array.filter(this.config.layers, function(layer){
        return layer.id === layerId;
      });
      var geometry = evt.geometry;
      if (layer[0].layerType === "ArcGISMapServiceLayer"){
        this.identifyTask = new IdentifyTask(layer[0].url);
        this._identifyFeatures(geometry);
      }
      else{
        if (this.featureLayer !== null && this.featureLayer !== undefined){
          this.featureLayer = null;
        }
        this.featureLayer = new FeatureLayer(layer[0].url, {outFields: ["*"],
        mode: esri.layers.FeatureLayer.MODE_SELECTION});
        var selectQuery = new Query();
        var pixelWidth = this.map.extent.getWidth() / this.map.width;
        var toleranceInMapCoords = 10 * pixelWidth;
        var extent = new Extent(geometry.x - toleranceInMapCoords,
                            geometry.y - toleranceInMapCoords,
                            geometry.x + toleranceInMapCoords,
                            geometry.y + toleranceInMapCoords,
                            this.map.spatialReference);
        selectQuery.geometry = extent;
        this.featureLayer.selectFeatures(selectQuery,
        FeatureLayer.SELECTION_NEW, lang.hitch(this, function(features){
          if (features.length > 1){
            this.emit(this.nls.popupMessage, {}, [this.nls.manyFeaturesSelected]);
          }
          else if(features.length === 1){
            this.selectionToolbar.deactivate();
            this._onTaskComplete(features[0]);
          }
          else{
            this.emit(this.nls.popupMessage, {}, [this.nls.noFeatureSelected]);
          }
        }));
      }
    },
    // if already listenting for map click, stop
    // hide instructions
    cancelSelectFeature: function() {
      if (this.selectionToolbar !== null &&
      this.selectionToolbar !== undefined && this.selectLayer.value === ""){
        this.selectionToolbar.deactivate();
      }
      domStyle.set(this.clickAFeatureNode, 'display', 'none');
    },

    // block subsequent identify requests
    // show loading message
    // identify features at the point
    _identifyFeatures: function(mapPoint) {
      var _this = this;
      var identifyParams = new IdentifyParameters();
      if (this.identifying) {
        return;
      }
      this.identifying = true;
      domStyle.set(this.loadingFeaturesNode, 'display', '');
      identifyParams.returnGeometry = true;
      identifyParams.width = this.map.width;
      identifyParams.height = this.map.height;
      identifyParams.tolerance = 3;
      identifyParams.geometry = mapPoint;
      identifyParams.mapExtent = this.map.extent;
      identifyParams.spatialReference = this.map.spatialReference;
      this.identifyTask.execute(identifyParams).then(function(results) {
        if (results.length > 0 ){
          _this.selectionToolbar.deactivate();
          _this._onTaskComplete(results[0].feature);
        }
        else{
          domStyle.set(_this.loadingFeaturesNode, 'display', 'none');
          _this.identifying = false;
          this.emit(this.nls.popupMessage, {}, [this.nls.noFeatureSelected]);
        }
      }, function(err) {
        _this._onIdentifyError(err);
      });
    },

    // allow subsequent identify requests
    // hide loading message
    // get first feature (if any) and
    // zoom map to feature
    // open report selected feature dialog
    // notify main dialog that a feature was selected
    _onTaskComplete: function (resultGraphic) {
      var _this = this;
      var def;
      var point;
      this.identifying = false;
      domStyle.set(this.loadingFeaturesNode, 'display', 'none');
      if (!resultGraphic ) {
        return;
      }
      var layerId = this.selectLayer.value;
      var layer = array.filter(this.config.layers, function(layer){
        return layer.id === layerId;
      });
      this._selectedFeature = resultGraphic;
      switch (resultGraphic.geometry.type) {
        case 'point':
          resultGraphic.setSymbol(symbolPoint);
          point = resultGraphic.geometry;
          def = this.map.centerAt(resultGraphic.geometry);
          break;
        case 'polyline':
          resultGraphic.setSymbol(symbolLine);
          point = resultGraphic.geometry.getExtent().getCenter();
          resultGraphic.setSymbol(symbolLine);
          def = this.map.centerAt(point);
          break;
        case 'polygon':
          resultGraphic.setSymbol(symbolPolygon);
          point = resultGraphic.geometry.getCentroid();
          def = this.map.centerAt(point);
          break;
      }
      // this.map.graphics.add(resultGraphic);
      def.then(function() {
        _this._showInfoWindow(layer[0].alias, point, resultGraphic);
      });
    },
    // open popup to report selected feature
    _showInfoWindow: function(layerName, point, resultGraphic) {
      var _this = this;
      this.infoWindowContent = new InfoWindowContent({
        nls: this.nls,
        title : this.nls.select,
        includeReportedBy: this.config.includeReportedBy,
        defaultUserName : this.config.defaultUserName,
        onReportSubmit: function(reviewerAttributes) {
          _this.submitReport(reviewerAttributes);
        }
      }, domConstruct.create('div'));

      this.map.infoWindow.setTitle(this.nls.infoWindowTitle);
      this.infoWindowContent.startup();
      this.infoWindowContent.set('layerName', layerName);
      this.infoWindowContent.set('graphic', resultGraphic);
      on.once(this.map.infoWindow, 'hide', function() {
        _this.selectionToolbar.activate(Draw.POINT);
        _this.map.setInfoWindowOnClick(false);
      });
      this.map.infoWindow.destroyDijits();
      query('.actionsPane')[0].style.display = 'none';
      this.map.infoWindow.setContent(this.infoWindowContent.domNode);
      this.map.infoWindow.resize(300, 600);
      this.map.infoWindow.show(point);
      this.emit('SelectFeature');
    },

    // allow subsequent identify requests
    // hide loading message
    // show error
    _onIdentifyError: function(err) {
      this.identifying = false;
      domStyle.set(this.loadingFeaturesNode, 'display', 'none');
      this.emit(this.nls.popupError, {}, [this.nls.errorIdentify, err]);
    },

    // Write selected feature as a Data Reviewer result
    // using ReviewerAttributes from event
    submitReport: function(reviewerAttributes) {
      var _this = this;
      reviewerAttributes.sessionId = this._sessionId;
      this.map.infoWindow.hide();
      this._reviewerResultsTask.writeFeatureAsResult(reviewerAttributes,
      this._selectedFeature).then(function(result, token) {
        _this._onWriteFeatureAsResultComplete(result, token);
      }, function(err) {
        _this._onWriteFeatureAsResultError(err);
      });
    },

    // Show message on completion of writeFeatureAsResult
    _onWriteFeatureAsResultComplete: function(result) {
      if (result && result.success) {
        this.emit(this.nls.popupMessage, {}, ['', this.nls.reportMessage]);
        this.selectionToolbar.activate(Draw.POINT);
      } else {
        this.emit(this.nls.popupError, {} [this.nls.errorReportMessage]);
      }
    },

    // Show error message if writeFeatureAsResult fails
    _onWriteFeatureAsResultError: function(err) {
      this.selectionToolbar.activate(Draw.POINT);
      this.emit(this.nls.popupError, {}, [err.message, err]);
    },

    // reset form
    reset: function() {
      this.selectLayer.selectedIndex = 0;
      this.cancelSelectFeature();
      if (this.infoWindowContent !== undefined && this.infoWindowContent !== null){
        this.infoWindowContent.destroyRecursive();
      }
      this.map.setInfoWindowOnClick(false);
    },
    // Set Data Reviewer Server url,
    // required for ReviewerResultsTask.
    setDrsUrl: function(drsUrl) {
      this._reviewerResultsTask = new ReviewerResultsTask(drsUrl);
    },

    // Set Data Reviewer session results will be written to.
    setReviewerSession: function(sessionId) {
      if (!isNaN(sessionId)) {
        this._sessionId = parseInt(sessionId, 10);
      } else {
        this._sessionId = 1; // default
      }
    },

    // read layers from config into
    // a document fragment consisting of options
    getLayerOptions: function() {
      var html = '';
      array.forEach(this.config.layers, function(layer) {
        if (layer.show === true){
          html = html  + string.substitute('<option value="${id}">${alias}</option>', layer);
        }
      });
      return html;
    }
  });
});