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
  'dojo/on',
  'dojo/string',
  'dojo/dom-construct',
  'dojo/dom-style',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/query',
  'dojo/i18n!esri/nls/jsapi',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/SimpleFillSymbol',
  'esri/geometry/Polygon',
  'esri/tasks/datareviewer/ReviewerResultsTask',
  './InfoWindowContent',
  'dojo/text!./DrawErrorDialog.html'
], function(
  declare, array, on, string, domConstruct, domStyle,
  _WidgetBase, _TemplatedMixin, query, esriBundle,
  SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Polygon,
  ReviewerResultsTask, InfoWindowContent, template
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
    baseClass: 'drs-draw-error-dialog',

    buildRendering: function() {
      this.inherited(arguments);
      this._initDom();
    },

    // populate layer options list
    _initDom: function() {
      var html = this.getLayerOptions();
      if (html !== undefined && html !== ""){
        domConstruct.place(html, this.selectLayer);
      }
    },

    // custom setters/getters
    _setDrawBoxAttr: function(newDrawBox) {
      this.setDrawBox(newDrawBox);
    },

    setDrawBox: function(newDrawBox) {
      this.drawBox = newDrawBox;
      this.drawBox.placeAt(this.drawBoxNode);
      this.drawBox.setMap(this.map);
      this.drawBox.setPointSymbol(symbolPoint);
      this.drawBox.setLineSymbol(symbolLine);
      this.drawBox.setPolygonSymbol(symbolPolygon);
    },

    // wire up events
    postCreate: function() {
      this.inherited(arguments);
      this._initEvents();
    },

    startup: function() {
      this.inherited(arguments);
      this.drawBox.startup();
    },

    // wire up events
    _initEvents: function() {
      var _this = this;
      this.own(on(this.selectLayer, 'change', function(e) {
        var val = e.target.value;
        var layer = array.filter(_this.config.layers, function(layer){
          return layer.id === val;
        });
        if (layer !== undefined && layer.length > 0){
          var mapLayer = _this.map.getLayer(val);
          if (mapLayer === undefined){
            _this.emit('Error', {}, [_this.nls.errorMapService]);
            return;
          }
        }
        esriBundle.toolbars.draw.addPoint = _this.nls.drawFeatureMapPoint;
        if (val) {
          _this.startDrawing();
        } else {
          _this.cancelDrawing();
        }
      }));
      this.own(on(this.map.infoWindow, 'hide', function() {
        var zoomNode = query('.actionsPane');
        if(zoomNode !== undefined && zoomNode !== null && zoomNode.length > 0){
          zoomNode[0].style.display = '';
        }
        _this.emit('InfoWindowHide');
      }));
      this.own(on(this.drawBox, 'DrawEnd', function(graphic, geotype, commontype) {
        _this._onDrawEnd(graphic, geotype, commontype);
      }));
    },

    startDrawing: function() {
      domStyle.set(this.drawErrorInstructionsNode, 'display', '');
      domStyle.set(this.drawBoxNode, 'display', '');
    },

    // clear the DrawBox's graphics layer
    // NOTE: Flex widget removed graphics layer - we let DrawBox handle that
    // stop drawing
    // hide instructions and draw box
    cancelDrawing: function() {
      this.drawBox.clear();
      this.drawBox.deactivate();
      domStyle.set(this.drawErrorInstructionsNode, 'display', 'none');
      domStyle.set(this.drawBoxNode, 'display', 'none');
    },

    // At completion of drawing show map info window.
    // convert extent to polygon if needed
    // save a reference to new geometry
    // clear graphics layer and
    // open popup to report selected feature
    // signal that drawing has stopped
    _onDrawEnd: function (graphic/*, geotype, commontype*/) {
      var _this = this;
      var geometry = graphic.geometry;
      var polygon, point;
      if(geometry.type === 'extent'){
        polygon = new Polygon(geometry.spatialReference);
        polygon.addRing([[geometry.xmin, geometry.ymin],
        [geometry.xmin, geometry.ymax],
        [geometry.xmax, geometry.ymax],
        [geometry.xmax, geometry.ymin],
        [geometry.xmin, geometry.ymin]]);
        geometry = polygon;
      }
      this._resultGeometry = geometry;
      this.drawBox.clear();
      this.drawBox.deactivate();
      if (null !== this._resultGeometry) {
        switch (this._resultGeometry.type) {
          case 'polyline':
            point = this._resultGeometry.getExtent().getCenter();
            break;
          case 'polygon':
            point = this._resultGeometry.getCentroid();
            break;
          default: // point
            point = this._resultGeometry;
            break;
        }
        this.map.infoWindow.setTitle(this.nls.infoWindowTitle);
        this.infoWindowContent = new InfoWindowContent({
          nls: this.nls,
          title: this.nls.draw,
          includeReportedBy: this.config.includeReportedBy,
          defaultUserName : this.config.defaultUserName,
          onReportSubmit: function(reviewerAttributes) {
            _this.submitReport(reviewerAttributes);
          }
        }, domConstruct.create('div'));
        this.infoWindowContent.startup();
        var layer = array.filter(_this.config.layers, function(layer){
          return layer.id === _this.selectLayer.value;
        });
        this.infoWindowContent.set('layerName', layer[0].alias);
        this.infoWindowContent.set('graphic', graphic);
        on.once(this.map.infoWindow, 'hide', function() {
          _this.map.setInfoWindowOnClick(false);
        });
        this.map.infoWindow.destroyDijits();
        query('.actionsPane')[0].style.display = 'none';
        this.map.infoWindow.setContent(this.infoWindowContent.domNode);
        this.map.infoWindow.resize(300, 600);
        this.map.infoWindow.show(point);
        this.emit('DrawEnd');
      }
    },

    // Write drawn graphic as a Data Reviewer result
    // using ReviewerAttributes from event
    submitReport: function(reviewerAttributes) {
      var _this = this;
      reviewerAttributes.sessionId = this._sessionId;
      this.map.infoWindow.hide();
      this._reviewerResultsTask.writeResult(reviewerAttributes,
      this._resultGeometry).then(function(result) {
        _this._onWriteResultComplete(result);
      }, function(err) {
        _this._onWriteResultError(err);
      });
    },

    // Show message on completion of writeFeatureAsResult
    _onWriteResultComplete: function(result) {
      if (result && result.success) {
        this.emit(this.nls.popupMessage, {}, ['', this.nls.reportMessage]);
      } else {
        this.emit(this.nls.popupError, {} [this.nls.errorReportMessage]);
      }
    },

    // Show error message if writeFeatureAsResult fails
    _onWriteResultError: function(err) {
      this.emit(this.nls.popupError, {}, [err.message, err]);
    },

    destroy: function() {
      if(this.drawBox){
        this.drawBox.destroy();
        this.drawBox = null;
      }
      this.inherited(arguments);
    },

    // reset form
    reset: function() {
      this.selectLayer.selectedIndex = 0;
      if (this.infoWindowContent !== undefined && this.infoWindowContent !== null){
        this.infoWindowContent.destroyRecursive();
      }
      this.map.setInfoWindowOnClick(false);
      this.cancelDrawing();
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
