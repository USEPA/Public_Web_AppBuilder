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
    'dojo/Deferred',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/TitlePane',
    'jimu/BaseWidget',
    'jimu/dijit/Message',
    'jimu/dijit/DrawBox',
    'jimu/utils',
    'jimu/filterUtils',
    './Parameters',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/tasks/RelationshipQuery',
    'esri/layers/GraphicsLayer',
    'esri/layers/FeatureLayer',
    'esri/renderers/SimpleRenderer',
    'esri/InfoTemplate',
    'esri/symbols/jsonUtils',
    'esri/lang',
    'esri/request',
    'esri/graphicsUtils',
    'jimu/dijit/LoadingShelter'
  ],
  function(declare, lang, query, html, array, fx, all, Deferred, _WidgetsInTemplateMixin,
    TitlePane, BaseWidget, Message, DrawBox, jimuUtils, FilterUtils, Parameters,
    EsriQuery, QueryTask, RelationshipQuery, GraphicsLayer, FeatureLayer, SimpleRenderer,
    InfoTemplate, symbolJsonUtils, esriLang, esriRequest, graphicsUtils) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Query',
      baseClass: 'jimu-widget-query',
      isValidConfig:false,
      currentAttrs:null,
      tempResultLayer: null,

      operationalLayers: null,

      //test:
      //http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer
      //http://map.floridadisaster.org/GIS/rest/services/Events/FL511_Feeds/MapServer/4
      //http://maps.usu.edu/ArcGIS/rest/services/MudLake/MudLakeMonitoringSites/MapServer/0

      _resetCurrentAttrs: function(){
        this.currentAttrs = {
          queryTr:null,
          config:null,
          layerInfo:null,//{relationships:[{id,name,relatedTableId,fields}]}
          askForValues: null,
          query:{
            maxRecordCount: 1000,
            resultLayer: null,//GraphicsLayer or FeatureLayer
            where:'',
            nextIndex: 0,
            objectIds:[]//optional
          }
        };
      },

      postMixInProperties: function(){
        this.inherited(arguments);
        this.operationalLayers = [];
        var strClearResults = this.nls.clearResults;
        var tip = esriLang.substitute({clearResults:strClearResults},this.nls.operationalTip);
        this.nls.operationalTip = tip;
        if(this.config){
          this._updateConfig();
        }
      },

      _updateConfig: function(){
        if(this.config && this.config.queries && this.config.queries.length > 0){
          array.forEach(this.config.queries, lang.hitch(this, function(singleConfig){
            this._rebuildFilter(singleConfig.url, singleConfig.filter);
          }));
        }
      },

      _rebuildFilter: function(url, filter){
        try{
          if(filter){
            delete filter.expr;
            var filterUtils = new FilterUtils();
            filterUtils.isHosted = jimuUtils.isHostedService(url);
            filterUtils.getExprByFilterObj(filter);
          }
        }catch(e){
          console.log(e);
        }
      },

      postCreate:function(){
        this.inherited(arguments);
        this._combineRadioCheckBoxWithLabel();
        this._initDrawBox();
        this._resetAndAddTempResultLayer();
        this._initSelf();
      },

      onOpen: function(){
        if(this.tempResultLayer){
          this.tempResultLayer.show();
        }
      },

      onClose:function(){
        if(this.tempResultLayer){
          this.tempResultLayer.hide();
        }
        this._hideInfoWindow();
        this._resetDrawBox();
        this.inherited(arguments);
      },

      destroy:function(){
        this._hideInfoWindow();
        this._resetDrawBox();
        this._removeAllResultLayers(true);
        this.inherited(arguments);
      },

      _combineRadioCheckBoxWithLabel: function(){
        jimuUtils.combineRadioCheckBoxWithLabel(this.cbxUseSpatial, this.useSpatialLabel);
        jimuUtils.combineRadioCheckBoxWithLabel(this.cbxUseMapExtent, this.currentExtentLabel);
        jimuUtils.combineRadioCheckBoxWithLabel(this.cbxDrawGraphic, this.drawGraphicLabel);
        jimuUtils.combineRadioCheckBoxWithLabel(this.cbxOperational, this.operationalLayerLabel);
      },

      _tryLocaleNumber: function(value){
        var result = jimuUtils.localizeNumber(value);
        if(result === null || result === undefined){
          result = value;
        }
        return result;
      },

      _tryLocaleDate: function(date){
        var result = jimuUtils.localizeDate(date,{selector:'date'});
        if(!result){
          result = date.toLocaleDateString();
        }
        return result;
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

      _removeAllResultLayers: function(/*optional*/ dontSlide){
        this._hideInfoWindow();
        this._removeTempResultLayer();
        this._removeAllOperatonalLayers();
        this._clearResultPage();
        //the default value of dontSlide is false.
        //if true, it means the widgte will destroy and it needn't slide.
        if(!dontSlide){
          this._fromCurrentPageToQueryList();
        }
      },

      _addOperationalLayer: function(resultLayer){
        this.operationalLayers.push(resultLayer);
        this.map.addLayer(resultLayer);
      },

      _fromCurrentPageToQueryList: function(){
        html.setStyle(this.queryList, 'display', 'block');

        if(html.getStyle(this.queryParams, 'display') === 'block'){
          this._slide(this.queryList, -100, 0);
          this._slide(this.queryParams, 0, 100);
        }
        else if(html.getStyle(this.queryResults, 'display') === 'block'){
          this._slide(this.queryList, -100, 0);
          this._slide(this.queryResults, 0, 100);
        }
      },

      _removeAllOperatonalLayers: function(){
        var layers = this.operationalLayers;
        while(layers.length > 0){
          var layer = layers[0];
          if(layer){
            this.map.removeLayer(layer);
          }
          layers[0]=null;
          layers.splice(0,1);
        }
        this.operationalLayers = [];
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

      _initSelf:function(){
        var uniqueId = jimuUtils.getRandomString();
        var cbxName = "Query_"+uniqueId;
        this.cbxUseMapExtent.name = cbxName;
        this.cbxDrawGraphic.name = cbxName;

        this.paramsDijit = new Parameters({
          nls: this.nls
        });
        this.paramsDijit.placeAt(this.parametersDiv);
        this.paramsDijit.startup();

        this.isValidConfig = this._isConfigValid();
        if(!this.isValidConfig){
          html.setStyle(this.queriesNode,'display','none');
          html.setStyle(this.invalidConfigNode,{
            display:'block',
            left:0
          });
          html.setStyle(this.btnClearAll, 'display', 'none');
          return;
        }

        var queries = this.config.queries;

        if(queries.length === 0){
          html.setStyle(this.queriesNode, 'display', 'none');
          html.setStyle(this.noQueryTipSection, 'display', 'block');
          html.setStyle(this.btnClearAll, 'display', 'none');
          return;
        }

        array.forEach(queries,lang.hitch(this,function(singleConfig,index){
          var name = singleConfig.name;
          var strTr = '<tr class="single-query">'+
          '<td class="first-td"></td>'+
          '<td class="second-td">'+
            '<div class="query-name-div"></div>'+
          '</td>'+
          '<td class="third-td">'+
            '<div class="arrow"></div>'+
          '</td>'+
          '</tr>';
          var tr = html.toDom(strTr);
          var queryNameDiv = query(".query-name-div", tr)[0];
          queryNameDiv.innerHTML = name;
          html.place(tr, this.queriesTbody);
          tr.singleConfig = singleConfig;
          if(index%2 === 0){
            html.addClass(tr,'even');
          }
          else{
            html.addClass(tr,'odd');
          }
        }));
      },

      _slide:function(dom, startLeft, endLeft){
        html.setStyle(dom, 'display', 'block');
        html.setStyle(dom, 'left', startLeft+"%");
        fx.animateProperty({
          node: dom,
          properties:{
            left:{
              start: startLeft,
              end: endLeft,
              units:'%'
            }
          },
          duration: 500,
          onEnd: lang.hitch(this,function(){
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

      _onQueryListClicked:function(event){
        var target = event.target||event.srcElement;
        var tr = jimuUtils.getAncestorDom(target,lang.hitch(this,function(dom){
          return html.hasClass(dom,'single-query');
        }),10);
        if(!tr){
          return;
        }

        var singleConfig = tr.singleConfig;
        this._resetCurrentAttrs();
        this.currentAttrs.queryTr = tr;
        this.currentAttrs.config = lang.clone(singleConfig);
        this.currentAttrs.layerInfo = this.currentAttrs.queryTr.layerInfo;//may be null

        var filterInfo = this.currentAttrs.config.filter;
        var parts = filterInfo.parts;
        this.currentAttrs.askForValues = array.some(parts, lang.hitch(this, function(item) {
          if (item.parts) {
            return array.some(item.parts, lang.hitch(this, function(part) {
              return part.interactiveObj;
            }));
          } else {
            return item.interactiveObj;
          }
        }));

        if(this.currentAttrs.askForValues){
          html.setStyle(this.parametersDiv, 'display', 'block');
        }
        else{
          html.setStyle(this.parametersDiv, 'display', 'none');
        }

        query('tr.single-query',this.queriesTbody).removeClass('selected');
        html.addClass(this.currentAttrs.queryTr,'selected');

        var callback = lang.hitch(this, function() {
          this.currentAttrs.layerInfo = this.currentAttrs.queryTr.layerInfo;
          this._fromQueryListToQueryParams();
        });

        if(this.currentAttrs.queryTr.layerInfo){
          callback();
        }
        else{
          var layerUrl = this.currentAttrs.config.url;
          this.shelter.show();
          this._getLayerInfoWithRelationships(layerUrl).then(lang.hitch(this, function(layerInfo){
            if (!this.domNode) {
              return;
            }
            this.shelter.hide();
            this.currentAttrs.queryTr.layerInfo = layerInfo;
            this.currentAttrs.layerInfo = this.currentAttrs.queryTr.layerInfo;
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
        this._removeAllResultLayers();
      },

      _resetDrawBox: function(){
        this.drawBox.deactivate();
        this.drawBox.clear();
      },

      _resetQueryParamsPage: function(){
        this.paramsDijit.clear();
        this.cbxOperational.checked = false;
        this.cbxUseSpatial.checked = false;
        this._onCbxUseSpatialClicked();
        this._resetDrawBox();
      },

      _getLayerIndexByLayerUrl: function(layerUrl){
        var lastIndex = layerUrl.lastIndexOf("/");
        var a = layerUrl.slice(lastIndex + 1, layerUrl.length);
        return parseInt(a, 10);
      },

      _getServiceUrlByLayerUrl: function(layerUrl){
        var lastIndex = layerUrl.lastIndexOf("/");
        var serviceUrl = layerUrl.slice(0, lastIndex);
        return serviceUrl;
      },

      _fromQueryListToQueryParams:function(){
        //reset UI of params page
        this._resetQueryParamsPage();
        var layerUrl = this.currentAttrs.config.url;
        // this.btnResultsBack.innerHTML = '&lt; ' + this.nls.parameters;
        var partsObj = lang.clone(this.currentAttrs.config.filter);
        this.paramsDijit.url = layerUrl;
        this.paramsDijit.build(partsObj, this.currentAttrs.layerInfo);

        //slide
        var showDom = this.queryParams;
        var hideDom = this.queryResults;

        html.setStyle(this.queryList, {
          left: 0,
          display: 'block'
        });

        html.setStyle(showDom, {
          left: '100%',
          display: 'block'
        });

        html.setStyle(hideDom, 'display', 'none');
        this._slide(this.queryList, 0, -100);
        this._slide(showDom, 100, 0);
      },

      _onBtnParamsBackClicked:function(){
        this._resetDrawBox();
        html.setStyle(this.queryList,'display','block');
        html.setStyle(this.queryParams,'display','block');
        html.setStyle(this.queryResults,'display','none');
        this._slide(this.queryList, -100, 0);
        this._slide(this.queryParams, 0, 100);
      },

      //start to query
      _onBtnApplyClicked:function(){
        //reset result page
        this._clearResultPage();
        html.setStyle(this.resultsNumberDiv, 'display', 'none');

        var layerInfo = this.currentAttrs.layerInfo;

        //query{maxRecordCount,resultLayer,where,nextIndex,objectIds}
        //set query.where
        if(this.currentAttrs.askForValues){
          var newExpr = this.paramsDijit.getNewFilterExpr();
          var validExpr = newExpr && typeof newExpr === 'string';
          if(!validExpr){
            return;
          }
          this.currentAttrs.query.where = newExpr;
        }
        else{
          this.currentAttrs.query.where = this.currentAttrs.config.filter.expr;
        }

        //set query.maxRecordCount
        this.currentAttrs.query.maxRecordCount = layerInfo.maxRecordCount || 1000;

        //set query.nextIndex
        this.currentAttrs.query.nextIndex = 0;

        //set query.objectIds
        this.currentAttrs.query.objectIds = [];

        var where = this.currentAttrs.query.where;
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
        this._createQueryResultLayer();

        this._resetDrawBox();

        html.setStyle(this.queryList, 'display','none');
        html.setStyle(this.queryParams, 'display', 'block');
        html.setStyle(this.queryResults, 'display', 'block');
        this._slide(this.queryParams, 0, -100);
        this._slide(this.queryResults, 100, 0);

        if(this._isSupportObjectIds(layerInfo)){
          this._doQuery_SupportObjectIds(where, geometry);
        }
        else{
          this._doQuery_NotSupportObjectIds(where, geometry);
        }
      },

      _isSupportObjectIds: function(layerInfo){
        //http://resources.arcgis.com/en/help/arcgis-rest-api/#/Layer_Table/02r3000000zr000000/
        //currentVersion is added from 10.0 SP1
        //typeIdField is added from 10.0
        var currentVersion = 0;
        if(layerInfo.currentVersion){
          currentVersion = parseFloat(layerInfo.currentVersion);
        }
        return currentVersion >= 10.0 || layerInfo.hasOwnProperty('typeIdField');
      },

      _createQueryResultLayer: function(){
        var resultLayer = null;

        var symbol = symbolJsonUtils.fromJson(this.currentAttrs.config.resultsSymbol);
        var renderer = new SimpleRenderer(symbol);

        if (this.cbxOperational.checked) {
          //new a feature layer
          var layerInfo = lang.clone(this.currentAttrs.layerInfo);
          var queryName = this._getBestQueryName(this.currentAttrs.config.name||'');

          //override layerInfo
          layerInfo.name = queryName;
          layerInfo.drawingInfo.renderer = renderer.toJson();
          layerInfo.drawingInfo.transparency = 0;
          layerInfo.minScale = 0;
          layerInfo.maxScale = 0;
          layerInfo.effectiveMinScale = 0;
          layerInfo.effectiveMaxScale = 0;
          layerInfo.defaultVisibility = true;

          var featureCollection = {
            layerDefinition: layerInfo,
            featureSet: null
          };
          resultLayer = new FeatureLayer(featureCollection);
        } else {
          //use graphics layer
          this._resetAndAddTempResultLayer();
          resultLayer = this.tempResultLayer;
        }

        this.currentAttrs.query.resultLayer = resultLayer;
        this.queryResults.resultLayer = resultLayer;

        //set renderer
        resultLayer.setRenderer(renderer);

        return resultLayer;
      },

      _getBestQueryName: function(queryName){
        if(queryName){
          queryName += " _" + this.nls.queryResult;
        }
        else{
          queryName += this.nls.queryResult;
        }
        var finalName = queryName;
        var allNames = array.map(this.map.graphicsLayerIds, lang.hitch(this, function(glId){
          var layer = this.map.getLayer(glId);
          return layer.name;
        }));
        var flag = 2;
        while(array.indexOf(allNames, finalName) >= 0){
          finalName = queryName + '_' + flag;
          flag++;
        }
        return finalName;
      },

      /*--------------------query support objectIds------------------------*/
      _doQuery_SupportObjectIds: function(where, geometry){
        html.setStyle(this.resultsNumberDiv, 'display', 'block');
        var resultLayer = this.currentAttrs.query.resultLayer;

        this.shelter.show();
        var defIDs = this._queryIds(where, geometry);
        defIDs.then(lang.hitch(this, function(objectIds){
          if(!this.domNode){
            return;
          }

          var hasResults = objectIds && objectIds.length > 0;

          if(hasResults){
            if(resultLayer instanceof FeatureLayer){
              this._addOperationalLayer(resultLayer);
            }
          }else{
            this.shelter.hide();
            return;
          }

          var allCount = objectIds.length;
          this.numSpan.innerHTML = jimuUtils.localizeNumber(allCount);
          this.currentAttrs.query.objectIds = objectIds;
          this.currentAttrs.query.nextIndex = 0;//reset nextIndex
          var maxRecordCount = this.currentAttrs.query.maxRecordCount;

          var partialIds = [];
          if (allCount > maxRecordCount) {
            partialIds = objectIds.slice(0, maxRecordCount);
          } else {
            partialIds = objectIds;
          }

          //do query by objectIds
          var promises = [];
          var def = this._queryByObjectIds(partialIds, true);
          promises.push(def);
          var relatedDefs = this._queryRelatedFeaturesById(partialIds);
          array.forEach(relatedDefs,function(relatedDef){
            promises.push(relatedDef.promise);
          });

          var relatedTableIds = array.map(relatedDefs,function(relatedDef){
            return relatedDef.relationshipId;
          });

          all(promises).then(lang.hitch(this,function(results){
            if (!this.domNode) {
              return;
            }
            // this.currentAttrs.query.nextIndex += partialIds.length;
            this.shelter.hide();
            var features = results[0].features;
            this.currentAttrs.query.maxRecordCount= features.length;
            this.currentAttrs.query.nextIndex += features.length;

            this._addResultItems(features, resultLayer, results.slice(1), relatedTableIds);
            this._zoomToLayer(resultLayer);
          }), lang.hitch(this, function(err){
            console.error(err);
            if (!this.domNode) {
              return;
            }
            this.shelter.hide();
            if(resultLayer){
              this.map.removeLayer(resultLayer);
            }
            resultLayer = null;
            this._showQueryErrorMsg();
          }));
        }), lang.hitch(this, function(err){
          console.error(err);
          if(!this.domNode){
            return;
          }
          this.shelter.hide();
          if(resultLayer){
            this.map.removeLayer(resultLayer);
          }
          resultLayer = null;
          this._showQueryErrorMsg();
        }));
      },

      _onResultsScroll:function(){
        if(!jimuUtils.isScrollToBottom(this.resultsContainer)){
          return;
        }

        var layerInfo = this.currentAttrs.layerInfo;

        if(!this._isSupportObjectIds(layerInfo)){
          return;
        }

        var resultLayer = this.currentAttrs.query.resultLayer;
        var maxRecordCount = this.currentAttrs.query.maxRecordCount;
        var allObjectIds = this.currentAttrs.query.objectIds;
        var nextIndex = this.currentAttrs.query.nextIndex;
        if(nextIndex >= allObjectIds.length){
          return;
        }

        var countLeft = allObjectIds.length - nextIndex;
        var queryNum = Math.min(countLeft, maxRecordCount);
        var partialIds = allObjectIds.slice(nextIndex, nextIndex + queryNum);
        if(partialIds.length === 0){
          return;
        }

        this.shelter.show();
        //do query by objectIds
        var promises = [];
        var def = this._queryByObjectIds(partialIds, true);
        promises.push(def);
        var relatedDefs = this._queryRelatedFeaturesById(partialIds);
        array.forEach(relatedDefs,function(relatedDef){
          promises.push(relatedDef.promise);
        });

        var relatedTableIds = array.map(relatedDefs,function(relatedDef){
          return relatedDef.relationshipId;
        });

        all(promises).then(lang.hitch(this,function(results){
          if (!this.domNode) {
            return;
          }

          this.shelter.hide();
          var features = results[0].features;
          this.currentAttrs.query.nextIndex += features.length;
          this._addResultItems(features, resultLayer, results.slice(1), relatedTableIds);
        }), lang.hitch(this, function(err){
          console.error(err);
          if (!this.domNode) {
            return;
          }
          this._showQueryErrorMsg();
          this.shelter.hide();
        }));
      },

      /*--------------------query doesn't support objectIds-------------------------*/
      _doQuery_NotSupportObjectIds: function(where, geometry){
        html.setStyle(this.resultsNumberDiv, 'display', 'none');
        var resultLayer = this.currentAttrs.query.resultLayer;

        this.shelter.show();
        this._query(where, geometry).then(lang.hitch(this, function(response){
          if(!this.domNode){
            return;
          }
          this.shelter.hide();
          var features = response.features;
          if(features.length > 0){
            if(resultLayer instanceof FeatureLayer){
              this._addOperationalLayer(resultLayer);
            }
            this._addResultItems(features, resultLayer);
            this._zoomToLayer(resultLayer);
          }
        }), lang.hitch(this, function(err){
          console.error(err);
          if(!this.domNode){
            return;
          }
          this.shelter.hide();
          if(resultLayer){
            this.map.removeLayer(resultLayer);
          }
          resultLayer = null;
          this._showQueryErrorMsg();
        }));
      },


      /*-------------------------common functions----------------------------------*/
      _clearResultPage: function(){
        this._hideInfoWindow();
        this._unSelectResultTr();
        html.empty(this.resultsTbody);
        this.numSpan.innerHTML = '0';
      },

      _unSelectResultTr: function(){
        if(this.queryResults.resultTr){
          html.removeClass(this.queryResults.resultTr,'selected');
        }
        this.queryResults.resultTr = null;
      },

      _selectResultTr: function(tr){
        this._unSelectResultTr();
        this.queryResults.resultTr = tr;
        if(this.queryResults.resultTr){
          html.addClass(this.queryResults.resultTr, 'selected');
        }
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

      _getOutputFields: function(){
        var objectIdField = this.currentAttrs.config.objectIdField;
        var fields = this.currentAttrs.config.popup.fields;
        var outFields = array.map(fields, lang.hitch(this,function(fieldInfo){
          return fieldInfo.name;
        }));
        if(array.indexOf(outFields, objectIdField) < 0){
          outFields.push(objectIdField);
        }
        return outFields;
      },

      _queryIds: function(where, /*optional*/ geometry){
        var queryParams = new EsriQuery();
        queryParams.where = where;
        if(geometry){
          queryParams.geometry = geometry;
        }
        queryParams.returnGeometry = false;
        queryParams.outSpatialReference = this.map.spatialReference;
        var queryTask = new QueryTask(this.currentAttrs.config.url);
        return queryTask.executeForIds(queryParams);
      },

      _queryByObjectIds: function(objectIds, returnGeometry){
        var queryParams = new EsriQuery();
        queryParams.returnGeometry = !!returnGeometry;
        queryParams.outSpatialReference = this.map.spatialReference;
        queryParams.outFields = this._getOutputFields();
        queryParams.objectIds = objectIds;
        var queryTask = new QueryTask(this.currentAttrs.config.url);
        return queryTask.execute(queryParams);
      },

      _getCurrentRelationships: function(){
        return this.currentAttrs.queryTr.layerInfo.relationships||[];
      },

      _queryRelatedFeaturesById: function(objectIds){
        var promises = [];
        var relationships = this._getCurrentRelationships();
        if(relationships && relationships.length > 0){
          var queryTask = new QueryTask(this.currentAttrs.config.url);

          array.forEach(relationships,lang.hitch(this,function(relationship){
            var relationParam = new RelationshipQuery();
            relationParam.objectIds = objectIds;
            relationParam.relationshipId = relationship.id;

            var outFields = array.map(relationship.fields, function(fieldInfo){
              return fieldInfo.name;
            });

            relationParam.outFields = outFields;
            relationParam.returnGeometry = false;

            var defered = queryTask.executeRelationshipQuery(relationParam);
            promises.push({
              relationshipId: relationship.id,
              promise: defered
            });
          }));
        }
        return promises;
      },

      _findRelationshipInfo: function(relationshipId){
        var relationships = this._getCurrentRelationships();
        for(var i = 0; i < relationships.length; i++){
          if(relationships[i].id === relationshipId){
            return relationships[i];
          }
        }
        return null;
      },

      _findRelationshipName: function(relationshipId){
        var relationshipName = '';
        var relationship = this._findRelationshipInfo(relationshipId);

        if(relationship){
          relationshipName = relationship.name;
        }

        return relationshipName;
      },

      _findRelationshipFields: function(relationshipId){
        var fields = [];

        var relationship = this._findRelationshipInfo(relationshipId);

        if(relationship){
          fields = relationship.fields;
        }

        return fields;
      },

      _query: function(where, /*optional*/ geometry){
        var queryParams = new EsriQuery();
        queryParams.where = where;
        if(geometry){
          queryParams.geometry = geometry;
        }
        queryParams.outSpatialReference = this.map.spatialReference;
        queryParams.returnGeometry = true;
        queryParams.outFields = this._getOutputFields();
        var queryTask = new QueryTask(this.currentAttrs.config.url);
        return queryTask.execute(queryParams);
      },

      _addResultItems: function(features, resultLayer, relatedResults, relatedTableIds){
        //var featuresCount = features.length;

        var sym = symbolJsonUtils.fromJson(this.currentAttrs.config.resultsSymbol);
        var popup = this.currentAttrs.config.popup;
        /*var fieldNames = array.map(popup.fields,lang.hitch(this,function(fieldInfo){
          return fieldInfo.name;
        }));*/

        var fieldInfosInAttrContent = array.filter(popup.fields,lang.hitch(this,function(fieldInfo){
          return fieldInfo.showInInfoWindow;
        }));

        array.forEach(features, lang.hitch(this, function(feature, i){
          var trClass = '';
          if(i%2 === 0){
            trClass = 'even';
          }
          else{
            trClass = 'odd';
          }

          //process attributes
          var attributes = feature.attributes;
          array.forEach(popup.fields, lang.hitch(this, function(fieldInfo){
            var fieldName = fieldInfo.name;
            if(attributes.hasOwnProperty(fieldName)){
              var fieldValue = attributes[fieldName];
              if(fieldInfo.type === 'esriFieldTypeDate'){
                if(fieldValue){
                  var date = new Date(parseInt(fieldValue, 10));
                  fieldValue = this._tryLocaleDate(date);
                  attributes[fieldName] = fieldValue;
                }
              }
              if(fieldValue === null){
                attributes[fieldName] = this.nls.noValue;
              }
            }
          }));

          //relationship attributes
          var relatedFeatures = [];
          if(relatedResults && relatedResults.length > 0){
            var objectIdField = this.currentAttrs.config.objectIdField;
            var objectId = feature.attributes[objectIdField];

            array.forEach(relatedResults,lang.hitch(this,function(relatedResult,idx){
              if(relatedResult[objectId]){
                var relatedName = this._findRelationshipName(relatedTableIds[idx]);
                var features = relatedResult[objectId].features;

                relatedFeatures.push({
                  tableId: relatedTableIds[idx],
                  name: relatedName,
                  features: features
                });
              }
            }));
          }

          if(feature.geometry){
            feature.setSymbol(sym);
            resultLayer.add(feature);
          }

          var options = {
            feature: feature,
            titleTemplate: popup.title,
            fieldInfosInAttrContent: fieldInfosInAttrContent,
            trClass: trClass,
            relatedFeatures: relatedFeatures
          };

          this._createQueryResultItem(options);
        }));
      },

      _createQueryResultItem:function(options){
        var feature = options.feature;
        var titleTemplate = options.titleTemplate;
        var fieldInfosInAttrContent = options.fieldInfosInAttrContent;
        var trClass = options.trClass;
        var relatedFeatures = options.relatedFeatures;

        var attributes = feature && feature.attributes;
        if(!attributes){
          return;
        }

        var strItem = '<tr class="query-result-item" cellpadding="0" cellspacing="0">' +
        '<td><span class="result-item-title"></span>'+
        '<table class="feature-attributes" valign="top">'+
        '<tbody></tbody></table></td></tr>';
        var trItem = html.toDom(strItem);
        html.addClass(trItem, trClass);
        html.place(trItem, this.resultsTbody);
        trItem.feature = feature;
        var spanTitle = query("span.result-item-title",trItem)[0];
        var tbody = query("tbody",trItem)[0];
        var title = esriLang.substitute(attributes, titleTemplate);
        if(!title){
          title = this.nls.noValue;
        }
        spanTitle.innerHTML = title;
        var infoTemplateContent = '';
        var rowsStr = "";

        array.forEach(fieldInfosInAttrContent, lang.hitch(this, function(fieldInfo){
          var fieldName = fieldInfo.name;
          var fieldAlias = fieldInfo.alias || fieldName;
          var fieldValue = attributes[fieldName];

          if(typeof fieldValue === 'number'){
            if(fieldInfo.domain && fieldInfo.domain.type === 'codedValue'){
              array.some(fieldInfo.domain.codedValues, function(codedValue){
                if(codedValue.code === fieldValue){
                  fieldValue = codedValue.name;
                  return true;
                }
              });
            }else{
              fieldValue = this._tryLocaleNumber(fieldValue);
            }
          }

          var fieldValueInWidget = fieldValue;
          var fieldValueInPopup = fieldValue;
          var specialType = fieldInfo.specialType;
          if(specialType === 'image'){
            if(fieldValue && typeof fieldValue === 'string'){
              fieldValueInWidget = '<a href="'+fieldValue+'" target="_blank">'+fieldValue+'</a>';
              fieldValueInPopup = '<img src="'+fieldValue+'" />';
            }
          }
          else if(specialType === 'link'){
            if(fieldValue && typeof fieldValue === 'string'){
              fieldValueInWidget = '<a href="'+fieldValue+'" target="_blank">'+fieldValue+'</a>';
              fieldValueInPopup = fieldValueInWidget;
            }
          }

          var strFieldTr = '<tr><td class="attr-name">' + fieldAlias +
          ':</td><td class="attr-value">' + fieldValueInWidget + '</td></tr>';
          var fieldTr = html.toDom(strFieldTr);
          html.place(fieldTr, tbody);
          /*var rowStr = fieldAlias+": "+fieldValueInPopup;
          if(i !== fieldInfosInAttrContent.length-1){
            rowStr+='<br/>';
          }*/
          var rowStr = '<tr valign="top">' +
            '<td class="attr-name">' + fieldAlias + '</td>' +
            '<td class="attr-value">' + fieldValueInPopup + '</td>' +
          '</tr>';
          rowsStr += rowStr;
        }));

        //related features
        array.forEach(relatedFeatures,lang.hitch(this,function(relatedFeature){
          var trNode = html.create('tr');
          var tdNode = html.create('td',{colspan: 2},trNode);
          var relationContainter = html.create('div');
          var titlePane = new TitlePane({
            title: this.nls.attributesFromRelationship + ': ' + relatedFeature.name,
            content: relationContainter,
            open: false,
            'class': 'relationship-attr'
          });
          titlePane.placeAt(tdNode);
          html.place(trNode, tbody);
          /*var rowStr = '<br/>' + this.nls.attributesFromRelationship + ": " +
              relatedFeature.name + '<br/>';*/
          var rowStr = '<tr valign="top">' +
            '<td class="attr-name" colspan="2">' + this.nls.attributesFromRelationship + ": " +
              relatedFeature.name +'<td>' +
          '</tr>';
          rowsStr += rowStr;

          var relatedFields = this._findRelationshipFields(relatedFeature.tableId);

          array.forEach(relatedFeature.features, lang.hitch(this, function(feature,i){
            var strFieldTr = '<span>' + (i+1) + '</span><br/>';
            var fieldTr = html.toDom(strFieldTr);
            html.place(fieldTr, relationContainter);
            //var rowStr = (i+1) + '<br/>';
            var rowStr = '<tr valign="top"><td class="attr-name" colspan="2">'+(i+1)+'</td><tr>';
            rowsStr += rowStr;

            if(relatedFields){
              array.forEach(relatedFields, lang.hitch(this,function(relatedFieldInfo){
                var fieldValue = feature.attributes[relatedFieldInfo.name];

                if(relatedFieldInfo.type === 'esriFieldTypeDate'){
                  if(fieldValue){
                    var date = new Date(parseInt(fieldValue, 10));
                    fieldValue = this._tryLocaleDate(date);
                  }
                }else if(typeof fieldValue === 'number'){
                  if(relatedFieldInfo.domain && relatedFieldInfo.domain.type === 'codedValue'){
                    array.some(relatedFieldInfo.domain.codedValues, function(codedValue){
                      if(codedValue.code === fieldValue){
                        fieldValue = codedValue.name;
                        return true;
                      }
                    });
                  }else{
                    fieldValue = this._tryLocaleNumber(fieldValue);
                  }
                }

                var strFieldTr = '<span>' + (relatedFieldInfo.alias || relatedFieldInfo.name) +
                ' : ' + fieldValue + '</span><br/>';
                var fieldTr = html.toDom(strFieldTr);
                html.place(fieldTr, relationContainter);
                //var rowStr = (relatedFieldInfo.alias || relatedFieldInfo.name) + " : " +
                //    fieldValue + '<br/>';
                var relatedAlias = relatedFieldInfo.alias || relatedFieldInfo.name;
                var rowStr = '<tr valign="top">'+
                    '<td class="attr-name">' + relatedAlias + '</td>'+
                    '<td class="attr-value">' + fieldValue + '</td>'+
                  '</tr>';
                rowsStr += rowStr;
              }));
            }
          }));
        }));

        infoTemplateContent = '<div class="header">' + title + '</div>';

        if(rowsStr){
          infoTemplateContent += '<div class="hzLine"></div>';
          infoTemplateContent +='<table class="query-popup-table" cellpadding="0" cellspacing="0">'+
          '<tbody>' + rowsStr + '</tbody></table>';
        }

        infoTemplateContent = '<div class="query-popup">' + infoTemplateContent + '</div>';
        
        trItem.infoTemplateContent = infoTemplateContent;
        var infoTemplate = new InfoTemplate();
        //if title is empty, popup header will disappear
        infoTemplate.setTitle('<div class="query-popup-title"></div>');
        infoTemplate.setContent(infoTemplateContent);
        feature.setInfoTemplate(infoTemplate);
      },

      _showQueryErrorMsg: function(/* optional */ msg){
        new Message({message: msg || this.nls.queryError});
      },

      _onResultsTableClicked: function(event){
        var target = event.target||event.srcElement;
        if(!html.isDescendant(target,this.resultsTable)){
          return;
        }
        var tr = jimuUtils.getAncestorDom(target, lang.hitch(this,function(dom){
          return html.hasClass(dom,'query-result-item');
        }),10);
        if(!tr){
          return;
        }

        this._selectResultTr(tr);

        //var spanTitle = query("span.result-item-title",tr)[0];
        //var featureAttrTable = query(".feature-attributes",tr)[0];
        //var attrTable = lang.clone(featureAttrTable);

        html.addClass(tr,'selected');
        var feature = tr.feature;
        var geometry = feature.geometry;
        if(geometry){
          var infoContent = tr.infoTemplateContent;
          var geoType = geometry.type;
          var centerPoint,extent;
          var def = null;

          if(geoType === 'point' || geoType === 'multipoint'){
            var singlePointFlow = lang.hitch(this, function(){
              def = new Deferred();
              var maxLevel = this.map.getNumLevels();
              var currentLevel = this.map.getLevel();
              var level2 = Math.floor(maxLevel * 2 / 3);
              var zoomLevel = Math.max(currentLevel, level2);
              this.map.setLevel(zoomLevel).then(lang.hitch(this, function(){
                this.map.centerAt(centerPoint).then(lang.hitch(this, function(){
                  def.resolve();
                }));
              }));
            });

            if(geoType === 'point'){
              centerPoint = geometry;
              singlePointFlow();
            }
            else if(geoType === 'multipoint'){
              if(geometry.points.length === 1){
                centerPoint = geometry.getPoint(0);
                singlePointFlow();
              }
              else if(geometry.points.length > 1){
                extent = geometry.getExtent();
                if(extent){
                  extent = extent.expand(1.4);
                  centerPoint = geometry.getPoint(0);
                  def = this.map.setExtent(extent);
                }
              }
            }
          }
          else if(geoType === 'polyline'){
            extent = geometry.getExtent();
            extent = extent.expand(1.4);
            centerPoint = extent.getCenter();
            def = this.map.setExtent(extent);
          }
          else if(geoType === 'polygon'){
            extent = geometry.getExtent();
            extent = extent.expand(1.4);
            centerPoint = extent.getCenter();
            def = this.map.setExtent(extent);
          }
          else if(geoType === 'extent'){
            extent = geometry;
            extent = extent.expand(1.4);
            centerPoint = extent.getCenter();
            def = this.map.setExtent(extent);
          }

          if(def){
            def.then(lang.hitch(this, function(){
              if(typeof this.map.infoWindow.setFeatures === 'function'){
                this.map.infoWindow.setFeatures([feature]);
              }
              //if title is empty, popup header will disappear
              this.map.infoWindow.setTitle('<div class="query-popup-title"></div>');
              this.map.infoWindow.setContent(infoContent);
              if(typeof this.map.infoWindow.reposition === 'function'){
                this.map.infoWindow.reposition();
              }
              this.map.infoWindow.show(centerPoint);
            }));
          }
        }
      },

      _hideInfoWindow:function(){
        if(this.map && this.map.infoWindow){
          this.map.infoWindow.hide();
          if(typeof this.map.infoWindow.setFeatures === 'function'){
            this.map.infoWindow.setFeatures([]);
          }
          this.map.infoWindow.setTitle('');
          this.map.infoWindow.setContent('');
        }
      },

      _onBtnResultsBackClicked: function(){
        var showDom,hideDom;

        showDom = this.queryParams;
        hideDom = this.queryList;

        html.setStyle(hideDom,'display','none');
        html.setStyle(showDom,{
          display:'block',
          left:'-100%'
        });
        this._slide(showDom, -100, 0);
        this._slide(this.queryResults, 0, 100);
      }

    });
  });