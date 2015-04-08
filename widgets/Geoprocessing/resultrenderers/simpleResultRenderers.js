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

define(['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/on',
  "dojo/store/Memory",
  'dgrid/OnDemandGrid',
  'esri/layers/GraphicsLayer',
  'esri/layers/FeatureLayer',
  'esri/graphicsUtils',
  'esri/renderers/SimpleRenderer',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/SimpleFillSymbol',
  'esri/renderers/jsonUtils',
  'esri/InfoTemplate',
  '../BaseResultRenderer'
],
function(declare, lang, array, html, on, Memory, OnDemandGrid, GraphicsLayer, FeatureLayer,
  graphicsUtils, SimpleRenderer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
  rendererUtils, InfoTemplate, BaseResultRenderer) {
  var mo = {};

  mo.UnsupportRenderer = declare(BaseResultRenderer, {
    baseClass: 'jimu-gp-resultrenderer-base jimu-gp-renderer-unsupport',

    postCreate: function(){
      this.inherited(arguments);
      html.setAttr(this.domNode, 'innerHTML', this.message);
    }
  });

  mo.SimpleResultRenderer = declare(BaseResultRenderer, {
    baseClass: 'jimu-gp-resultrenderer-base jimu-gp-renderer-simple',

    postCreate: function(){
      this.inherited(arguments);
      html.setAttr(this.domNode, 'innerHTML', this.message);
    }
  });

  mo.ErrorResultRenderer = declare(BaseResultRenderer, {
    baseClass: 'jimu-gp-resultrenderer-base jimu-gp-renderer-error',

    postCreate: function(){
      this.inherited(arguments);
      html.setAttr(this.domNode, 'innerHTML', this.message);
    }
  });

  mo.RecordSetTable = declare([BaseResultRenderer], {
    baseClass: 'jimu-gp-resultrenderer-base jimu-gp-renderer-table',

    postCreate: function(){
      this.inherited(arguments);
      var fields = [];
      if(this.value.fields){
        fields = this.value.fields;
      }else if(this.value.features && this.value.features.length > 0){
        for(var p in this.value.features[0].attributes){
          fields.push({
            name: p
          });
        }
      }

      var columns = array.map(fields, function(field){
        return {
          label: field.name,
          field: field.name
        };
      });

      var data = array.map(this.value.features, function(feature){
        return feature.attributes;
      });

      var memStore = new Memory({
        data: data
      });

      this.table = new OnDemandGrid({
        columns: columns,
        store: memStore
      }, this.domNode);
    },
    startup: function(){
      this.inherited(arguments);
      this.table.startup();
    }
  });

  mo.DrawResultFeatureSet = declare(BaseResultRenderer, {
    baseClass: 'jimu-gp-resultrenderer-base jimu-gp-renderer-draw-feature',

    postCreate: function(){
      this.inherited(arguments);
      this._createDisplayText();
      this._drawResultFeature(this.param, this.value);
    },

    destroy: function(){
      if(this.resultLayer){
        this.map.removeLayer(this.resultLayer);
      }
      this.inherited(arguments);
    },

    _createDisplayText: function(){
      html.create('span', {
        innerHTML: this.nls.drawnOnMap,
        style: {
          marginLeft: '15px'
        }
      }, this.domNode);

      /* jshint scripturl:true */
      var clearNode = html.create('a', {
        innerHTML: this.nls.clear,
        href: '#',
        style: {
          'float': window.isRTL? 'left': 'right'
        }
      }, this.domNode);

      this.own(on(clearNode, 'click', lang.hitch(this, function(){
        if(this.resultLayer){
          if(this.map.infoWindow.isShowing){
            this.map.infoWindow.hide();
          }
          this.resultLayer.clear();
          //remove layer so it will not displayed in Layer List or Legend widget
          this.map.removeLayer(this.resultLayer);
        }
      })));
    },

    _drawResultFeature: function(param, featureset){
      if(this.config.shareResults){
        if(!param.defaultValue || !param.defaultValue.geometryType){
          throw Error('Output parameter default value does not provide enough information' +
            ' to draw feature layer.');
        }
        param.defaultValue.name = param.name;
        var featureCollection = {
          layerDefinition: param.defaultValue,
          featureSet: null
        };
        this.resultLayer =  new FeatureLayer(featureCollection, {
          id: this.widgetUID + param.name
        });
      }else{
        this.resultLayer =  new GraphicsLayer({
          id: this.widgetUID + param.name
        });
      }

      this._calculateLayerOrder(param.name);

      if(!param.popup){
        param.popup = {
          enablePopup: true,
          title: '',
          fields: []
        };
      }
      var len = featureset.features.length, renderer = param.renderer;
      if(!renderer){
        if(featureset.geometryType === 'esriGeometryPoint'){
          renderer = new SimpleRenderer(new SimpleMarkerSymbol());
        }else if(featureset.geometryType === 'esriGeometryPolyline'){
          renderer = new SimpleRenderer(new SimpleLineSymbol());
        }else if(featureset.geometryType === 'esriGeometryPolygon'){
          renderer = new SimpleRenderer(new SimpleFillSymbol());
        }
      }else{
        renderer = rendererUtils.fromJson(renderer);
      }
      var infoTemplate;
      if(param.popup.enablePopup){
        infoTemplate = new InfoTemplate(param.popup.title, this._generatePopupContent());
      }
      for (var i = 0; i < len; i++) {
        if(infoTemplate){
          featureset.features[i].setInfoTemplate(infoTemplate);
        }
        this.resultLayer.add(featureset.features[i]);
      }
      this.resultLayer.setRenderer(renderer);

      try{
        var extent = graphicsUtils.graphicsExtent(featureset.features);
        if(extent){
          this.resultLayer.fullExtent = extent.expand(1.4);
        }
      }
      catch(e){
        console.error(e);
      }
    },

    _calculateLayerOrder: function(paramName){
      //calculate layer order
      var outputLayerIndex = this.config.layerOrder.indexOf(paramName);
      var operationalLayersIndex = this.config.layerOrder.indexOf('Operational Layers');
      var i;
      var foundLayerId = null;
      var foundLayerIndex = 0;
      var currentLayerId;
      if(operationalLayersIndex > outputLayerIndex){
        //output layer above the operational layer
        //find the buttom most layer index above this layer in the layerOrder
        for(i=outputLayerIndex-1;i>=0;i--){
          currentLayerId = this.widgetUID + this.config.layerOrder[i];
          if(array.indexOf(this.map.graphicsLayerIds,this.config.layerOrder[i]) !== -1){
            //map contains the this layer
            foundLayerId = currentLayerId;
            break;
          }
        }
        if(foundLayerId !== null){
          //add below the layer whose id is foundLayerId
          foundLayerIndex = array.indexOf(this.map.graphicsLayerIds,foundLayerId);
          this.map.addLayer(this.resultLayer, foundLayerIndex);
        }else{
          //add top most
          this.map.addLayer(this.resultLayer);
        }
      }else{
        //output layer below the operational layer
        //find the top most layer index below this layer in the layerOrder
        foundLayerId = null;
        for(i=outputLayerIndex+1;i<this.config.layerOrder.length;i++){
          currentLayerId = this.widgetUID + this.config.layerOrder[i];
          if(array.indexOf(this.map.graphicsLayerIds,this.config.layerOrder[i]) !== -1){
            //map contains the this layer
            foundLayerId = currentLayerId;
            break;
          }
        }
        if(foundLayerId !== null){
          //add above the layer whose id is foundLayerId
          foundLayerIndex = array.indexOf(this.map.graphicsLayerIds,foundLayerId);
          this.map.addLayer(this.resultLayer, foundLayerIndex + 1);
        }else{
          //add buttom most
          this.map.addLayer(this.resultLayer,0);
        }
      }
    },

    _generatePopupContent: function(){
      var str = '';
      array.forEach(this.param.popup.fields, function(field){
        str = str + '<b>' + field.alias + ': </b>${' + field.name + '}<br>';
      });
      return str;
    }
  });

  return mo;
});