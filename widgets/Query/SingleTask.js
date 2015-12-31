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
    'dojo/_base/array',
    'dojo/promise/all',
    'dojo/Deferred',
    'jimu/utils',
    'esri/request',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/tasks/RelationshipQuery'
  ],
  function(declare, lang, array, all, Deferred, jimuUtils, esriRequest, EsriQuery, QueryTask,
    RelationshipQuery) {

    function getCleanCurrentAttrsTemplate(){
      var template = {
        queryTr: null,
        config: null,
        layerInfo: null, //{relationships:[{id,name,relatedTableId,fields}]}
        askForValues: null,
        queryType: -1,
        query: {
          maxRecordCount: 1000,
          resultLayer: null, //GraphicsLayer or FeatureLayer
          where: '',
          geometry: null,
          nextIndex: 0,
          allCount: 0,
          objectIds: [] //optional
        }
      };
      return template;
    }

    var SingleTaskClass = declare(null, {
      tempResultLayer: null,

      //options:
      map: null,
      currentAttrs: null,

      //public methods:
      //resetCurrentAttrs
      //getCurrentAttrs
      //doQuery_SupportOrderByAndPagination: queryType 1
      //doQuery_SupportObjectIds: queryType 2
      //doQuery_NotSupportObjectIds: queryType 3
      //onResultsScroll_SupportOrderByAndPagination: queryType 1
      //executeQueryForFirstTime
      //executeQueryWhenScrollToBottom

      constructor: function(map, currentAttrs){
        this.map = map;
        this.currentAttrs = currentAttrs;
      },

      resetCurrentAttrs: function(){
        this.currentAttrs = getCleanCurrentAttrsTemplate();
      },

      getCurrentAttrs: function(){
        return this.currentAttrs;
      },

      //return a deferred which resolves:
      //features, resultLayer, relatedResults, relatedTableIds, allCount
      executeQueryForFirstTime: function(){
        var def = null;
        var where = this.currentAttrs.query.where;
        var geometry = this.currentAttrs.query.geometry;
        if(this.currentAttrs.queryType === 1){
          def = this.doQuery_SupportOrderByAndPagination(where, geometry);
        }else if(this.currentAttrs.queryType === 2){
          def = this.doQuery_SupportObjectIds(where, geometry);
        }else{
          def = this.doQuery_NotSupportObjectIds(where, geometry);
        }
        return def;
      },

      //return a deferred which resolves
      //features, resultLayer, relatedResults, relatedTableIds, allCount
      executeQueryWhenScrollToBottom: function(){
        var def = null;
        if(this.currentAttrs.queryType === 1){
          def = this.onResultsScroll_SupportOrderByAndPagination();
        }else if(this.currentAttrs.queryType === 2){
          def = this.onResultsScroll_SupportObjectIds();
        }
        return def;
      },

      _isServiceSupportsOrderBy: function(layerInfo){
        var isSupport = false;
        if(layerInfo.advancedQueryCapabilities){
          if(layerInfo.advancedQueryCapabilities.supportsOrderBy){
            isSupport = true;
          }
        }
        return isSupport;
      },

      _isServiceSupportsPagination: function(layerInfo){
        var isSupport = false;
        if(layerInfo.advancedQueryCapabilities){
          if(layerInfo.advancedQueryCapabilities.supportsPagination){
            isSupport = true;
          }
        }
        return isSupport;
      },

      _tryLocaleNumber: function(value){
        var result = jimuUtils.localizeNumber(value);
        if(result === null || result === undefined){
          result = value;
        }
        return result;
      },

      _tryLocaleDate: function(date){
        var result = jimuUtils.localizeDate(date);
        if(!result){
          result = date.toLocaleDateString();
        }
        return result;
      },

      // _resetAndAddTempResultLayer: function(){
      //   this._removeTempResultLayer();
      //   this.tempResultLayer = new GraphicsLayer();
      //   this.map.addLayer(this.tempResultLayer);
      // },

      _removeTempResultLayer: function(){
        if(this.tempResultLayer){
          this.map.removeLayer(this.tempResultLayer);
        }
        this.tempResultLayer = null;
      },

      _addOperationalLayer: function(resultLayer){
        this.map.addLayer(resultLayer);
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

      _isImageServiceLayer: function(url) {
        return (url.indexOf('/ImageServer') > -1);
      },

      _isTable: function(layerDefinition){
        return layerDefinition.type === "Table";
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

      _getQueryResultTemplate: function(){
        var template = {
          features: [],
          relatedResults: [],
          relatedTableIds: []
        };
        return template;
      },


      /*--------------------query support OrderBy and Pagination*/
      /*resolve: {
                features: [],
                relatedResults: [],
                relatedTableIds: []
              }*/
      doQuery_SupportOrderByAndPagination: function(where, geometry){
        var resultDef = new Deferred();
        // html.setStyle(this.resultsNumberDiv, 'display', 'block');

        //var resultLayer = this.currentAttrs.query.resultLayer;

        var onErrorHandler = lang.hitch(this, function(err) {
          console.error(err);
          resultDef.reject(err);
          // if (!this.domNode) {
          //   return;
          // }
          // this.shelter.hide();
          // if (resultLayer) {
          //   this.map.removeLayer(resultLayer);
          // }
          // resultLayer = null;
        });

        // this.shelter.show();
        var defCount = this._queryCount(where, geometry);
        defCount.then(lang.hitch(this, function(allCount){
          //this.numSpan.innerHTML = jimuUtils.localizeNumber(allCount);

          if(allCount === 0){
            this.currentAttrs.query.allCount = 0;
            resultDef.resolve(this._getQueryResultTemplate());
            return;
          }

          this.currentAttrs.query.allCount = allCount;

          // if(resultLayer instanceof FeatureLayer){
          //   this._addOperationalLayer(resultLayer);
          // }

          this.currentAttrs.query.nextIndex = 0;//reset nextIndex

          var resultOffset = 0;
          var recordCount = this.currentAttrs.query.maxRecordCount;
          var objectIdField = this.currentAttrs.config.objectIdField;

          var def = this._queryWithPaginationAndOrder(where, geometry, resultOffset, recordCount);
          def.then(lang.hitch(this, function(response){

            var features = response.features;
            var objectIds = array.map(features, lang.hitch(this, function(feature){
              var attributes = feature.attributes;
              var objectId = attributes[objectIdField];
              objectId = parseInt(objectId, 10);
              return objectId;
            }));

            //get relationships info
            var relatedDefInfos = this._queryRelatedFeaturesById(objectIds);
            var promises = array.map(relatedDefInfos, lang.hitch(this, function(relatedDefInfo){
              return relatedDefInfo.promise;
            }));
            var relatedTableIds = array.map(relatedDefInfos, function(relatedDefInfo){
              return relatedDefInfo.relationshipId;
            });
            all(promises).then(lang.hitch(this, function(relatedResults){
              // this.currentAttrs.query.maxRecordCount= features.length;
              this.currentAttrs.query.nextIndex += features.length;
              resultDef.resolve({
                features: features,
                relatedResults: relatedResults,
                relatedTableIds: relatedTableIds
              });
            }), onErrorHandler);
          }), onErrorHandler);
        }), onErrorHandler);

        return resultDef;
      },

      /*resolve: {
                features: [],
                relatedResults: [],
                relatedTableIds: []
              }*/
      onResultsScroll_SupportOrderByAndPagination: function(){
        var resultDef = new Deferred();
        var resultOffset = this.currentAttrs.query.nextIndex;
        var allCount = this.currentAttrs.query.allCount;
        if(resultOffset >= allCount){
          resultDef.resolve(this._getQueryResultTemplate());
          return resultDef;
        }

        var onErrorHandler = lang.hitch(this, function(err){
          console.error(err);
          resultDef.reject(err);
        });

        // var resultLayer = this.currentAttrs.query.resultLayer;

        var recordCount = this.currentAttrs.query.maxRecordCount;
        var where = this.currentAttrs.query.where;
        var geometry = this.currentAttrs.query.geometry;
        var objectIdField = this.currentAttrs.config.objectIdField;

        var def = this._queryWithPaginationAndOrder(where, geometry, resultOffset, recordCount);
        def.then(lang.hitch(this, function(response) {
          var features = response.features;
          var objectIds = array.map(features, lang.hitch(this, function(feature) {
            var attributes = feature.attributes;
            var objectId = attributes[objectIdField];
            objectId = parseInt(objectId, 10);
            return objectId;
          }));

          //get relationships info
          var relatedDefInfos = this._queryRelatedFeaturesById(objectIds);
          var promises = array.map(relatedDefInfos, lang.hitch(this, function(relatedDefInfo) {
            return relatedDefInfo.promise;
          }));
          var relatedTableIds = array.map(relatedDefInfos, function(relatedDefInfo) {
            return relatedDefInfo.relationshipId;
          });
          all(promises).then(lang.hitch(this, function(relatedResults) {
            this.currentAttrs.query.nextIndex += features.length;
            resultDef.resolve({
              features: features,
              relatedResults: relatedResults,
              relatedTableIds: relatedTableIds
            });
          }), onErrorHandler);
        }), onErrorHandler);

        return resultDef;
      },

      /*--------------------query support objectIds------------------------*/
      /*resolve: {
                features: [],
                relatedResults: [],
                relatedTableIds: []
              }*/
      doQuery_SupportObjectIds: function(where, geometry){
        var resultDef = new Deferred();
        //html.setStyle(this.resultsNumberDiv, 'display', 'block');
        //var resultLayer = this.currentAttrs.query.resultLayer;

        var onErrorHandler = lang.hitch(this, function(err) {
          console.error(err);
          resultDef.reject(err);
          // if (resultLayer) {
          //   this.map.removeLayer(resultLayer);
          // }
          // resultLayer = null;
        });

        var defIDs = this._queryIds(where, geometry);
        defIDs.then(lang.hitch(this, function(objectIds){
          var hasResults = objectIds && objectIds.length > 0;

          if(!hasResults){
            this.currentAttrs.query.allCount = 0;
            resultDef.resolve(this._getQueryResultTemplate());
            return;
          }

          this.currentAttrs.query.allCount = objectIds.length;

          // if(resultLayer instanceof FeatureLayer){
          //   this._addOperationalLayer(resultLayer);
          // }
          var allCount = objectIds.length;
          // this.numSpan.innerHTML = jimuUtils.localizeNumber(allCount);
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
          array.forEach(relatedDefs, function(relatedDef){
            promises.push(relatedDef.promise);
          });

          var relatedTableIds = array.map(relatedDefs, function(relatedDef){
            return relatedDef.relationshipId;
          });

          all(promises).then(lang.hitch(this, function(results){
            var features = results[0].features;
            this.currentAttrs.query.maxRecordCount = features.length;
            this.currentAttrs.query.nextIndex += features.length;

            var relatedResults = results.slice(1);
            resultDef.resolve({
              features: features,
              relatedResults: relatedResults,
              relatedTableIds: relatedTableIds
            });
          }), onErrorHandler);
        }), onErrorHandler);

        return resultDef;
      },

      /*resolve: {
                features: [],
                relatedResults: [],
                relatedTableIds: []
              }*/
      onResultsScroll_SupportObjectIds: function(){
        var resultDef = new Deferred();
        var allObjectIds = this.currentAttrs.query.objectIds;
        var nextIndex = this.currentAttrs.query.nextIndex;

        if(nextIndex >= allObjectIds.length){
          resultDef.resolve(this._getQueryResultTemplate());
          return;
        }

        //var resultLayer = this.currentAttrs.query.resultLayer;
        var maxRecordCount = this.currentAttrs.query.maxRecordCount;

        var countLeft = allObjectIds.length - nextIndex;
        var queryNum = Math.min(countLeft, maxRecordCount);
        var partialIds = allObjectIds.slice(nextIndex, nextIndex + queryNum);
        if(partialIds.length === 0){
          resultDef.resolve(this._getQueryResultTemplate());
          return;
        }

        //do query by objectIds
        var promises = [];
        var def = this._queryByObjectIds(partialIds, true);
        promises.push(def);
        var relatedDefs = this._queryRelatedFeaturesById(partialIds);
        array.forEach(relatedDefs, function(relatedDef){
          promises.push(relatedDef.promise);
        });

        var relatedTableIds = array.map(relatedDefs, function(relatedDef){
          return relatedDef.relationshipId;
        });

        all(promises).then(lang.hitch(this, function(results){
          var features = results[0].features;
          this.currentAttrs.query.nextIndex += features.length;
          var relatedResults = results.slice(1);
          resultDef.resolve({
            features: features,
            relatedResults: relatedResults,
            relatedTableIds: relatedTableIds
          });
        }), lang.hitch(this, function(err){
          console.error(err);
          resultDef.reject(err);
        }));

        return resultDef;
      },

      /*--------------------query doesn't support objectIds-------------------------*/
      /*resolve: {
                features: [],
                relatedResults: [],
                relatedTableIds: []
              }*/
      doQuery_NotSupportObjectIds: function(where, geometry){
        var resultDef = new Deferred();
        //html.setStyle(this.resultsNumberDiv, 'display', 'none');
        //var resultLayer = this.currentAttrs.query.resultLayer;

        this._query(where, geometry, true).then(lang.hitch(this, function(response){
          var features = response.features;
          this.currentAttrs.query.allCount = features.length;
          /*if(features.length > 0){
             if(resultLayer instanceof FeatureLayer){
               this._addOperationalLayer(resultLayer);
             }
            this._addResultItems(features, resultLayer);
          }*/
          resultDef.resolve({
            features: features,
            relatedResults: [],
            relatedTableIds: []
          });
        }), lang.hitch(this, function(err){
          console.error(err);
          // if(resultLayer){
          //   this.map.removeLayer(resultLayer);
          // }
          // resultLayer = null;
          resultDef.reject(err);
        }));

        return resultDef;
      },


      /*-------------------------common functions----------------------------------*/

      _getObjectIdField: function(){
        return this.currentAttrs.config.objectIdField;
      },

      _getOutputFields: function(){
        var fields = this.currentAttrs.config.popup.fields;
        var outFields = array.map(fields, lang.hitch(this, function(fieldInfo){
          return fieldInfo.name;
        }));
        //we need to add objectIdField into outFields because relationship query
        //needs objectId infomation
        var objectIdField = this.currentAttrs.config.objectIdField;
        if(array.indexOf(outFields, objectIdField) < 0){
          outFields.push(objectIdField);
        }
        //"Name:${CITY_NAME}, Population: ${POP}"
        var title = this.currentAttrs.config.popup.title;
        //["${CITY_NAME}", "${POP}"]
        var matches = title.match(/\$\{\w+\}/g);
        if(matches && matches.length > 0){
          array.forEach(matches, lang.hitch(this, function(match){
            //"${CITY_NAME}"
            var fieldName = match.replace('${', '').replace('}', '');
            if(outFields.indexOf(fieldName) < 0){
              outFields.push(fieldName);
            }
          }));
        }

        var allFieldInfos = this.currentAttrs.layerInfo.fields;
        var allFieldNames = array.map(allFieldInfos, lang.hitch(this, function(fieldInfo){
          return fieldInfo.name;
        }));
        //make sure every fieldName of outFields exists in fieldInfo
        outFields = array.filter(outFields, lang.hitch(this, function(fieldName){
          return allFieldNames.indexOf(fieldName) >= 0;
        }));

        return outFields;
      },

      _query: function(where, geometry, returnGeometry){
        var queryParams = new EsriQuery();
        queryParams.where = where;
        if(geometry){
          queryParams.geometry = geometry;
        }
        queryParams.outSpatialReference = this.map.spatialReference;
        queryParams.returnGeometry = !!returnGeometry;
        queryParams.outFields = this._getOutputFields();
        var queryTask = new QueryTask(this.currentAttrs.config.url);
        return queryTask.execute(queryParams);
      },

      _queryIds: function(where, geometry){
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
        var def = new Deferred();
        var queryParams = new EsriQuery();
        queryParams.returnGeometry = !!returnGeometry;
        queryParams.outSpatialReference = this.map.spatialReference;
        queryParams.outFields = this._getOutputFields();
        queryParams.objectIds = objectIds;
        var queryTask = new QueryTask(this.currentAttrs.config.url);
        queryTask.execute(queryParams).then(lang.hitch(this, function(response){
          def.resolve(response);
        }), lang.hitch(this, function(err){
          if(err.code === 400){
            //the query fails maybe becasuse the layer is a joined layer
            //joined layer:
            //http://csc-wade7d:6080/arcgis/rest/services/Cases/ParcelWithJoin/MapServer/0
            //joined layer doesn't support query by objectIds direcly, so if the layer is joined,
            //it will go into errorCallback of queryTask.
            //the alternative is using where to re-query.
            var objectIdField = this._getObjectIdField();
            var where = "";
            var count = objectIds.length;
            array.forEach(objectIds, lang.hitch(this, function(objectId, i){
              where += objectIdField + " = " + objectId;
              if(i !== count - 1){
                where += " OR ";
              }
            }));
            this._query(where, null, returnGeometry).then(lang.hitch(this, function(response){
              def.resolve(response);
            }), lang.hitch(this, function(err){
              def.reject(err);
            }));
          }else{
            def.reject(err);
          }
        }));
        return def;
      },

      _queryCount: function(where, geometry){
        var queryParams = new EsriQuery();
        queryParams.where = where;
        if(geometry){
          queryParams.geometry = geometry;
        }
        queryParams.returnGeometry = false;
        queryParams.outSpatialReference = this.map.spatialReference;
        var queryTask = new QueryTask(this.currentAttrs.config.url);
        return queryTask.executeForCount(queryParams);
      },

      _queryWithPaginationAndOrder: function(where, geometry, resultOffset, resultRecordCount){
        var queryParams = new EsriQuery();
        queryParams.where = where;
        if(geometry){
          queryParams.geometry = geometry;
        }
        queryParams.outSpatialReference = this.map.spatialReference;
        queryParams.returnGeometry = true;
        queryParams.outFields = this._getOutputFields();
        //set pagination info
        queryParams.start = resultOffset;
        queryParams.num = resultRecordCount;

        //set sorting info
        var orderByFields = this.currentAttrs.config.orderByFields;

        if(orderByFields && orderByFields.length > 0){
          queryParams.orderByFields = orderByFields;

          var orderFieldNames = array.map(orderByFields, lang.hitch(this, function(orderByField){
            var splits = orderByField.split(' ');
            return splits[0];
          }));

          //make sure orderFieldNames exist in outFields, otherwise the query will fail
          array.forEach(orderFieldNames, lang.hitch(this, function(orderFieldName){
            if(queryParams.outFields.indexOf(orderFieldName) < 0){
              queryParams.outFields.push(orderFieldName);
            }
          }));
        }

        var queryTask = new QueryTask(this.currentAttrs.config.url);
        return queryTask.execute(queryParams);
      },

      _getCurrentRelationships: function(){
        return this.currentAttrs.queryTr.layerInfo.relationships || [];
      },

      _queryRelatedFeaturesById: function(objectIds){
        var promises = [];
        var relationships = this._getCurrentRelationships();
        if(relationships && relationships.length > 0){
          var queryTask = new QueryTask(this.currentAttrs.config.url);

          array.forEach(relationships, lang.hitch(this, function(relationship){
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

      _findRelationshipFields: function(relationshipId){
        var fields = [];

        var relationship = this._findRelationshipInfo(relationshipId);

        if(relationship){
          fields = relationship.fields;
        }

        return fields;
      },

      _addResultItems: function(features, resultLayer, relatedResults, relatedTableIds){
        console.log(features, resultLayer, relatedResults, relatedTableIds);
      }

    });

    SingleTaskClass.getCleanCurrentAttrsTemplate = getCleanCurrentAttrsTemplate;

    return SingleTaskClass;
  });