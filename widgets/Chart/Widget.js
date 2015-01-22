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
    'dojo/_base/query',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/_base/fx',
    'dojo/promise/all',
    'dojo/on',
    'dojo/Deferred',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/dijit/Message',
    'jimu/dijit/LoadingShelter',
    'jimu/dijit/DrawBox',
    'jimu/utils',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/layers/GraphicsLayer',
    'esri/layers/FeatureLayer',
    'esri/renderers/SimpleRenderer',
    'esri/graphic',
    'esri/geometry/Point',
    'esri/geometry/Polyline',
    'esri/geometry/Extent',
    'esri/InfoTemplate',
    'esri/symbols/jsonUtils',
    'esri/lang',
    'esri/request',
    'esri/graphicsUtils',
    './Preview'
  ],
  function(declare, lang, query, html, array, fx, all, on, Deferred, _WidgetsInTemplateMixin,
    BaseWidget, Message, LoadingShelter, DrawBox, jimuUtils, EsriQuery, QueryTask, GraphicsLayer,
    FeatureLayer, SimpleRenderer, Graphic, Point, Polyline, Extent, InfoTemplate, symbolJsonUtils,
    esriLang, esriRequest, graphicsUtils, Preview) {/*jshint unused: false*/
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Chart',
      baseClass: 'jimu-widget-chart',
      isValidConfig:false,
      currentAttrs: null,
      tempResultLayer: null,

      //test:
      //http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer
      //http://map.floridadisaster.org/GIS/rest/services/Events/FL511_Feeds/MapServer/4
      //http://maps.usu.edu/ArcGIS/rest/services/MudLake/MudLakeMonitoringSites/MapServer/0
      //http://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer/1

      _resetCurrentAttrs: function(){
        this.currentAttrs = {
          chartTr: null,
          config: null,
          layerInfo: null
        };
      },

      postMixInProperties: function() {
        this.inherited(arguments);
        this.nls.horizontalAxis = this.nls.horizontalAxis || "Horizontal Axis";
        this.nls.verticalAxis = this.nls.verticalAxis || "Vertical Axis";
        this.nls.dataLabels = this.nls.dataLabels || "Data Labels";
        this.nls.color = this.nls.color || "Color";
        this.nls.colorful = this.nls.colorful || "Colorful";
        this.nls.monochromatic = this.nls.monochromatic || "Monochromatic";
      },

      postCreate: function(){
        this.inherited(arguments);
        jimuUtils.combineRadioCheckBoxWithLabel(this.cbxUseSpatial, this.labelUseSpatial);
        jimuUtils.combineRadioCheckBoxWithLabel(this.cbxUseMapExtent, this.labelUseMapExtent);
        jimuUtils.combineRadioCheckBoxWithLabel(this.cbxDrawGraphic, this.labelDrawGraphic);
        this._initDrawBox();
        this._initPreview();
        this._resetAndAddTempResultLayer();
        this._initSelf();
      },

      onOpen: function(){
        if(this.tempResultLayer){
          this.tempResultLayer.show();
        }
      },

      onClose: function(){
        if(this.tempResultLayer){
          this.tempResultLayer.hide();
        }
        this._hideInfoWindow();
        this._resetDrawBox();
        this.preview.onClose();
        this.inherited(arguments);
      },

      resize: function(){
        setTimeout(lang.hitch(this, function(){
          this._updatePreviewHeight();
          this.preview.resize();
        }), 100);
      },

      destroy: function(){
        this._hideInfoWindow();
        this._resetDrawBox();
        this._clickClearButton(true);
        this.inherited(arguments);
      },

      _isConfigValid:function(){
        return this.config && typeof this.config === 'object';
      },

      _initDrawBox: function(){
        this.drawBox = new DrawBox({
          types: ['point','polyline','polygon'],
          map: this.map,
          showClear: true,
          keepOneGraphic: true
        });
        this.drawBox.placeAt(this.drawBoxDiv);
        this.drawBox.startup();
      },

      _initPreview: function(){
        this.preview = new Preview({
          nls: this.nls,
          map: this.map,
          folderUrl: this.folderUrl
        });
        this.preview.placeAt(this.resultsContainer);
        this.preview.startup();
      },

      _initSelf: function(){
        var uniqueId = jimuUtils.getRandomString();
        var cbxName = "Chart_" + uniqueId;
        this.cbxUseMapExtent.name = cbxName;
        this.cbxDrawGraphic.name = cbxName;
        
        this.isValidConfig = this._isConfigValid();
        if(!this.isValidConfig){
          html.setStyle(this.chartsNode,'display','none');
          html.setStyle(this.invalidConfigNode,{
            display: 'block',
            left: 0
          });
          return;
        }

        var charts = this.config.charts;

        if(charts.length === 0){
          html.setStyle(this.chartsNode, 'display', 'none');
          html.setStyle(this.noChartTipSection, 'display', 'block');
          return;
        }

        array.forEach(charts, lang.hitch(this, function(singleConfig, index){
          var name = singleConfig.name;
          var strTr = '<tr class="single-chart">'+
          '<td class="first-td"></td>'+
          '<td class="second-td">'+
            '<div class="chart-name-div"></div>'+
          '</td>'+
          '<td class="third-td">'+
            '<div class="arrow"></div>'+
          '</td>'+
          '</tr>';
          var tr = html.toDom(strTr);
          var chartNameDiv = query(".chart-name-div", tr)[0];
          chartNameDiv.innerHTML = name;
          html.place(tr, this.chartsTbody);
          tr.singleConfig = singleConfig;
          if(index % 2 === 0){
            html.addClass(tr,'even');
          }
          else{
            html.addClass(tr,'odd');
          }
        }));
      },

      _resetAndAddTempResultLayer: function(){
        this._removeTempResultLayer();
        this.tempResultLayer = new GraphicsLayer();
        this.map.addLayer(this.tempResultLayer);
      },

      _removeTempResultLayer: function(){
        if(this.tempResultLayer){
          this.map.removeLayer(this.tempResultLayer);
        }
        this.tempResultLayer = null;
      },

      _clickClearButton: function(/*optional*/ dontSlide){
        this._hideInfoWindow();
        this._removeTempResultLayer();
        this._clearResultPage();
        //the default value of dontSlide is false.
        //if true, it means the widgte will destroy and it needn't slide.
        if(!dontSlide){
          this._fromCurrentPageToQueryList();
        }
      },

      _slide: function(dom, startLeft, endLeft){
        html.setStyle(dom, 'display', 'block');
        html.setStyle(dom, 'left', startLeft + "%");
        fx.animateProperty({
          node: dom,
          properties:{
            left:{
              start: startLeft,
              end: endLeft,
              units: '%'
            }
          },
          duration: 500,
          onEnd: lang.hitch(this, function(){
            html.setStyle(dom, 'left', endLeft);
            if(endLeft === 0){
              html.setStyle(dom, 'display', 'block');
            }
            else{
              html.setStyle(dom, 'display', 'none');
            }
          })
        }).play();
      },

      _onChartListClicked: function(event){
        var target = event.target || event.srcElement;
        var tr = jimuUtils.getAncestorDom(target, lang.hitch(this, function(dom){
          return html.hasClass(dom, 'single-chart');
        }), 10);
        if(!tr){
          return;
        }

        var singleConfig = tr.singleConfig;
        this._resetCurrentAttrs();
        this.currentAttrs.chartTr = tr;
        this.currentAttrs.config = lang.clone(singleConfig);
        this.currentAttrs.layerInfo = this.currentAttrs.chartTr.layerInfo;//may be null
        
        query('tr.single-chart', this.chartsTbody).removeClass('selected');
        html.addClass(this.currentAttrs.chartTr, 'selected');

        var callback = lang.hitch(this, function() {
          this.currentAttrs.layerInfo = this.currentAttrs.chartTr.layerInfo;
          this._fromChartListToChartParams();
        });

        if(this.currentAttrs.chartTr.layerInfo){
          callback();
        }
        else{
          var layerUrl = this.currentAttrs.config.url;
          this.shelter.show();
          esriRequest({
            url: layerUrl,
            content: {
              f: 'json'
            },
            handleAs: 'json',
            callbackParamName: 'callback'
          }).then(lang.hitch(this, function(response){
            if (!this.domNode) {
              return;
            }
            this.shelter.hide();
            this.currentAttrs.chartTr.layerInfo = response;
            this.currentAttrs.layerInfo = this.currentAttrs.chartTr.layerInfo;
            callback();
          }), lang.hitch(this, function(err){
            console.error(err);
            if (!this.domNode) {
              return;
            }
            this.shelter.hide();
            var errMsg = "";
            if(err && err.httpCode === 403){
              errMsg = this.nls.noPermissionsMsg;
            }
            this._showQueryErrorMsg(errMsg);
          }));
        }
      },

      _fromCurrentPageToQueryList: function(){
        html.setStyle(this.chartList, 'display', 'block');

        if(html.getStyle(this.chartParams, 'display') === 'block'){
          this._slide(this.chartList, -100, 0);
          this._slide(this.chartParams, 0, 100);
        }
        else if(html.getStyle(this.chartResults, 'display') === 'block'){
          this._slide(this.chartList, -100, 0);
          this._slide(this.chartResults, 0, 100);
        }
      },

      _onCbxUseSpatialClicked: function(){
        if(this.cbxUseSpatial.checked){
          html.setStyle(this.selectSpatialDiv, 'display', 'block');
        }
        else{
          html.setStyle(this.selectSpatialDiv, 'display', 'none');
        }

        if (this.cbxUseMapExtent.checked) {
          this._onCbxUseMapExtentClicked();
        } else {
          this._onCbxDrawGraphicClicked();
        }

        this._resetDrawBox();
      },

      _onCbxUseMapExtentClicked: function(){
        if(this.cbxUseMapExtent.checked){
          this._resetDrawBox();
          html.setStyle(this.drawBoxDiv, 'display', 'none');
        }
      },

      _onCbxDrawGraphicClicked: function(){
        if(this.cbxDrawGraphic.checked){
          html.setStyle(this.drawBoxDiv, 'display', 'block');
        }
      },

      _onBtnClearAllClicked: function(){
        this._clickClearButton();
      },

      _resetDrawBox: function(){
        this.drawBox.deactivate();
        this.drawBox.clear();
      },

      _resetChartParamsPage: function(){
        this.cbxUseSpatial.checked = false;
        this._onCbxUseSpatialClicked();
        this._resetDrawBox();
      },

      _fromChartListToChartParams: function(){
        //reset UI of params page
        this._resetChartParamsPage();
        var layerUrl = this.currentAttrs.config.url;

        //slide
        var showDom = this.chartParams;
        var hideDom = this.chartResults;

        html.setStyle(this.chartList, {
          left: 0,
          display: 'block'
        });

        html.setStyle(showDom, {
          left: '100%',
          display: 'block'
        });

        html.setStyle(hideDom, 'display', 'none');
        this._slide(this.chartList, 0, -100);
        this._slide(showDom, 100, 0);
      },

      _onBtnParamsBackClicked: function(){
        this._resetDrawBox();
        html.setStyle(this.chartList,'display','block');
        html.setStyle(this.chartParams,'display','block');
        html.setStyle(this.chartResults,'display','none');
        this._slide(this.chartList, -100, 0);
        this._slide(this.chartParams, 0, 100);
      },

      //start to query
      _onBtnApplyClicked: function(){
        //reset result page
        this._clearResultPage();
        var layerInfo = this.currentAttrs.layerInfo;

        var where = this.currentAttrs.config.filter.expr;
        var geometry = null;

        if(this.cbxUseSpatial.checked){
          if(this.cbxUseMapExtent.checked){
            geometry = this.map.extent;
          }
          else{
            var gs = this.drawBox.drawLayer.graphics;
            if(gs.length > 0){
              var g = gs[0];
              geometry = g.geometry;
            }
          }
          if(!geometry){
            new Message({message: this.nls.specifySpatialFilterMsg});
            return;
          }
        }

        if(this.tempResultLayer){
          this.map.removeLayer(this.tempResultLayer);
        }
        this.tempResultLayer = null;

        //set query.resultLayer
        this._createChartResultLayer();

        this._resetDrawBox();

        html.setStyle(this.chartList, 'display','none');
        html.setStyle(this.chartParams, 'display', 'block');
        html.setStyle(this.chartResults, 'display', 'block');
        this._slide(this.chartParams, 0, -100);
        this._slide(this.chartResults, 100, 0);

        var singleConfig = this.currentAttrs.config;
        var outFields = [];
        var mode = singleConfig.mode;
        if(mode === 'feature'){
          outFields = lang.clone(singleConfig.valueFields);
          if(outFields.indexOf(singleConfig.labelField) < 0){
            outFields.push(singleConfig.labelField);
          }
        }
        else if(mode === 'category'){
          outFields = lang.clone(singleConfig.valueFields);
          if(outFields.indexOf(singleConfig.categoryField) < 0){
            outFields.push(singleConfig.categoryField);
          }
        }
        else if(mode === 'count'){
          outFields = [singleConfig.categoryField];
        }
        else if(mode === 'field'){
          outFields = lang.clone(singleConfig.valueFields);
        }

        this.shelter.show();
        this._query(where, outFields, geometry).then(lang.hitch(this, function(featureSet){
          if(!this.domNode){
            return;
          }
          this.shelter.hide();
          if(featureSet && featureSet.features){
            var args = {
              config: singleConfig,
              featureSet: featureSet,
              layerDefinition: this.currentAttrs.layerInfo,
              resultLayer: this.tempResultLayer
            };

            //update preview height
            this._updatePreviewHeight();

            //preview will filter features
            this.preview.createCharts(args);

            //add the filtered features to layer
            array.forEach(featureSet.features, lang.hitch(this, function(feature){
              this.tempResultLayer.add(feature);
            }));
            
            this._zoomToLayer(this.tempResultLayer);
          }
        }), lang.hitch(this, function(err){
          console.error(err);
          if(!this.domNode){
            return;
          }
          this.shelter.hide();
          this._removeTempResultLayer();
        }));
      },

      _updatePreviewHeight: function() {
        var box = html.getContentBox(this.domNode);
        var h = Math.max(box.h - 60, 150);

        //update preview height
        html.setStyle(this.preview.domNode, 'height', h + 'px');
      },

      _createChartResultLayer: function(){
        //use graphics layer
        this._resetAndAddTempResultLayer();

        var symbol = symbolJsonUtils.fromJson(this.currentAttrs.config.symbol);
        var renderer = new SimpleRenderer(symbol);

        //set renderer
        this.tempResultLayer.setRenderer(renderer);
      },

      _query: function(where, outFields, /*optional*/ geometry){
        var queryParams = new EsriQuery();
        queryParams.where = where;
        if(geometry){
          queryParams.geometry = geometry;
        }
        queryParams.outSpatialReference = this.map.spatialReference;
        queryParams.returnGeometry = true;
        queryParams.outFields = outFields;
        var queryTask = new QueryTask(this.currentAttrs.config.url);
        return queryTask.execute(queryParams);
      },

      _clearResultPage: function(){
        this.preview.clear();
        this._hideInfoWindow();
      },

      _zoomToLayer: function(gl){
        try{
          var ext = graphicsUtils.graphicsExtent(gl.graphics);
          if(ext){
            ext = ext.expand(1.4);
            this.map.setExtent(ext);
          }
        }
        catch(e){
          console.error(e);
        }
      },

      _showQueryErrorMsg: function(/* optional */ msg){
        new Message({message: msg || this.nls.queryError});
      },

      _hideInfoWindow: function(){
      },

      _onBtnResultsBackClicked: function(){
        var showDom,hideDom;

        showDom = this.chartParams;
        hideDom = this.chartList;

        html.setStyle(hideDom,'display','none');
        html.setStyle(showDom,{
          display:'block',
          left:'-100%'
        });
        this._slide(showDom, -100, 0);
        this._slide(this.chartResults, 0, 100);
      }

    });
  });