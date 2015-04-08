///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define, dojo, console, window, setTimeout*/
define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/dijit/TabContainer',
    './List',
    './Parameters',
    'jimu/dijit/Message',
    'jimu/utils',
    'esri/urlUtils',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/layers/CodedValueDomain',
    'esri/layers/Domain',
    'esri/layers/GraphicsLayer',
    'esri/layers/FeatureLayer',
    'esri/layers/FeatureType',
    'esri/layers/Field',
    'esri/layers/RangeDomain',
    'esri/tasks/BufferParameters',
    'esri/tasks/GeometryService',
    'esri/config',
    'esri/graphic',
    'esri/graphicsUtils',
    'esri/geometry/Point',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/PictureMarkerSymbol',
    'esri/geometry/Polyline',
    'esri/symbols/SimpleLineSymbol',
    'esri/geometry/Polygon',
    'esri/geometry/Multipoint',
    'esri/geometry/Extent',
    'esri/symbols/SimpleFillSymbol',
    'esri/renderers/SimpleRenderer',
    'esri/renderers/jsonUtils',
    'esri/toolbars/draw',
    'esri/dijit/PopupTemplate',
    'esri/request',
    'dojo/Deferred',
    'dijit/ProgressBar',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/promise/all',
    'dojo/date',
    'dojo/date/locale',
    'dijit/form/Select',
    'dijit/form/TextBox',
    'dijit/form/NumberTextBox',
    './DrawBox',
    'jimu/dijit/LoadingShelter',
    'dojo/io-query',
    'esri/SpatialReference',
    'dijit/registry'
  ],
  function (
    declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, List, Parameters, Message, utils, urlUtils, Query, QueryTask, CodedValueDomain,
    Domain, GraphicsLayer, FeatureLayer, FeatureType, Field, RangeDomain, BufferParameters, GeometryService, esriConfig, Graphic, graphicsUtils,
    Point, SimpleMarkerSymbol, PictureMarkerSymbol, Polyline, SimpleLineSymbol, Polygon, Multipoint, Extent, SimpleFillSymbol, SimpleRenderer, jsonUtil,
    Draw, PopupTemplate, esriRequest, Deferred, ProgressBar, lang, on, html, array, all, date, locale, Select, TextBox, NumberTextBox, DrawBox,
    LoadingShelter, ioquery, SpatialReference, registry
    ) { /*jshint unused: false*/
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Enhanced Search',
      baseClass: 'widget-esearch',
      resultLayers: [],
      operationalLayers: [],
      graphicLayerIndex: 0,
      AttributeLayerIndex: 0,
      spatialLayerIndex: 0,
      expressIndex: 0,
      progressBar: null,
      tabContainer: null,
      list: null,
      selTab: null,
      garr: [],
      pointSearchTolerance: 6,
      polygonsToDiscard: [],
      autozoomtoresults: false,
      keepgraphicalsearchenabled: false,
      layerDomainsCache: {},
      layerUniqueCache: null,
      graphicsLayerBuffer: null,
      bufferWKID: null,
      initiator: null,
      currentLayerIndex: null,

      postCreate: function () {
        this.inherited(arguments);
        this.resultLayers = [];
        this.layerUniqueCache = {};
        this._initTabContainer();
        this._initBufferUnits();
        this._initSpatialRelationships();
        this._initLayerSelect();
        this._initProgressBar();
        this._initDrawBox();
        this.garr = [];
        this.polygonsToDiscard = [];
        this.graphicsLayerBuffer = new GraphicsLayer();
        this.graphicsLayerBuffer.name = "Search Buffer Results";
        this.map.addLayer(this.graphicsLayerBuffer);
      },

      onClose: function () {
        this.drawBox.deactivate();
        this._hideInfoWindow();
        this.inherited(arguments);
        if (this.graphicsLayerBuffer){
          this.graphicsLayerBuffer.hide();
        }
      },

      onOpen: function(){
        if (this.graphicsLayerBuffer){
          this.graphicsLayerBuffer.show();
        }
        var widgetTitlebar = this.domNode.parentNode.parentNode.parentNode.childNodes[0];
        if(typeof widgetTitlebar.onmousedown !== "function") {
           this.own(on(widgetTitlebar, 'mousedown', lang.hitch(this, function(event) {
            event.stopPropagation();
            if(event.altKey){
              var msgStr = this.nls.widgetverstr + ': ' + this.manifest.version;
              msgStr += '\n' + this.nls.wabversionmsg + ': ' + this.manifest.wabVersion;
              msgStr += '\n' + this.manifest.description;
              new Message({
                titleLabel: this.nls.widgetversion,
                message: msgStr
              });
            }
          })));
        }
      },

      _resetDrawBox: function(){
        this.drawBox.deactivate();
        this.drawBox.clear();
      },

      destroy: function () {
        this._hideInfoWindow();
        this._resetDrawBox();
        this._removeAllResultLayers();
        this.inherited(arguments);

        while (this.resultLayers.length > 0) {
          var layer = this.resultLayers[0];
          if (layer) {
            this.map.removeLayer(layer);
            this.resultLayers.splice(0, 1);
          }
        }
      },

      _removeAllResultLayers: function(){
        this._hideInfoWindow();
        this._removeAllOperatonalLayers();
      },

      _removeAllOperatonalLayers: function(){
        var layers = this.operationalLayers;
        while(layers.length > 0){
          var layer = layers[0];
          if(layer){
            this.map.removeLayer(layer);
          }
          layers[0] = null;
          layers.splice(0,1);
        }
        this.operationalLayers = [];
      },

      onGrapicalLayerChange: function (newValue) {
        this.graphicLayerIndex = newValue;
      },

      onAttributeLayerChange: function (newValue) {
        this.AttributeLayerIndex = newValue;
        this._initSelectedLayerExpressions();
        var valuesObj = lang.clone(this.config.layers[newValue].expressions.expression[0].values.value);
        this.paramsDijit.clear();
        this.paramsDijit.build(valuesObj, this.resultLayers[newValue], this.config.layers[newValue].url, this.config.layers[newValue].definitionexpression);
        this.expressIndex = 0;
      },

      onAttributeLayerExpressionChange: function (newValue) {
        this.expressIndex = newValue;
        var valuesObj = lang.clone(this.config.layers[this.AttributeLayerIndex].expressions.expression[newValue].values.value);
        this.paramsDijit.clear();
        this.paramsDijit.build(valuesObj, this.resultLayers[this.AttributeLayerIndex], this.config.layers[this.AttributeLayerIndex].url, this.config.layers[this.AttributeLayerIndex].definitionexpression);
      },

      onSpatialLayerChange: function (newValue) {
        this.spatialLayerIndex = newValue;
      },

      _initBufferUnits: function() {
        var options = [];
        var len = this.config.bufferDefaults.bufferUnits.bufferUnit.length;
        for (var i = 0; i < len; i++) {
          var option = {
            value: this.config.bufferDefaults.bufferUnits.bufferUnit[i].name,
            label: this.config.bufferDefaults.bufferUnits.bufferUnit[i].label
          };
          options.push(option);
          if (i === 0) {
            options[i].selected = true;
          }
        }
        this.bufferUnits.addOption(options);
        this.bufferUnitsSpat.addOption(options);
      },

      _initSpatialRelationships: function() {
        var len = this.config.spatialrelationships.spatialrelationship.length;
        for (var i = 0; i < len; i++) {
          var iClass = this._getSpatialIconClass(this.config.spatialrelationships.spatialrelationship[i].name);
          var spatButton = html.create('div', {
            'class': 'spatial-item',
            'data-spatialtype': this.config.spatialrelationships.spatialrelationship[i].name,
            'title': this.config.spatialrelationships.spatialrelationship[i].label
          }, this.spatialItems);
          html.addClass(spatButton, iClass);
          this.own(on(spatButton, 'click', lang.hitch(this, this._spatButtonOnClick)));
        }
      },

      _spatButtonOnClick: function(event) {
        event.stopPropagation();
        this._intersectResults(event.target.getAttribute('data-spatialtype'));
      },

      _intersectResults: function (dataSpatialType) {
        this.garr = [];
        var intersectGeom;
        if (this.graphicsLayerBuffer && this.graphicsLayerBuffer.graphics.length > 0 && this.currentLayerAdded && this.currentLayerAdded.graphics.length > 0){
          var qMessage = new Message({
            type: 'question',
            titleLabel: this.nls.spatialchoicetitle,
            message: this.nls.spatialchoicemsg,
            buttons: [{
              label: this.nls.buffergraphics,
              onClick: lang.hitch(this, lang.hitch(this, function(){
                qMessage.close();
                var g = this.graphicsLayerBuffer.graphics[0];
                intersectGeom = g.geometry;
                this.search(intersectGeom, this.spatialLayerIndex, null, null, dataSpatialType);
              }))
            }, {
              label: this.nls.selectiongraphics,
              onClick: lang.hitch(this, lang.hitch(this, function(){
                qMessage.close();
                intersectGeom = this.unionGeoms(this.currentLayerAdded.graphics);
                this.search(intersectGeom, this.spatialLayerIndex, null, null, dataSpatialType);
              }))
            }]
          });
          return;
        }
        var gra;
        if (this.graphicsLayerBuffer && this.graphicsLayerBuffer.graphics.length > 0){
          gra = this.graphicsLayerBuffer.graphics[0];
          intersectGeom = gra.geometry;
          this.search(intersectGeom, this.spatialLayerIndex, null, null, dataSpatialType);
        } else if (this.currentLayerAdded &&  this.currentLayerAdded.graphics.length > 0) {
          intersectGeom = this.unionGeoms(this.currentLayerAdded.graphics);
          if(intersectGeom === Polygon && (intersectGeom.isSelfIntersecting(intersectGeom) || intersectGeom.rings.length > 1)){
            esriConfig.defaults.geometryService.simplify([intersectGeom], lang.hitch(this,
            function (result) {
              intersectGeom = gra.geometry;
              this.search(result[0], this.spatialLayerIndex, null, null, dataSpatialType);
            }));
          }else{
            intersectGeom = gra.geometry;
            this.search(intersectGeom, this.spatialLayerIndex, null, null, dataSpatialType);
          }
        }else{
          new Message({
            titleLabel: this.nls.spatialSearchErrorTitle,
            message: this.nls.intersectMessage
          });
        }
      },

      _getSpatialIconClass: function(spatRel) {
        var iClass;
        switch(spatRel) {
          case 'esriSpatialRelContains':
            iClass = 'contain-icon';
            break;
          case 'esriSpatialRelIntersects':
            iClass = 'intersect-icon';
            break;
          case 'esriSpatialRelEnvelopeIntersects':
            iClass = 'envintersects-icon';
            break;
          case 'esriSpatialRelCrosses':
            iClass = 'crosses-icon';
            break;
          case 'esriSpatialRelIndexIntersects':
            iClass = 'indexintersects-icon';
            break;
          case 'esriSpatialRelOverlaps':
            iClass = 'overlaps-icon';
            break;
          case 'esriSpatialRelTouches':
            iClass = 'touches-icon';
            break;
          case 'esriSpatialRelWithin':
            iClass = 'within-icon';
            break;
          default:
            iClass = 'contain-icon';
        }
        return iClass;
      },

      _initTabContainer: function () {
        this.txtBufferValue.set('value', this.config.bufferDefaults.bufferDefaultValue || 2);
        this.txtBufferValueSpat.set('value', this.config.bufferDefaults.bufferDefaultValue || 2);
        this.bufferWKID = this.config.bufferDefaults.bufferWKID;
        this.keepgraphicalsearchenabled = this.config.keepgraphicalsearchenabled || false;
        this.autozoomtoresults = this.config.autozoomtoresults || false;
        var initView = this.config.initialView || "text";
        this.pointSearchTolerance = this.config.toleranceforpointgraphicalselection || 6;
        this.cbxAddTolerance.checked = this.config.addpointtolerancechecked || false;
        this.cbxMultiGraphic.checked = this.config.multipartgraphicsearchchecked || false;
        this.cbxBufferGraphic.checked = false;

        if(this.cbxMultiGraphic.checked){
          html.setStyle(this.btnGraSearch, 'display', 'inline-block');
        }else{
          html.setStyle(this.btnGraSearch, 'display', 'none');
        }
        var len = this.config.layers.length;
        if (initView === "text") {
          this.selTab = this.nls.selectByAttribute;
        } else {
          this.selTab = this.nls.selectFeatures;
        }
        var tabs = [];
        tabs.push({
          title: this.nls.selectFeatures,
          content: this.tabNode1
        });
        tabs.push({
          title: this.nls.selectByAttribute,
          content: this.tabNode2
        });
        for (var i = 0; i < len; i++) {
          if(this.config.layers[i].spatialsearchlayer){
            tabs.push({
              title: this.nls.selectSpatial,
              content: this.tabNode3
            });
            html.replaceClass(this.tabNode3,'search-tab-node', 'search-tab-node-hidden');
            break;
          }
        }
        tabs.push({
          title: this.nls.results,
          content: this.tabNode4
        });
        this.tabContainer = new TabContainer({
          tabs: tabs,
          selected: this.selTab
        }, this.tabSearch);

        this.tabContainer.startup();
        this.own(on(this.tabContainer,"tabChanged",lang.hitch(this,function(title){
          if(title !== this.nls.results){
            this.selTab = title;
          }
        })));
        utils.setVerticalCenter(this.tabContainer.domNode);
      },

      _initLayerSelect: function () {
        var options = [];
        var spatialOptions = [];
        var len = this.config.layers.length;
        for (var i = 0; i < len; i++) {
          var option = {
            value: i,
            label: this.config.layers[i].name
          };
          options.push(option);
          if(this.config.layers[i].spatialsearchlayer){
            spatialOptions.push(option);
          }
        }
        //select the first layer in the lists
        if(options.length > 0){
          options[0].selected = true;
        }
        if(spatialOptions.length > 0){
          spatialOptions[0].selected = true;
        }

        if (len > 0) {
          this.selectLayerGraphical.addOption(options);
          this.selectLayerAttribute.addOption(options);
          this.selectLayerSpatial.addOption(spatialOptions);

          this.paramsDijit = new Parameters({
            nls: this.nls,
            layerUniqueCache: this.layerUniqueCache
          });
          this.paramsDijit.placeAt(this.parametersDiv);
          this.paramsDijit.startup();

          this.shelter.show();

          var defs = array.map(this.config.layers, lang.hitch(this, function (layerConfig) {
            return this._getLayerInfoWithRelationships(layerConfig.url);
          }));

          all(defs).then(lang.hitch(this, function (layerInfos) {
            this.shelter.hide();
            array.forEach(layerInfos, lang.hitch(this, function (layerInfo, j) {
              var layerConfig = this.config.layers[j];
              if(layerInfo.objectIdField){
                layerConfig.objectIdField = layerInfo.objectIdField;
              }
              else{
                var fields = layerInfo.fields;
                var oidFieldInfos = array.filter(fields,lang.hitch(this,function(fieldInfo){
                  return fieldInfo.type === 'esriFieldTypeOID';
                }));
                if(oidFieldInfos.length > 0){
                  var oidFieldInfo = oidFieldInfos[0];
                  layerConfig.objectIdField = oidFieldInfo.name;
                }
              }
              layerConfig.existObjectId = array.some(layerConfig.fields.field, lang.hitch(this, function(element, index, array){
                return element.name === layerConfig.objectIdField;
              }));
              layerInfo.name = 'Search result: ' + layerConfig.name;
              layerInfo.minScale = 0;
              layerInfo.maxScale = 0;
              layerInfo.effectiveMinScale = 0;
              layerInfo.effectiveMaxScale = 0;
              layerInfo.defaultVisibility = true;
              this.resultLayers.push(layerInfo);
            }));

            //now check if there is a url search to do
            var myObject = this.getUrlParams();
            if(myObject.esearch){
              this._queryFromURL(myObject.esearch, myObject.slayer, myObject.exprnum);
            } else {
              //init the first layers paramsDijit
              this.AttributeLayerIndex = 0;
              this._initSelectedLayerExpressions();
              var valuesObj = lang.clone(this.config.layers[0].expressions.expression[0].values.value);
              this.paramsDijit.build(valuesObj, this.resultLayers[0], this.config.layers[0].url, this.config.layers[0].definitionexpression);
            }
          }), lang.hitch(this, function (err) {
            this.shelter.hide();
            console.error(err);
            for (var j = 0; j < this.config.layers.length; j++) {
              var layer = new GraphicsLayer();
              this.resultLayers.push(layer);
            }
          }));
        }
        this.own(on(this.selectLayerGraphical, "change", lang.hitch(this, this.onGrapicalLayerChange)));
        this.own(on(this.selectLayerAttribute, "change", lang.hitch(this, this.onAttributeLayerChange)));
        this.own(on(this.selectExpression, "change", lang.hitch(this, this.onAttributeLayerExpressionChange)));
        this.own(on(this.selectLayerSpatial, "change", lang.hitch(this, this.onSpatialLayerChange)));
      },

      _getServiceUrlByLayerUrl: function(layerUrl){
        var lastIndex = layerUrl.lastIndexOf("/");
        var serviceUrl = layerUrl.slice(0, lastIndex);
        return serviceUrl;
      },

      _getLayerInfoWithRelationships: function(layerUrl){
        var def = new Deferred();
        esriRequest({
          url: layerUrl,
          content: {
            f: 'json'
          },
          handleAs: 'json',
          callbackParamName: 'callback'
        }).then(lang.hitch(this, function(layerInfo){
          if(!layerInfo.relationships){
            layerInfo.relationships = [];
          }
          var serviceUrl = this._getServiceUrlByLayerUrl(layerUrl);
          var defs = array.map(layerInfo.relationships, lang.hitch(this, function(relationship){
            return esriRequest({
              url: serviceUrl + '/' + relationship.relatedTableId,
              content: {
                f: 'json'
              },
              handleAs: 'json',
              callbackParamName: 'callback'
            });
          }));
          all(defs).then(lang.hitch(this, function(results){
            array.forEach(results, lang.hitch(this, function(relationshipInfo, index){
              var relationship = layerInfo.relationships[index];
              relationship.name = relationshipInfo.name;
              //ignore shape field
              relationship.fields = array.filter(relationshipInfo.fields,
                lang.hitch(this, function(relationshipFieldInfo){
                return relationshipFieldInfo.type !== 'esriFieldTypeGeometry';
              }));
            }));
            def.resolve(layerInfo);
          }), lang.hitch(this, function(err){
            def.reject(err);
          }));
        }), lang.hitch(this, function(err){
          def.reject(err);
        }));
        return def;
      },

      _queryFromURL: function(value, slayerId, exprNum) {
        slayerId = typeof slayerId !== 'undefined' ? slayerId : 0;
        exprNum = typeof exprNum !== 'undefined' ? exprNum : 0;
        this.selectLayerAttribute.set('value', slayerId);
        setTimeout(lang.hitch(this,function(){
          this.selectExpression.set('value', exprNum);
          setTimeout(lang.hitch(this,function(){
            var valuesObj = lang.clone(this.config.layers[slayerId].expressions.expression[exprNum].values.value);
            this.paramsDijit.setSingleParamValues(valuesObj, value);
            var valsArr = this._buildSearchValues(valuesObj, value);
            setTimeout(lang.hitch(this,function(){
              this.search(null, slayerId, exprNum, valsArr);
            }), 800);
          }), 1000);
        }), 200);
      },

      _bufferGeometries:function (geomArr, sr, dist, unit, isGraphicalBufferOp) {
        if (geomArr){
          var bufferParameters = new BufferParameters();
          var resultEvent;
          bufferParameters.geometries = geomArr;
          bufferParameters.bufferSpatialReference = sr;
          bufferParameters.unit = GeometryService[unit];
          bufferParameters.distances = dist;
          bufferParameters.unionResults = true;
          bufferParameters.geodesic = true;
          bufferParameters.outSpatialReference = this.map.spatialReference;
          esriConfig.defaults.geometryService.buffer(bufferParameters, lang.hitch(this, function(evt){
            resultEvent = evt[0];
            var graphic = new Graphic();
            graphic.geometry = resultEvent;
            graphic.symbol = new SimpleFillSymbol(this.config.bufferDefaults.simplefillsymbol);

            this.graphicsLayerBuffer.clear();
            this.graphicsLayerBuffer.add(graphic);
            html.setStyle(this.btnClearBuffer, 'display', 'block');
            html.setStyle(this.btnClearBuffer2, 'display', 'block');
            html.setStyle(this.btnClearBuffer3, 'display', 'block');
            if(isGraphicalBufferOp){
              this.search(resultEvent, this.graphicLayerIndex);
            }
          }));
        }
      },

      _buildSearchValues: function(valuesObj, value){
        var valArray = [];
        var values = value.split("|");
        array.forEach(values, lang.hitch(this, function(val){
          var retValueObj = {};
          if (val.indexOf('~') > -1){
            var ranges = val.split("~");
            retValueObj.value1 = ranges[0];
            retValueObj.value2 = ranges[1];
          }else{
            retValueObj.value = val;
          }
          valArray.push(retValueObj);
        }));
        return valArray;
      },

      getUrlParams: function () {
        var s = window.location.search, p;
        if (s === '') {
          return {};
        }
        p = ioquery.queryToObject(s.substr(1));
        return p;
      },

      _initProgressBar: function () {
        this.progressBar = new ProgressBar({
          indeterminate: true
        }, this.progressbar);
        html.setStyle(this.progressBar.domNode, 'display', 'none');
      },

      _initSelectedLayerExpressions: function() {
        this.selectExpression.removeOption(this.selectExpression.getOptions());
        var express = [];
        //now loop through the expressions
        var elen = this.config.layers[this.AttributeLayerIndex].expressions.expression.length;
        for (var e = 0; e < elen; e++) {
          var eoption = {
            value: e,
            label: this.config.layers[this.AttributeLayerIndex].expressions.expression[e].alias
          };
          express.push(eoption);
          if (e === 0) {
            express[e].selected = true;
          }
        }
        this.selectExpression.addOption(express);
      },

      _initDrawBox: function () {
        this.drawBox.setMap(this.map);
        this.own(on(this.drawBox, 'DrawEnd', lang.hitch(this, function (graphic) {
          if(!this.cbxMultiGraphic.checked){
            if(this.keepgraphicalsearchenabled && this.drawBox.activate){
              this.drawBox.activate(this.drawBox.lastTool);
            }else{
              this.map.enableMapNavigation();
            }
            if (graphic.geometry.type === "point" && this.cbxAddTolerance.checked){
              var ext = this.pointToExtent(graphic.geometry, this.pointSearchTolerance);
              this.search(ext, this.graphicLayerIndex);
            }else{
              if(this.cbxBufferGraphic.checked){
                this._bufferGeometries([graphic.geometry],new SpatialReference({wkid: this.bufferWKID}),[parseFloat(this.txtBufferValue.get('value'))],this.bufferUnits.get('value'),true);
              }else{
                this.search(graphic.geometry, this.graphicLayerIndex);
              }
            }
          }else{
            this.garr.push(graphic);
            if(this.keepgraphicalsearchenabled && this.drawBox.activate){
              this.drawBox.activate(this.drawBox.lastTool);
            }
          }
        })));
        this.own(on(this.btnExport, "click", lang.hitch(this, this.exportURL)));
        this.own(on(this.btnClear, "click", lang.hitch(this, this.clear)));
        this.own(on(this.btnClear2, "click", lang.hitch(this, this.clear)));
        this.own(on(this.btnClearBuffer, "click", lang.hitch(this, this.clearbuffer)));
        this.own(on(this.btnClearBuffer2, "click", lang.hitch(this, this.clearbuffer)));
        this.own(on(this.btnClearBuffer3, "click", lang.hitch(this, this.clearbuffer)));
        this.own(on(this.btnZoomAll, "click", lang.hitch(this, this.zoomall)));
        html.setStyle(this.btnZoomAll, 'display', 'none');
        html.setStyle(this.btnClearBuffer, 'display', 'none');
        html.setStyle(this.btnClearBuffer2, 'display', 'none');
        html.setStyle(this.btnClearBuffer3, 'display', 'none');
        html.setStyle(this.btnClear, 'display', 'none');
        html.setStyle(this.btnClear2, 'display', 'none');
        html.setStyle(this.btnExport, 'display', 'none');
      },

      exportURL: function(){
        var useSeparator, eVal;
        var url = window.location.protocol + '//' + window.location.host + window.location.pathname;
        var urlObject = urlUtils.urlToObject(window.location.href);
        urlObject.query = urlObject.query || {};
        var content = this.paramsDijit.getSingleParamValues();
        for(var s=0; s<content.length; s++){
          eVal = content[s].value.toString();
        }

        urlObject.query.esearch = eVal;
        urlObject.query.slayer = this.AttributeLayerIndex.toString();
        urlObject.query.exprnum = this.expressIndex.toString();
        // each param
        for (var i in urlObject.query) {
          if (urlObject.query[i] && urlObject.query[i] !== 'config') {
            // use separator
            if (useSeparator) {
              url += '&';
            } else {
              url += '?';
              useSeparator = true;
            }
            url += i + '=' + urlObject.query[i];
          }
        }
        /*new Message({
          titleLabel: "eSearch widget url search string.",
          message: url
        });*/
        window.prompt(this.nls.copyurlprompt, url);
      },

      _bufferFeatures: function() {
        if (this.currentLayerAdded &&  this.currentLayerAdded.graphics.length > 0){
          var geoms = array.map(this.currentLayerAdded.graphics, function(gra){
            return gra.geometry;
          });
          this._bufferGeometries(geoms, new SpatialReference({wkid: this.bufferWKID}),[parseFloat(this.txtBufferValueSpat.get('value'))],this.bufferUnitsSpat.get('value'),false);
        }else{
          new Message({
            titleLabel: this.nls.bufferSearchErrorTitle,
            message: this.nls.bufferMessage
          });
        }
      },

      onSearch: function () {
        var content = this.paramsDijit.getSingleParamValues();
        if (!content || content.length === 0 || !this.config.layers.length) {
          return;
        }
        this.search(null, this.AttributeLayerIndex, this.expressIndex);
      },

      _onBtnGraSearchClicked: function(){
        if(!this.keepgraphicalsearchenabled){
          this.map.enableMapNavigation();
        }
        if(this.cbxBufferGraphic.checked){
          var geoms = array.map(this.garr, function(gra){
            return gra.geometry;
          });
          this._bufferGeometries(geoms,new SpatialReference({wkid: this.bufferWKID}),[parseFloat(this.txtBufferValue.get('value'))],this.bufferUnits.get('value'),true);
        }else{
          this.search(this.unionGeoms(this.garr), this.graphicLayerIndex);
        }
      },

      _onCbxMultiGraphicClicked: function() {
        if(this.cbxMultiGraphic.checked){
          html.setStyle(this.btnGraSearch, 'display', 'inline-block');
        }else{
          html.setStyle(this.btnGraSearch, 'display', 'none');
        }
      },

      unionGeoms: function (gArray){
        var retGeom;
        var mPoint = new Multipoint(this.map.spatialReference);
        var mPoly = new Polygon(this.map.spatialReference);
        var mPolyL = new Polyline(this.map.spatialReference);
        var rType;
        this.polygonsToDiscard = [];
        if(gArray.length > 0 && gArray[0].geometry.type === "polygon"){
          //For each polygon, test if another polgon exists that contains the first polygon.
          //If it does, the polygon will not be included in union operation and it will added to the polygonsToDiscard array.
          dojo.forEach(gArray, lang.hitch(this, function(graphic){
            var poly1 = graphic.geometry;
            dojo.forEach(this.gArray, lang.hitch(this, function(aGraphic){
              var aPoly = aGraphic.geometry;
                if(aPoly.extent.contains(this.graphic.geometry) && (aPoly.extent.center.x !== poly1.extent.center.x || aPoly.extent.center.y !== poly1.extent.center.y)){
                  this.polygonsToDiscard.push(poly1);
                }
            }));
          }));
        }
        //globals
        var poly,
            ext,
            i,
            j,
            mp,
            ringArray;
        dojo.forEach(gArray, lang.hitch(this, function(graphic){
          if(graphic.geometry.type === "point" && !this.cbxAddTolerance.checked){
            mPoint.addPoint(graphic.geometry);
            rType = "point";
          }else if (graphic.geometry.type === "point" && this.cbxAddTolerance.checked){
            ext = this.pointToExtent(graphic.geometry, this.pointSearchTolerance);
            ringArray = this.extentToMPArray(ext);
            mPoly.addRing(ringArray);
            rType = "poly";
            mPoly.spatialReference = ext.spatialReference;
          }
          if(graphic.geometry.type === "multipoint"){
            var mp1 = graphic.geometry;
            var pnts;
            for (var p=0;p < mp1.points.length; p++){
              mPoint.addPoint(mp1.points[p]);
            }
            rType = "point";
          }
          if(graphic.geometry.type === "polyline"){
            var polyl = graphic.geometry;
            for(var l=polyl.paths.length-1; l >= 0; l--){
              var pathArray = [];
              for (j = 0; j < polyl.paths[l].length; j++){
                mp = polyl.getPoint(l,j);
                mp.spatialReference = polyl.spatialReference;
                pathArray.push(mp);
              }
              mPolyL.addPath(pathArray);
            }
            rType = "line";
          }
          if(graphic.geometry.type === "extent"){
            ext = graphic.geometry;
            ringArray = this.extentToMPArray(ext);
            mPoly.addRing(ringArray);
            rType = "poly";
            mPoly.spatialReference = ext.spatialReference;
          }
          if(graphic.geometry.type === "polygon"){
            poly = graphic.geometry;
            //Consider only the rings that not coincide with any polygon ring on polygonsToDiscard array.
            var targetRings = [];
            for (var m = 0; m < poly.rings.length; m++){
              var polygonToDiscard;
              var targetRing = [];
              var targetPolygon = new Polygon([poly.rings[m]], poly.spatialReference);
              var add = true;
              if (this.polygonsToDiscard.length > 0){
                for (polygonToDiscard in this.polygonsToDiscard){
                  add = true;
                  if (targetPolygon.extent.center.x === polygonToDiscard.extent.center.x && targetPolygon.extent.center.y === polygonToDiscard.extent.center.y) {
                    add = false;
                    break;
                  }
                }
                if(add){
                  targetRing[0] = m;
                  targetRing[1] = poly.rings[m];
                  targetRings.push(targetRing);
                }
              }else{
                targetRing[0] = m;
                targetRing[1] = poly.rings[m];
                targetRings.push(targetRing);
              }
            }
            for (var i2 = targetRings.length - 1; i2 >=0; i2--){
              ringArray = [];
              for (var j1 = 0; j1 < targetRings[i2][1].length; j1++){
                var mp2 = poly.getPoint(i2,j1);
                mp2.spatialReference = poly.spatialReference;
                ringArray.push(mp2);
              }
              mPoly.addRing(ringArray);
            }
            rType = "poly";
            mPoly.spatialReference = poly.spatialReference;
          }
        }));

        switch(rType){
          case "point":{
            retGeom = mPoint;
            break;
          }
          case "poly":{
            retGeom = mPoly;
            break;
          }
          case "line":{
            retGeom = mPolyL;
            break;
          }
        }
        this.garr = [];
        return retGeom;
      },

      pointToExtent: function(objPoint, distance){
        var clickOffset = distance || 6;
        var centerPoint = new Point(objPoint.x,objPoint.y,objPoint.spatialReference);
        var mapWidth = this.map.extent.getWidth();
        var pixelWidth = mapWidth/this.map.width;
        var tolerance = clickOffset * pixelWidth;
        var queryExtent = new Extent(1,1,tolerance,tolerance,objPoint.spatialReference);
        return queryExtent.centerAt(centerPoint);
      },

      extentToPolygon: function(extent){
        var polygon = new Polygon([extent.xmax,extent.ymax],[extent.xmax,extent.ymin],[extent.xmin,extent.ymin],[extent.xmin,extent.ymax],[extent.xmax,extent.ymax]);
        polygon.setSpatialReference(this.map.spatialReference);
        return polygon;
      },

      extentToMPArray: function(extent){
        var MPArr = [[extent.xmax,extent.ymax],[extent.xmax,extent.ymin],[extent.xmin,extent.ymin],[extent.xmin,extent.ymax],[extent.xmax,extent.ymax]];
        return MPArr;
      },

      checkforenterkey: function (evt) {
        var keyNum = evt.keyCode !== undefined ? evt.keyCode : evt.which;
        if (keyNum === 13) {
          this.search(null, this.AttributeLayerIndex, this.expressIndex);
        }
      },

      search: function (geometry, layerIndex, /* optional */expressIndex, theValue, spatialRelationship) {
        if (!this.config.layers) {
          return;
        }
        if (this.config.layers.length === 0) {
          return;
        }
        var content;
        var query = new Query();
        this.clear();
        this.currentLayerIndex = layerIndex;
        this.tabContainer.selectTab(this.nls.results);

        if (geometry) {
          this.initiator = 'graphical';
          query.geometry = geometry;
          query.spatialRelationship = spatialRelationship || Query.SPATIAL_REL_INTERSECTS;
        } else {
          this._clearLayers();
          this.initiator = 'attribute';
          var where = this.buildWhereClause(layerIndex, expressIndex, theValue);
          query.where = where;
          console.info(where);
        }

        html.setStyle(this.progressBar.domNode, 'display', 'block');
        html.setStyle(this.divOptions, 'display', 'none');
        var fields = [];
        if (this.config.layers[layerIndex].fields.all) {
          fields[0] = "*";
        } else {
          for (var i = 0, len = this.config.layers[layerIndex].fields.field.length; i < len; i++) {
            fields[i] = this.config.layers[layerIndex].fields.field[i].name;
          }
        }
        if(!this.config.layers[layerIndex].existObjectId){
          fields.push(this.config.layers[layerIndex].objectIdField);
        }
        var url = this.config.layers[layerIndex].url;
        var queryTask = new QueryTask(url);
        query.returnGeometry = true;
        query.outSpatialReference = this.map.spatialReference;
        query.outFields = fields;
        queryTask.execute(query, lang.hitch(this, this._onSearchFinish, layerIndex), lang.hitch(this, this._onSearchError));
      },

      clear: function () {
        this.currentLayerIndex = null;
        this.initiator = null;
        this._hideInfoWindow();
        this._clearLayers();
        if(this.list.items.length > 0){
          this.tabContainer.selectTab(this.selTab);
        }
        this.list.clear();
        this.divResultMessage.textContent = this.nls.noResults;
        this.drawBox.clear();
        this.garr = [];
        return false;
      },

      clearbuffer: function () {
        this.garr = [];
        this.graphicsLayerBuffer.clear();
        html.setStyle(this.btnClearBuffer, 'display', 'none');
        html.setStyle(this.btnClearBuffer2, 'display', 'none');
        html.setStyle(this.btnClearBuffer3, 'display', 'none');
        return false;
      },

      buildWhereClause: function(layerIndex, expressIndex, /* optional */ theValue){
        var myPattern = /\[value\]/g;
        var myPattern1 = /\[value1\]/g;
        var myPattern2 = /\[value2\]/g;
        var myPattern3 = /\[value\]/;
        var expr = "";
        var eVal;
        var eVal1;
        var eVal2;
        var criteriaFromValue;
        var content = theValue || this.paramsDijit.getSingleParamValues();
        //console.info(content);
        if (!content || content.length === 0 || !this.config.layers.length) {
          return;
        }
        //loop though the SPs and assemble the where clause
        for(var s=0; s<content.length; s++){
          var tOperator = typeof this.config.layers[layerIndex].expressions.expression[expressIndex].values.value[s].operator !== 'undefined' ? this.config.layers[layerIndex].expressions.expression[expressIndex].values.value[s].operator : 'OR';
          var tOperation = this.config.layers[layerIndex].expressions.expression[expressIndex].values.value[s].operation;
          var queryExpr = this.config.layers[layerIndex].expressions.expression[expressIndex].values.value[s].sqltext;
          if(content[s].value === null){
            if(content[s].value1 && content[s].value2){
              eVal1 = content[s].value1.toString();
              eVal2 = content[s].value2.toString();
              criteriaFromValue = queryExpr.replace(myPattern1, eVal1);
              criteriaFromValue = criteriaFromValue.replace(myPattern2, eVal2);
              expr = this.AppendTo(expr, criteriaFromValue, tOperator);
              continue;
            }else{
              continue;
            }
          }

          if (tOperation === 'dateOperatorIsOn' || tOperation === 'dateOperatorIsNotOn'){
            eVal = content[s].value.toString();
            criteriaFromValue = queryExpr.replace(myPattern3, eVal);
            criteriaFromValue = criteriaFromValue.replace(myPattern3, eVal.replace('00:00:00', '23:59:59'));
            expr = this.AppendTo(expr, criteriaFromValue, tOperator);
            continue;
          } else if (tOperation === 'dateOperatorIsAfter'){
            eVal = content[s].value.toString();
            criteriaFromValue = queryExpr.replace(myPattern, eVal.replace('00:00:00', '23:59:59'));
            expr = this.AppendTo(expr, criteriaFromValue, tOperator);
            continue;
          }

          if (queryExpr === "[value]" || queryExpr.toLowerCase().indexOf(" in (") > 0){
            //meaning an open SQL expression or an SQL with an IN Statement
            eVal = content[s].value.toString();
          }else{
            eVal = content[s].value.toString().replace(/'/g,"''");
          }

          /*If the expression is an IN Statement and the the value is a string then
          replace the user defines comma seperated values with single quoted values*/
          if(queryExpr.toLowerCase().indexOf(" in (") > 0 && queryExpr.toLowerCase().indexOf("'[value]'") > -1){
            //replace the begining and trailing single qoutes if they exist
            eVal = eVal.replace(/^'|'$/g, "").replace(/,|','/g, "','");
          }
//todo consider adding back the required flag
          /*if (sItemVal.isValueRequired && !sItemVal.hasAValue()){()
            // no value specified so skip this part of where clause
            continue;
          };*/

          if(content[s].value.toString().toLowerCase().trim() === "all"){
            var mExpr;
            if(queryExpr.indexOf("=") > -1){
              mExpr = queryExpr.replace("=", "IN(") + ")";
            }else{
              mExpr = queryExpr;
            }
            var uList = this.config.layers[layerIndex].expressions.expression[expressIndex].values.value[s].userlist;
            var myPat;
            var uaList;
            if (uList.indexOf("','") > -1){
              myPat = /,\s*'all'/gi;
              uList = uList.replace(myPat, "");
              uaList = this.trimArray(uList.split("','"));
              if (String(uaList[0]).substring(0,1) === "'"){
                  uaList[0] = String(uaList[0]).substring(1);
              }
              var lVal = String(uaList[uaList.length - 1]);
              if (lVal.substring(lVal.length - 1) === "'"){
                  uaList[uaList.length - 1] = lVal.substring(0,lVal.length - 1);
              }
            }else{
              myPat = /,\s*all/gi;
              uList = uList.replace(myPat, "");
              uaList = this.trimArray(uList.split(","));
            }

            if(mExpr.indexOf("'[value]'") > -1){
              uList = uaList.join("','");
            }
            criteriaFromValue = mExpr.replace(myPattern, uList);
            expr = this.AppendTo(expr, criteriaFromValue, tOperator);
          }else if(content[s].value.toString().toLowerCase() === "allu"){
            expr = this.AppendTo(expr, "1=1", tOperator);
          }else if(content[s].value.toString().toLowerCase() === "null" || content[s].value.toString().toLowerCase() === "nan"){
            var mExpr2 = queryExpr.substr(0, queryExpr.indexOf("=")) + " is null";
            expr = this.AppendTo(expr, mExpr2, tOperator);
          }else{
            //don't add the expression if there is no user input
            if(eVal !== ""){
              criteriaFromValue = queryExpr.replace(myPattern, eVal);
              expr = this.AppendTo(expr, criteriaFromValue, tOperator);
            }
          }
        }
        return expr;
      },

      AppendTo:function(string1, string2, operator){
        if (string1.length > 0){
          return string1 + " " + operator + " " + string2;
        }else{
          return string2;
        }
      },

      trimArray: function (arr){
        for(var i=0;i<arr.length;i++)
        {
          arr[i] = arr[i].replace(/^\s*/, '').replace(/\s*$/, '');
        }
        return arr;
      },

      zoomall: function () {
        var defaultZoomScale = this.config.zoomScale;
        var layerConfig = this.config.layers[this.currentLayerIndex];
        var zoomScale = layerConfig.zoomScale || defaultZoomScale;
        if (!this.currentLayerAdded){
          return false;
        }

        if(this.currentLayerAdded.graphics.length === 1 && this.currentLayerAdded.graphics[0].geometry.type === "point"){
          var mp = this.currentLayerAdded.graphics[0].geometry;
          this.map.setScale(zoomScale);
          this.map.centerAt(mp);
        }else{
          var gExt = graphicsUtils.graphicsExtent(this.currentLayerAdded.graphics);
          if (gExt){
            this.map.setExtent(gExt.expand(1.5), true);
          }else{
            var mp2 = this.currentLayerAdded.graphics[0].geometry;
            this.map.setScale(zoomScale);
            this.map.centerAt(mp2);
          }
        }
        return false;
      },

      _clearLayers: function () {
        array.forEach(this.resultLayers, lang.hitch(this, function (layer) {
          if (typeof layer === GraphicsLayer) {
            layer.clear();
          }
        }));
        this._removeAllResultLayers();
        html.setStyle(this.btnZoomAll, 'display', 'none');
        html.setStyle(this.btnClear, 'display', 'none');
        html.setStyle(this.btnClear2, 'display', 'none');
        html.setStyle(this.btnExport, 'display', 'none');
      },

      _onSearchError: function (error) {
        this.clear();
        html.setStyle(this.progressBar.domNode, 'display', 'none');
        html.setStyle(this.divOptions, 'display', 'block');
        new Message({
          message: this.nls.searchError
        });
        console.debug(error);
      },

      _substitute:function(string, Attribs){
        var lfields = this._getFieldsfromLink(string);
        for (var lf=0; lf<lfields.length; lf++){
          if(Attribs[lfields[lf]]){
            string = string.replace(new RegExp('{' + lang.trim(lfields[lf]) + '}', 'g'), lang.trim(Attribs[lfields[lf]]));
          }
        }
        return string;
      },

      _getFieldsfromLink:function(strLink) {
        var retArr = [];
        var b1 = 0;
        var e1 = 0;
        var fldName = '';
        do{
          b1 = strLink.indexOf("{", e1);
          if(b1 === -1 ){break;}
          e1 = strLink.indexOf("}", b1);
          fldName = strLink.substring(b1 + 1,e1);
          retArr.push(fldName);
        } while(e1 < strLink.length - 1);
        return retArr;
      },

      _onSearchFinish: function (layerIndex, results) {
        var layerConfig = this.config.layers[layerIndex];
        var currentLayer;
        var showAttachments = false;
        if('showattachments' in layerConfig && layerConfig.showattachments){
          showAttachments = true;
        }
        var featureCollection = {
          layerDefinition: this.resultLayers[layerIndex],
          featureSet: null
        };
        var featureLayer = new FeatureLayer(featureCollection);
        if (layerConfig.definitionexpression){
          featureLayer.setDefinitionExpression(layerConfig.definitionexpression);
        }
        array.map(featureLayer.fields, lang.hitch(this, function(element, index, array){
          element.show = false;
          for(var f = 0; f<layerConfig.fields.field.length; f++){
            if(layerConfig.fields.field[f].name == element.name){
              element.show = true;
            }
          }
        }));
        currentLayer = featureLayer;

        this.tabContainer.selectTab(this.nls.results);
        html.setStyle(this.progressBar.domNode, 'display', 'none');
        html.setStyle(this.divOptions, 'display', 'block');

        var title = "";
        var titlefield = layerConfig.titlefield;
        var objectIdField = layerConfig.objectIdField;
        var existObjectId = layerConfig.existObjectId;

        var len = results.features.length;
        if (len === 0) {
          this.divResultMessage.textContent = this.nls.noResults;
          return;
        } else {
          this.divResultMessage.textContent = this.nls.featuresSelected + results.features.length;
        }
        for (var i = 0; i < len; i++) {
          var featureAttributes = results.features[i].attributes;

          //work with the links now
          var qLinks = [];
          if(layerConfig.links && layerConfig.links.link){
            qLinks = layerConfig.links.link;
          }
          var lyrQLinks = [];
          for (var a = 0; a < qLinks.length; a++){
            var link = "",
                alias = "",
                linkicon = "",
                linkFieldNull = false,
                disableInPopUp = false,
                popupType;
            if(qLinks[a].disableinpopup){
              disableInPopUp = true;
            }
            if(qLinks[a].disablelinksifnull){
              var lfields = this._getFieldsfromLink(qLinks[a].content);
              for (var lf=0; lf<lfields.length; lf++){
                if(!featureAttributes[lfields[lf]] || featureAttributes[lfields[lf]] === ""){
                  linkFieldNull = true;
                  break;
                }
              }
            }
            if(linkFieldNull){
              link = "";
            }else{
              link = this._substitute(qLinks[a].content, featureAttributes);
            }
            var sub = this._substitute(qLinks[a].alias, featureAttributes);
            alias = (sub) ? sub : qLinks[a].alias;
            linkicon = this._substitute((qLinks[a].icon || this.folderUrl + 'images/w_link.png'), featureAttributes);
            popupType = qLinks[a].popuptype;
            var lObj ={
              link: link,
              icon: linkicon,
              alias: alias,
              disableinpopup: disableInPopUp,
              popuptype: popupType
            };
            lyrQLinks.push(lObj);
          }

          var type = results.features[i].geometry.type;
          var line = "",
            br = "",
            label = "",
            content = "",
            value = "";
          for (var att in featureAttributes) {
            var fld = this._getField(currentLayer, att);
            if(!existObjectId && fld.name === objectIdField){
              continue;
            }
            var fieldValue =featureAttributes[att];
            value = fieldValue ? String(fieldValue) : "";
            if (value) {
              var isDateField,
                dateFormat = "";
              if (fld) {
                isDateField = fld.type === "esriFieldTypeDate";
              }
              if (isDateField) {
                var dateMS = Number(value);
                if (!isNaN(dateMS)) {
                  if (this._getDateFormat(att, layerIndex) !== "") {
                    value = this._formatDate(dateMS, this._getDateFormat(att, layerIndex));
                  } else {
                    value = this._formatDate(dateMS, 'MM/dd/yyyy');
                  }
                }
              }
              var numFormat = this._getNumberFormat(att, layerIndex);
              if(numFormat){
                var args = numFormat.split("|");
                /*value,percision,symbol,thousands,decimal*/
                value = this._formatNumber(fieldValue,args[0]||null,args[1]||null,args[2]||null);
              }
              var currFormat = this._getCurrencyFormat(att, layerIndex);
              if(currFormat){
                var args2 = currFormat.split("|");
                /*value,percision,symbol,thousands,decimal*/
                value = this._formatCurrency(fieldValue,args2[1]||null,args2[0]||null,args2[2]||null,args2[3]||null);
              }
              var typeID = currentLayer.typeIdField ? featureAttributes[currentLayer.typeIdField] : null;
              if (att === currentLayer.typeIdField) {
                var featureType = this._getFeatureType(currentLayer, typeID);
                if (featureType && featureType.name) {
                  value = featureType.name;
                }
              } else {
                var codedValue = this._getCodedValue(currentLayer, att, value, typeID);
                if (codedValue) {
                  value = codedValue.name;
                }
              }
            }
            if(this._isVisible(att, layerIndex)){
              label = label + line + this._getAlias(att, layerIndex) + ": " + value;
              line = ", ";
            }
            var upperCaseFieldName = att.toUpperCase();
            if (titlefield && upperCaseFieldName === titlefield.toUpperCase()) {
              title = value;
            } else {
              if(this._isVisible(att, layerIndex)){
                content = content + br + this._getAlias(att, layerIndex) + ": " + value;
                br = "<br>";
              }
            }
          }
          var symbol;
          switch (type) {
          case "multipoint":
          case "point":
            if (this.config.symbols && this.config.symbols.simplemarkersymbol) {
              symbol = new SimpleMarkerSymbol(this.config.symbols.simplemarkersymbol);
            } else {
              if (this.config.symbols && this.config.symbols.picturemarkersymbol) {
                symbol = new PictureMarkerSymbol(this.config.symbols.picturemarkersymbol);
              } else {
                symbol = new SimpleMarkerSymbol();
              }
            }
            break;
          case "polyline":
            if (this.config.symbols && this.config.symbols.simplelinesymbol) {
              symbol = new SimpleLineSymbol(this.config.symbols.simplelinesymbol);
            } else {
              symbol = new SimpleLineSymbol();
            }
            break;
          case "extent":
          case "polygon":
            if (this.config.symbols && this.config.symbols.simplefillsymbol) {
              symbol = new SimpleFillSymbol(this.config.symbols.simplefillsymbol);
            } else {
              symbol = new SimpleFillSymbol();
            }
            break;
          default:
            break;
          }
          if(this.config.layers[layerIndex].layersymbolfrom === 'server'){
            symbol = currentLayer.renderer.getSymbol(results.features[i]);
          }

          this.list.add({
            id: "id_" + i,
            label: label,
            title: title,
            content: content,
            alt: (i % 2 === 0),
            sym: symbol,
            links: lyrQLinks,
            showattachments: showAttachments
          });
        }
        this._drawResults(layerIndex, results, currentLayer);
        html.setStyle(this.btnZoomAll, 'display', 'block');
        html.setStyle(this.btnClear, 'display', 'block');
        html.setStyle(this.btnClear2, 'display', 'block');
        if(this.initiator && this.initiator === 'attribute'){
          html.setStyle(this.btnExport, 'display', 'block');
        }
      },

      _openResultInAttributeTable: function (currentLayer, layerIndex) {
        var layerConfig = this.config.layers[layerIndex];
        //currentLayer.url = layerConfig.url;
        var aLayer = {
          layerObject: currentLayer,
          title: currentLayer.name,
          id: currentLayer.id,
          url: layerConfig.url,
          getLayerObject: function(){
            var def = new Deferred();
            if (this.layerObject) {
              def.resolve(this.layerObject);
            } else {
              def.reject("layerObject is null");
            }
            return def;
          }
        };
        this.publishData({
          'target': 'AttributeTable',
          'layer': Object.create(aLayer)
        });
      },

      _getFeatureType: function (layer, typeID) {
        var result;
        if (layer) {
          for (var t = 0; t < layer.types.length; t++) {
            var featureType = layer.types[t];
            if (typeID === featureType.id) {
              result = featureType;
              break;
            }
          }
        }
        return result;
      },

      _getCodedValue: function (layer, fieldName, fieldValue, typeID) {
        var result;
        var codedValueDomain;
        if (typeID) {
          var featureType = this._getFeatureType(layer, typeID);
          if (featureType) {
            codedValueDomain = featureType.domains[fieldName];
          }
        } else {
          var field = this._getField(layer, fieldName);
          if (field) {
            codedValueDomain = field.domain;
          }
        }
        if (codedValueDomain) {
          if(codedValueDomain.type === 'codedValue'){
            for (var cv = 0; cv < codedValueDomain.codedValues.length; cv++) {
              var codedValue = codedValueDomain.codedValues[cv];
              if (fieldValue === codedValue.code) {
                result = codedValue;
                break;
              }
            }
          }
        }
        return result;
      },

      _getField: function (layer, fieldName) {
        var result;
        if (layer) {
          for (var f = 0; f < layer.fields.length; f++) {
            var field = layer.fields[f];
            if (fieldName === field.name) {
              result = field;
              break;
            }
          }
        }
        return result;
      },

      _formatDate: function (value, dateFormat) {
        if(dateFormat){
            dateFormat = dateFormat.replace(/D/g, "d").replace(/Y/g, "y");
        }
        var inputDate = new Date(value);
        return locale.format(inputDate, {
          selector: 'date',
          datePattern: dateFormat
        });
      },

      _getAlias: function (att, layerIndex) {
        var field = this.config.layers[layerIndex].fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item.name.toLowerCase() === att.toLowerCase() && item.alias) {
            return item.alias;
          }
        }
        return att;
      },

      _isVisible: function (att, layerIndex) {
        var field = this.config.layers[layerIndex].fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item.name.toLowerCase() === att.toLowerCase()) {
            if (item.hasOwnProperty('visible') && item.visible === false) {
              return false;
            }else{
              return true;
            }
          }
        }
        return true;
      },

      _getDateFormat: function (att, layerIndex) {
        var field = this.config.layers[layerIndex].fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item.name.toLowerCase() === att.toLowerCase() && item.dateformat) {
            return item.dateformat;
          }
        }
        return "";
      },

      _getCurrencyFormat: function (att, layerIndex) {
        var field = this.config.layers[layerIndex].fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item.name.toLowerCase() === att.toLowerCase() && item.currencyformat) {
            return item.currencyformat;
          }
        }
        return null;
      },

      _formatCurrency: function (value,percision,symbol,thousand,decimal) {
        value = value || 0;
        percision = !isNaN(percision = Math.abs(percision)) ? percision : 2;
        symbol = symbol !== undefined ? symbol : "$";
        thousand = thousand || ",";
        decimal = decimal || ".";
        var negative = value < 0 ? "-" : "",
            i = parseInt(value = Math.abs(+value || 0).toFixed(percision), 10) + "",
            j = (j = i.length) > 3 ? j % 3 : 0;
        return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (percision ? decimal + Math.abs(value - i).toFixed(percision).slice(2) : "");
      },

      _getNumberFormat: function (att, layerIndex) {
        var field = this.config.layers[layerIndex].fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item.name.toLowerCase() === att.toLowerCase() && item.numberformat) {
            return item.numberformat;
          }
        }
        return null;
      },

      _formatNumber: function (value,percision,thousand,decimal) {
        value = value || 0;
        percision = !isNaN(percision = Math.abs(percision)) ? percision : 2;
        thousand = thousand || ",";
        decimal = decimal || ".";
        var negative = value < 0 ? "-" : "",
            i = parseInt(value = Math.abs(+value || 0).toFixed(percision), 10) + "",
            j = (j = i.length) > 3 ? j % 3 : 0;
        return negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (percision ? decimal + Math.abs(value - i).toFixed(percision).slice(2) : "");
      },

      _drawResults: function (layerIndex, results, currentLayer) {
        if(!this.config.shareResult){
          currentLayer = new GraphicsLayer();
          currentLayer.setRenderer(jsonUtil.fromJson(this.resultLayers[layerIndex].drawingInfo.renderer));
        }
        var features = results.features;

        //Determine the geometry type to set the symbology
        var type = features[0].geometry.type;
        var geometry, symbol, centerpoint;
        switch (type) {
        case "multipoint":
        case "point":
          if (this.config.symbols && this.config.symbols.simplemarkersymbol) {
            symbol = new SimpleMarkerSymbol(this.config.symbols.simplemarkersymbol);
          } else {
            if (this.config.symbols && this.config.symbols.picturemarkersymbol) {
              if(this.config.symbols.picturemarkersymbol.url.substring(0,7).toLowerCase === 'images/'){
                this.config.symbols.picturemarkersymbol.url = this.folder + "/" + this.config.symbols.picturemarkersymbol.url;
                symbol = new PictureMarkerSymbol(this.config.symbols.picturemarkersymbol);
              }else{
                symbol = new PictureMarkerSymbol(this.config.symbols.picturemarkersymbol);
              }
            } else {
              symbol = new SimpleMarkerSymbol();
            }
          }
          break;
        case "polyline":
          if (this.config.symbols && this.config.symbols.simplelinesymbol) {
            symbol = new SimpleLineSymbol(this.config.symbols.simplelinesymbol);
          } else {
            symbol = new SimpleLineSymbol();
          }
          break;
        case "extent":
        case "polygon":
          if (this.config.symbols && this.config.symbols.simplefillsymbol) {
            symbol = new SimpleFillSymbol(this.config.symbols.simplefillsymbol);
          } else {
            symbol = new SimpleFillSymbol();
          }
          break;
        default:
          break;
        }
        var renderer = new SimpleRenderer(symbol);

        for (var i = 0, len = features.length; i < len; i++) {
          var feature = features[i];
          var listItem = this.list.items[i];
          type = feature.geometry.type;
          switch (type) {
          case "multipoint":
          case "point":
            centerpoint = feature.geometry;
            break;
          case "polyline":
            centerpoint = feature.geometry.getPoint(0, 0);
            break;
          case "extent":
          case "polygon":
            centerpoint = feature.geometry.getExtent().getCenter();
            break;
          default:
            break;
          }

          listItem.centerpoint = centerpoint;
          feature.setInfoTemplate(this._configurePopupTemplate(listItem));
          currentLayer.add(feature);
          listItem.graphic = feature;
        }
        if(this.config.layers[layerIndex].layersymbolfrom === 'config'){
          currentLayer.setRenderer(renderer);
        }
        this.map.addLayer(currentLayer);
        this.operationalLayers.push(currentLayer);
        this.currentLayerAdded = currentLayer;
        if(this.autozoomtoresults){
          this.zoomall();
        }
        if(this.config.shareResult){
          setTimeout(lang.hitch(this,function(){
            this._openResultInAttributeTable(currentLayer, layerIndex);
          }), 300);
        }
      },

      _configurePopupTemplate: function(listItem){
        var popUpInfo = {};
        popUpInfo.title = listItem.title;
        popUpInfo.description = listItem.title + "<br>" + listItem.content;
        popUpInfo.showAttachments = listItem.showattachments;
        var pminfos = [];
        var popUpMediaInfo;

        for(var l=0; l<listItem.links.length; l++){
          if (listItem.links[l].link){
            var pos = listItem.links[l].link.length - 4;
            var sfx = String(listItem.links[l].link).substr(pos, 4).toLowerCase();
            if (((sfx === ".jpg") || (sfx === ".png") || (sfx === ".gif")) && listItem.links[l].popuptype !== "text"){ // use PopUpMediaInfo if it is an image
              popUpMediaInfo = {};
              popUpMediaInfo.type = "image";
              var val = {};
              val.sourceURL = listItem.links[l].link;
              val.linkURL = listItem.links[l].link;
              popUpMediaInfo.value = val;
              popUpMediaInfo.caption = listItem.links[l].alias;
              pminfos.push(popUpMediaInfo);
            }else if(listItem.links[l].icon !== "" && listItem.links[l].popuptype !== "text"){
              popUpMediaInfo = {};
              popUpMediaInfo.type = 'image';
              popUpMediaInfo.value = {};
              popUpMediaInfo.value.sourceURL = listItem.links[l].icon;
              popUpMediaInfo.value.linkURL = listItem.links[l].link;
              popUpMediaInfo.caption = listItem.links[l].alias;
              pminfos.push(popUpMediaInfo);
            }else{
              if(!listItem.links[l].disableinpopup){
                var lText = (listItem.links[l].alias !== "") ? listItem.links[l].alias : listItem.links[l].link;
                popUpInfo.description += "<br><a href='" + listItem.links[l].link + "'>" + lText + "</a>";
              }
            }
          }
        }
        if(pminfos.length > 0){
          popUpInfo.mediaInfos = pminfos;
        }
        //console.info(popUpInfo);
        var pt = new PopupTemplate(popUpInfo);
        return pt;
      },

      _selectResultItem: function (index, item) {
        var point = this.list.items[this.list.selectedIndex].centerpoint;
        var defaultZoomScale = this.config.zoomScale;
        var layerConfig = this.config.layers[this.currentLayerIndex];
        var zoomScale = layerConfig.zoomScale || defaultZoomScale;
        if (this.map.getScale() > zoomScale) {
          this.map.setScale(zoomScale).then(this.map.centerAt(point).then(lang.hitch(this, function () {
            if (this.map.infoWindow) {
              this.map.infoWindow.setFeatures([item.graphic]);
              if (this.map.infoWindow.reposition) {
                this.map.infoWindow.reposition();
              }
              this.map.infoWindow.show(item.centerpoint);
            }
          })));
        }else{
          this.map.centerAt(point).then(lang.hitch(this, function () {
          if (this.map.infoWindow) {
            this.map.infoWindow.setFeatures([item.graphic]);
            if (this.map.infoWindow.reposition) {
              this.map.infoWindow.reposition();
            }
            this.map.infoWindow.show(item.centerpoint);
          }
        }));
        }
      },

      _hideInfoWindow: function () {
        if (this.map && 　this.map.infoWindow) {
          this.map.infoWindow.hide();
        }
      }

    });
  });
