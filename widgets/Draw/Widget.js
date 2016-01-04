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
    'dojo/on',
    'dojo/Deferred',
    'dojo/_base/html',
    'dojo/_base/lang',
    'dojo/_base/Color',
    'dojo/_base/array',
    'esri/config',
    'esri/graphic',
    'esri/geometry/Polyline',
    'esri/geometry/Polygon',
    'esri/symbols/TextSymbol',
    'esri/symbols/Font',
    'esri/units',
    'esri/geometry/webMercatorUtils',
    'esri/geometry/geodesicUtils',
    'esri/tasks/GeometryService',
    'esri/tasks/AreasAndLengthsParameters',
    'esri/tasks/LengthsParameters',
    'esri/undoManager',
    'esri/OperationBase',
    'esri/layers/GraphicsLayer',
    'esri/layers/FeatureLayer',
    'jimu/dijit/ViewStack',
    'jimu/utils',
    'jimu/SpatialReference/wkidUtils',
    'jimu/LayerInfos/LayerInfos',
    'jimu/dijit/LoadingIndicator',
    'jimu/dijit/DrawBox',
    'jimu/dijit/SymbolChooser',
    'dijit/form/Select',
    'dijit/form/NumberSpinner'
  ],
  function(declare, _WidgetsInTemplateMixin, BaseWidget, on, Deferred, html, lang, Color, array,
    esriConfig, Graphic, Polyline, Polygon, TextSymbol, Font, esriUnits, webMercatorUtils,
    geodesicUtils, GeometryService, AreasAndLengthsParameters, LengthsParameters, UndoManager,
    OperationBase, GraphicsLayer, FeatureLayer, ViewStack, jimuUtils, wkidUtils, LayerInfos,
    LoadingIndicator) {
    //custom operations
    var customOp = {};
    customOp.Add = declare(OperationBase, {
      label: 'Add Graphic',
      constructor: function(/*graphicsLayer, addedGraphics*/ params){
        this._graphicsLayer = params.graphicsLayer;
        this._addedGraphics = params.addedGraphics;
      },

      performUndo: function () {
        array.forEach(this._addedGraphics, lang.hitch(this, function(g){
          this._graphicsLayer.remove(g);
        }));
      },

      performRedo: function () {
        array.forEach(this._addedGraphics, lang.hitch(this, function(g){
          this._graphicsLayer.add(g);
        }));
      }
    });
    customOp.Delete = declare(OperationBase, {
      label: 'Delete Graphic',
      constructor: function(/*graphicsLayer, deletedGraphics*/ params){
        this._graphicsLayer = params.graphicsLayer;
        this._deletedGraphics = params.deletedGraphics;
      },

      performUndo: function(){
        array.forEach(this._deletedGraphics, lang.hitch(this, function(g){
          this._graphicsLayer.add(g);
        }));
      },

      performRedo: function(){
        array.forEach(this._deletedGraphics, lang.hitch(this, function(g){
          this._graphicsLayer.remove(g);
        }));
      }
    });

    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Draw',
      baseClass: 'jimu-widget-draw',
      _gs: null,
      _defaultGsUrl: '//tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer',
      _undoManager: null,
      _graphicsLayer: null,
      _objectIdCounter: 1,
      _objectIdName: 'OBJECTID',
      _objectIdType: 'esriFieldTypeOID',
      _pointLayer: null,
      _polylineLayer: null,
      _polygonLayer: null,
      _labelLayer: null,

      postMixInProperties: function(){
        this.inherited(arguments);
        this.config.isOperationalLayer = !!this.config.isOperationalLayer;

        if(esriConfig.defaults.geometryService){
          this._gs = esriConfig.defaults.geometryService;
        }else{
          this._gs = new GeometryService(this._defaultGsUrl);
        }

        this._resetUnitsArrays();
        this._undoManager = new UndoManager({
          maxOperations: 0
        });
      },

      postCreate: function() {
        this.inherited(arguments);
        this._initLayers();
        jimuUtils.combineRadioCheckBoxWithLabel(this.showMeasure, this.showMeasureLabel);
        this.drawBox.setMap(this.map);

        this.viewStack = new ViewStack({
          viewType: 'dom',
          views: [this.pointSection, this.lineSection, this.polygonSection, this.textSection]
        });
        html.place(this.viewStack.domNode, this.settingContent);

        this._initUnitSelect();
        this._bindEvents();
        //let all buttons disable-like
        this._enableBtn(this.btnUndo, false);
        this._enableBtn(this.btnRedo, false);
        this._enableBtn(this.btnClear, false);
      },

      _initLayers: function(){
        this._graphicsLayer = new GraphicsLayer();

        if(this.config.isOperationalLayer){
          var layerDefinition = {
            "name": "",
            "geometryType": "",
            "fields": [{
              "name": this._objectIdName,
              "type": this._objectIdType,
              "alias": this._objectIdName
            }]
          };
          var pointDefinition = lang.clone(layerDefinition);
          pointDefinition.name = this.nls.points;//this.label + "_" +
          pointDefinition.geometryType = "esriGeometryPoint";
          this._pointLayer = new FeatureLayer({
            layerDefinition: pointDefinition,
            featureSet: null
          });

          var polylineDefinition = lang.clone(layerDefinition);
          polylineDefinition.name = this.nls.lines;
          polylineDefinition.geometryType = "esriGeometryPolyline";
          this._polylineLayer = new FeatureLayer({
            layerDefinition: polylineDefinition,
            featureSet: null
          });

          var polygonDefinition = lang.clone(layerDefinition);
          polygonDefinition.name = this.nls.areas;
          polygonDefinition.geometryType = "esriGeometryPolygon";
          this._polygonLayer = new FeatureLayer({
            layerDefinition: polygonDefinition,
            featureSet: null
          });

          var labelDefinition = lang.clone(layerDefinition);
          labelDefinition.name = this.nls.text;
          labelDefinition.geometryType = "esriGeometryPoint";
          this._labelLayer = new FeatureLayer({
            layerDefinition: labelDefinition,
            featureSet: null
          });

          var loading = new LoadingIndicator();

          loading.placeAt(this.domNode);

          LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(layerInfos){
            if(!this.domNode){
              return;
            }

            loading.destroy();
            var layers = [this._polygonLayer, this._polylineLayer,
                          this._pointLayer, this._labelLayer];
            layerInfos.addFeatureCollection(layers, this.label + "_" + this.nls.results);
          }), lang.hitch(this, function(err){
            loading.destroy();
            console.error("Can not get LayerInfos instance", err);
          }));
        }else{
          this._pointLayer = new GraphicsLayer();
          this._polylineLayer = new GraphicsLayer();
          this._polygonLayer = new GraphicsLayer();
          this._labelLayer = new GraphicsLayer();
          this.map.addLayer(this._polygonLayer);
          this.map.addLayer(this._polylineLayer);
          this.map.addLayer(this._pointLayer);
          this.map.addLayer(this._labelLayer);
        }
      },

      onActive: function(){
        this.map.setInfoWindowOnClick(false);
      },

      onDeActive: function(){
        this.drawBox.deactivate();
        this.map.setInfoWindowOnClick(true);
      },

      _resetUnitsArrays: function(){
        this.defaultDistanceUnits = [];
        this.defaultAreaUnits = [];
        this.configDistanceUnits = [];
        this.configAreaUnits = [];
        this.distanceUnits = [];
        this.areaUnits = [];
      },

      _bindEvents: function() {
        //bind DrawBox
        this.own(on(this.drawBox, 'icon-selected', lang.hitch(this, this._onIconSelected)));
        this.own(on(this.drawBox, 'DrawEnd', lang.hitch(this, this._onDrawEnd)));

        //bind symbol change events
        this.own(on(this.pointSymChooser, 'change', lang.hitch(this, function() {
          this._setDrawDefaultSymbols();
        })));
        this.own(on(this.lineSymChooser, 'change', lang.hitch(this, function() {
          this._setDrawDefaultSymbols();
        })));
        this.own(on(this.fillSymChooser, 'change', lang.hitch(this, function() {
          this._setDrawDefaultSymbols();
        })));
        this.own(on(this.textSymChooser, 'change', lang.hitch(this, function(symbol) {
          this.drawBox.setTextSymbol(symbol);
        })));

        //bind unit events
        this.own(on(this.showMeasure, 'click', lang.hitch(this, this._setMeasureVisibility)));

        //bind UndoManager events
        this.own(on(this._undoManager, 'change', lang.hitch(this, this._onUndoManagerChanged)));
      },

      _onIconSelected:function(target, geotype, commontype){
        /*jshint unused: false*/
        this._setDrawDefaultSymbols();
        if(commontype === 'point'){
          this.viewStack.switchView(this.pointSection);
        }
        else if(commontype === 'polyline'){
          this.viewStack.switchView(this.lineSection);
        }
        else if(commontype === 'polygon'){
          this.viewStack.switchView(this.polygonSection);
        }
        else if(commontype === 'text'){
          this.viewStack.switchView(this.textSection);
        }
        this._setMeasureVisibility();
      },

      _onDrawEnd:function(graphic, geotype, commontype){
        /*jshint unused: false*/
        this.drawBox.clear();

        var geometry = graphic.geometry;
        if(geometry.type === 'extent'){
          var a = geometry;
          var polygon = new Polygon(a.spatialReference);
          var r = [
            [a.xmin, a.ymin],
            [a.xmin, a.ymax],
            [a.xmax, a.ymax],
            [a.xmax, a.ymin],
            [a.xmin, a.ymin]
          ];
          polygon.addRing(r);
          geometry = polygon;
          commontype = 'polygon';
        }
        if(commontype === 'polyline'){
          if(this.showMeasure.checked){
            this._addLineMeasure(geometry, graphic);
          }else{
            this._pushAddOperation([graphic]);
          }
        }
        else if(commontype === 'polygon'){
          if(this.showMeasure.checked){
            this._addPolygonMeasure(geometry, graphic);
          }else{
            this._pushAddOperation([graphic]);
          }
        }else{
          this._pushAddOperation([graphic]);
        }
      },

      _initUnitSelect:function(){
        this._initDefaultUnits();
        this._initConfigUnits();
        var a = this.configDistanceUnits;
        var b = this.defaultDistanceUnits;
        this.distanceUnits = a.length > 0 ? a : b;
        var c = this.configAreaUnits;
        var d = this.defaultAreaUnits;
        this.areaUnits = c.length > 0 ? c : d;
        array.forEach(this.distanceUnits, lang.hitch(this, function(unitInfo){
          var option = {
            value:unitInfo.unit,
            label:unitInfo.label
          };
          this.distanceUnitSelect.addOption(option);
        }));

        array.forEach(this.areaUnits, lang.hitch(this, function(unitInfo){
          var option = {
            value:unitInfo.unit,
            label:unitInfo.label
          };
          this.areaUnitSelect.addOption(option);
        }));
      },

      _initDefaultUnits:function(){
        this.defaultDistanceUnits = [{
          unit: 'KILOMETERS',
          label: this.nls.kilometers
        }, {
          unit: 'MILES',
          label: this.nls.miles
        }, {
          unit: 'METERS',
          label: this.nls.meters
        }, {
          unit: 'FEET',
          label: this.nls.feet
        }, {
          unit: 'YARDS',
          label: this.nls.yards
        }];

        this.defaultAreaUnits = [{
          unit: 'SQUARE_KILOMETERS',
          label: this.nls.squareKilometers
        }, {
          unit: 'SQUARE_MILES',
          label: this.nls.squareMiles
        }, {
          unit: 'ACRES',
          label: this.nls.acres
        }, {
          unit: 'HECTARES',
          label: this.nls.hectares
        }, {
          unit: 'SQUARE_METERS',
          label: this.nls.squareMeters
        }, {
          unit: 'SQUARE_FEET',
          label: this.nls.squareFeet
        }, {
          unit: 'SQUARE_YARDS',
          label: this.nls.squareYards
        }];
      },

      _initConfigUnits:function(){
        array.forEach(this.config.distanceUnits, lang.hitch(this, function(unitInfo){
          var unit = unitInfo.unit;
          if(esriUnits[unit]){
            var defaultUnitInfo = this._getDefaultDistanceUnitInfo(unit);
            unitInfo.label = defaultUnitInfo.label;
            this.configDistanceUnits.push(unitInfo);
          }
        }));

        array.forEach(this.config.areaUnits, lang.hitch(this, function(unitInfo){
          var unit = unitInfo.unit;
          if(esriUnits[unit]){
            var defaultUnitInfo = this._getDefaultAreaUnitInfo(unit);
            unitInfo.label = defaultUnitInfo.label;
            this.configAreaUnits.push(unitInfo);
          }
        }));
      },

      _getDefaultDistanceUnitInfo:function(unit){
        for(var i = 0; i < this.defaultDistanceUnits.length; i++){
          var unitInfo = this.defaultDistanceUnits[i];
          if(unitInfo.unit === unit){
            return unitInfo;
          }
        }
        return null;
      },

      _getDefaultAreaUnitInfo:function(unit){
        for(var i = 0; i < this.defaultAreaUnits.length; i++){
          var unitInfo = this.defaultAreaUnits[i];
          if(unitInfo.unit === unit){
            return unitInfo;
          }
        }
        return null;
      },

      _getDistanceUnitInfo:function(unit){
        for(var i = 0; i < this.distanceUnits.length; i++){
          var unitInfo = this.distanceUnits[i];
          if(unitInfo.unit === unit){
            return unitInfo;
          }
        }
        return null;
      },

      _getAreaUnitInfo:function(unit){
        for(var i = 0; i < this.areaUnits.length; i++){
          var unitInfo = this.areaUnits[i];
          if(unitInfo.unit === unit){
            return unitInfo;
          }
        }
        return null;
      },

      _setMeasureVisibility:function(){
        html.setStyle(this.measureSection, 'display', 'none');
        html.setStyle(this.areaMeasure, 'display', 'none');
        html.setStyle(this.distanceMeasure, 'display', 'none');
        var lineDisplay = html.getStyle(this.lineSection, 'display');
        var polygonDisplay = html.getStyle(this.polygonSection, 'display');
        if (lineDisplay === 'block') {
          html.setStyle(this.measureSection, 'display', 'block');
          if (this.showMeasure.checked) {
            html.setStyle(this.distanceMeasure, 'display', 'block');
          }
        } else if (polygonDisplay === 'block') {
          html.setStyle(this.measureSection, 'display', 'block');
          if (this.showMeasure.checked) {
            html.setStyle(this.areaMeasure, 'display', 'block');
            html.setStyle(this.distanceMeasure, 'display', 'block');
          }
        }
      },

      _getPointSymbol: function() {
        return this.pointSymChooser.getSymbol();
      },

      _getLineSymbol: function() {
        return this.lineSymChooser.getSymbol();
      },

      _getPolygonSymbol: function() {
        return this.fillSymChooser.getSymbol();
      },

      _getTextSymbol: function() {
        return this.textSymChooser.getSymbol();
      },

      _setDrawDefaultSymbols: function() {
        this.drawBox.setPointSymbol(this._getPointSymbol());
        this.drawBox.setLineSymbol(this._getLineSymbol());
        this.drawBox.setPolygonSymbol(this._getPolygonSymbol());
      },

      _addLineMeasure:function(geometry, graphic){
        this._getLengthAndArea(geometry, false).then(lang.hitch(this, function(result){
          if(!this.domNode){
            return;
          }
          var length = result.length;
          var a = Font.STYLE_ITALIC;
          var b = Font.VARIANT_NORMAL;
          var c = Font.WEIGHT_BOLD;
          var symbolFont = new Font("16px", a, b, c, "Courier");
          var fontColor = new Color([0, 0, 0, 1]);
          var ext = geometry.getExtent();
          var center = ext.getCenter();

          var unit = this.distanceUnitSelect.value;
          var abbr = this._getDistanceUnitInfo(unit).label;
          var localeLength = jimuUtils.localizeNumber(length.toFixed(1));
          var lengthText = localeLength + " " + abbr;

          var textSymbol = new TextSymbol(lengthText, symbolFont, fontColor);
          var labelGraphic = new Graphic(center, textSymbol, null, null);
          this._pushAddOperation([graphic, labelGraphic]);
        }), lang.hitch(this, function(err){
          console.log(err);
          if(!this.domNode){
            return;
          }
          this._pushAddOperation([graphic]);
        }));
      },

      _addPolygonMeasure:function(geometry, graphic){
        this._getLengthAndArea(geometry, true).then(lang.hitch(this, function(result){
          if(!this.domNode){
            return;
          }
          var length = result.length;
          var area = result.area;

          var a = Font.STYLE_ITALIC;
          var b = Font.VARIANT_NORMAL;
          var c = Font.WEIGHT_BOLD;
          var symbolFont = new Font("16px", a, b, c, "Courier");
          var fontColor = new Color([0, 0, 0, 1]);
          var ext = geometry.getExtent();
          var center = ext.getCenter();

          var areaUnit = this.areaUnitSelect.value;
          var areaAbbr = this._getAreaUnitInfo(areaUnit).label;
          var localeArea = jimuUtils.localizeNumber(area.toFixed(1));
          var areaText = localeArea + " " + areaAbbr;

          var lengthUnit = this.distanceUnitSelect.value;
          var lengthAbbr = this._getDistanceUnitInfo(lengthUnit).label;
          var localeLength = jimuUtils.localizeNumber(length.toFixed(1));
          var lengthText = localeLength + " " + lengthAbbr;

          var text = areaText + "    " + lengthText;
          var textSymbol = new TextSymbol(text, symbolFont, fontColor);
          var labelGraphic = new Graphic(center, textSymbol, null, null);
          this._pushAddOperation([graphic, labelGraphic]);
        }), lang.hitch(this, function(err){
          if(!this.domNode){
            return;
          }
          console.log(err);
          this._pushAddOperation([graphic]);
        }));
      },

      _getLengthAndArea: function(geometry, isPolygon){
        var def = new Deferred();
        var defResult = {
          length: null,
          area: null
        };
        var wkid = geometry.spatialReference.wkid;
        var areaUnit = this.areaUnitSelect.value;
        var esriAreaUnit = esriUnits[areaUnit];
        var lengthUnit = this.distanceUnitSelect.value;
        var esriLengthUnit = esriUnits[lengthUnit];
        if(wkidUtils.isWebMercator(wkid)){
          defResult = this._getLengthAndArea3857(geometry, isPolygon, esriAreaUnit, esriLengthUnit);
          def.resolve(defResult);
        }else if(wkid === 4326){
          defResult = this._getLengthAndArea4326(geometry, isPolygon, esriAreaUnit, esriLengthUnit);
          def.resolve(defResult);
        }else{
          def = this._getLengthAndAreaByGS(geometry, isPolygon, esriAreaUnit, esriLengthUnit);
        }
        return def;
      },

      _getLengthAndArea4326: function(geometry, isPolygon, esriAreaUnit, esriLengthUnit){
        var result = {
          area: null,
          length: null
        };

        var lengths = null;

        if(isPolygon){
          var areas = geodesicUtils.geodesicAreas([geometry], esriAreaUnit);
          var polyline = this._getPolylineOfPolygon(geometry);
          lengths = geodesicUtils.geodesicLengths([polyline], esriLengthUnit);
          result.area = areas[0];
          result.length = lengths[0];
        }else{
          lengths = geodesicUtils.geodesicLengths([geometry], esriLengthUnit);
          result.length = lengths[0];
        }

        return result;
      },

      _getLengthAndArea3857: function(geometry3857, isPolygon, esriAreaUnit, esriLengthUnit){
        var geometry4326 = webMercatorUtils.webMercatorToGeographic(geometry3857);
        var result = this._getLengthAndArea4326(geometry4326,
                                                isPolygon,
                                                esriAreaUnit,
                                                esriLengthUnit);
        return result;
      },

      _getLengthAndAreaByGS: function(geometry, isPolygon, esriAreaUnit, esriLengthUnit){
        var def = new Deferred();
        var defResult = {
          area: null,
          length: null
        };
        var gsAreaUnit = this._getGeometryServiceUnitByEsriUnit(esriAreaUnit);
        var gsLengthUnit = this._getGeometryServiceUnitByEsriUnit(esriLengthUnit);
        if(isPolygon){
          var areasAndLengthParams = new AreasAndLengthsParameters();
          areasAndLengthParams.lengthUnit = gsLengthUnit;
          areasAndLengthParams.areaUnit = gsAreaUnit;
          this._gs.simplify([geometry]).then(lang.hitch(this, function(simplifiedGeometries){
            if(!this.domNode){
              return;
            }
            areasAndLengthParams.polygons = simplifiedGeometries;
            this._gs.areasAndLengths(areasAndLengthParams).then(lang.hitch(this, function(result){
              if(!this.domNode){
                return;
              }
              defResult.area = result.areas[0];
              defResult.length = result.lengths[0];
              def.resolve(defResult);
            }), lang.hitch(this, function(err){
              def.reject(err);
            }));
          }), lang.hitch(this, function(err){
            def.reject(err);
          }));
        }else{
          var lengthParams = new LengthsParameters();
          lengthParams.polylines = [geometry];
          lengthParams.lengthUnit = gsLengthUnit;
          lengthParams.geodesic = true;
          this._gs.lengths(lengthParams).then(lang.hitch(this, function(result){
            if(!this.domNode){
              return;
            }
            defResult.length = result.lengths[0];
            def.resolve(defResult);
          }), lang.hitch(this, function(err){
            console.error(err);
            def.reject(err);
          }));
        }

        return def;
      },

      _getGeometryServiceUnitByEsriUnit: function(unit){
        var gsUnit = -1;
        switch(unit){
        case esriUnits.KILOMETERS:
          gsUnit = GeometryService.UNIT_KILOMETER;
          break;
        case esriUnits.MILES:
          gsUnit = GeometryService.UNIT_STATUTE_MILE;
          break;
        case esriUnits.METERS:
          gsUnit = GeometryService.UNIT_METER;
          break;
        case esriUnits.FEET:
          gsUnit = GeometryService.UNIT_FOOT;
          break;
        case esriUnits.YARDS:
          gsUnit = GeometryService.UNIT_INTERNATIONAL_YARD;
          break;
        case esriUnits.SQUARE_KILOMETERS:
          gsUnit = GeometryService.UNIT_SQUARE_KILOMETERS;
          break;
        case esriUnits.SQUARE_MILES:
          gsUnit = GeometryService.UNIT_SQUARE_MILES;
          break;
        case esriUnits.ACRES:
          gsUnit = GeometryService.UNIT_ACRES;
          break;
        case esriUnits.HECTARES:
          gsUnit = GeometryService.UNIT_HECTARES;
          break;
        case esriUnits.SQUARE_METERS:
          gsUnit = GeometryService.UNIT_SQUARE_METERS;
          break;
        case esriUnits.SQUARE_FEET:
          gsUnit = GeometryService.UNIT_SQUARE_FEET;
          break;
        case esriUnits.SQUARE_YARDS:
          gsUnit = GeometryService.UNIT_SQUARE_YARDS;
          break;
        }
        return gsUnit;
      },

      _getPolylineOfPolygon: function(polygon){
        var polyline = new Polyline(polygon.spatialReference);
        var points = polygon.rings[0];
        polyline.addPath(points);
        return polyline;
      },

      destroy: function() {
        if(this._undoManager){
          this._undoManager.destroy();
          this._undoManager = null;
        }
        if(this.drawBox){
          this.drawBox.destroy();
          this.drawBox = null;
        }
        if(this._graphicsLayer){
          this._graphicsLayer.clear();
          this.map.removeLayer(this._graphicsLayer);
          this._graphicsLayer = null;
        }
        if(this._pointLayer){
          this.map.removeLayer(this._pointLayer);
          this._pointLayer = null;
        }
        if(this._polylineLayer){
          this.map.removeLayer(this._polylineLayer);
          this._polylineLayer = null;
        }
        if(this._polygonLayer){
          this.map.removeLayer(this._polygonLayer);
          this._polygonLayer = null;
        }
        if(this._labelLayer){
          this.map.removeLayer(this._labelLayer);
          this._labelLayer = null;
        }
        if(this.pointSymChooser){
          this.pointSymChooser.destroy();
          this.pointSymChooser = null;
        }
        if(this.lineSymChooser){
          this.lineSymChooser.destroy();
          this.lineSymChooser = null;
        }
        if(this.fillSymChooser){
          this.fillSymChooser.destroy();
          this.fillSymChooser = null;
        }
        if(this.textSymChooser){
          this.textSymChooser.destroy();
          this.textSymChooser = null;
        }
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        this.viewStack.startup();
        this.viewStack.switchView(null);
      },

      _getAllGraphics: function(){
        //return a new array
        return array.map(this._graphicsLayer.graphics, lang.hitch(this, function(g){
          return g;
        }));
      },

      _onUndoManagerChanged: function(){
        this._enableBtn(this.btnUndo, this._undoManager.canUndo);
        this._enableBtn(this.btnRedo, this._undoManager.canRedo);
        var graphics = this._getAllGraphics();
        this._enableBtn(this.btnClear, graphics.length > 0);
        this._syncGraphicsToLayers();
      },

      _syncGraphicsToLayers: function(){
        this._pointLayer.clear();
        this._polylineLayer.clear();
        this._polygonLayer.clear();
        this._labelLayer.clear();
        var graphics = this._getAllGraphics();
        array.forEach(graphics, lang.hitch(this, function(g){
          var graphicJson = g.toJson();
          var clonedGraphic = new Graphic(graphicJson);
          var geoType = clonedGraphic.geometry.type;
          var layer = null;
          if(geoType === 'point'){
            if(clonedGraphic.symbol && clonedGraphic.symbol.type === 'textsymbol'){
              layer = this._labelLayer;
            }else{
              layer = this._pointLayer;
            }
          }else if(geoType === 'polyline'){
            layer = this._polylineLayer;
          }else if(geoType === 'polygon' || geoType === 'extent'){
            layer = this._polygonLayer;
          }
          if(layer){
            layer.add(clonedGraphic);
          }
        }));
      },

      _pushAddOperation: function(graphics){
        array.forEach(graphics, lang.hitch(this, function(g){
          var attrs = g.attributes || {};
          attrs[this._objectIdName] = this._objectIdCounter++;
          g.setAttributes(attrs);
          this._graphicsLayer.add(g);
        }));
        var addOperation = new customOp.Add({
          graphicsLayer: this._graphicsLayer,
          addedGraphics: graphics
        });
        this._undoManager.add(addOperation);
      },

      _pushDeleteOperation: function(graphics){
        var deleteOperation = new customOp.Delete({
          graphicsLayer: this._graphicsLayer,
          deletedGraphics: graphics
        });
        this._undoManager.add(deleteOperation);
      },

      _enableBtn: function(btn, isEnable){
        if(isEnable){
          html.removeClass(btn, 'jimu-state-disabled');
        }else{
          html.addClass(btn, 'jimu-state-disabled');
        }
      },

      _onBtnUndoClicked: function(){
        this._undoManager.undo();
      },

      _onBtnRedoClicked: function(){
        this._undoManager.redo();
      },

      _onBtnClearClicked: function(){
        var graphics = this._getAllGraphics();
        if(graphics.length > 0){
          this._graphicsLayer.clear();
          this._pushDeleteOperation(graphics);
        }
        this._enableBtn(this.btnClear, false);
      }
    });
  });