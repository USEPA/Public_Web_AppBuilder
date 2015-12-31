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
  'dojo/on',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'jimu/dijit/_QueryableLayerSourcePopup',
  'jimu/utils',
  'jimu/filterUtils',
  './SingleQuerySetting',
  'jimu/dijit/SimpleTable',
  'jimu/dijit/TabContainer'
],
function(declare, lang, array, on, _WidgetsInTemplateMixin, BaseWidgetSetting,
  _QueryableLayerSourcePopup, jimuUtils,  FilterUtils, SingleQuerySetting) {

  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-query-setting',
    currentSQS: null,

    postMixInProperties: function(){
      this.inherited(arguments);
      if(this.config){
        this._updateConfig();
      }
    },

    _updateConfig: function() {
      if (this.config && this.config.queries && this.config.queries.length > 0) {
        array.forEach(this.config.queries, lang.hitch(this, function(singleConfig) {
          this._rebuildFilter(singleConfig.url, singleConfig.filter);
        }));
      }
    },

    _rebuildFilter: function(url, filter) {
      try {
        if (filter) {
          delete filter.expr;
          var filterUtils = new FilterUtils();
          filterUtils.isHosted = jimuUtils.isHostedService(url);
          filterUtils.getExprByFilterObj(filter);
        }
      } catch (e) {
        console.log(e);
      }
    },

    postCreate:function(){
      this.inherited(arguments);

      if(this.config){
        this.setConfig(this.config);
      }
    },

    setConfig:function(config){
      if(this.currentSQS){
        this.currentSQS.destroy();
      }
      this.currentSQS = null;
      this.queryList.clear();

      this.config = config;
      var queries = this.config && this.config.queries;
      var validConfig = queries && queries.length >= 0;
      if(validConfig){
        array.forEach(queries, lang.hitch(this, function(singleConfig, index){
          var addResult = this.queryList.addRow({name: singleConfig.name || ''});
          var tr = addResult.tr;
          tr.singleConfig = lang.clone(singleConfig);
          if(index === 0){
            this.queryList.selectRow(tr);
          }
        }));
      }
    },

    getConfig: function () {
      if(this.currentSQS){
        var currentSingleConfig = this.currentSQS.getConfig();
        if(currentSingleConfig){
          this.currentSQS.tr.singleConfig = lang.clone(currentSingleConfig);
        }
        else{
          return false;
        }
      }
      var config = {
        queries:[]
      };
      var trs = this.queryList.getRows();
      for(var i = 0; i < trs.length; i++){
        var tr = trs[i];
        config.queries.push(lang.clone(tr.singleConfig));
      }
      this.config = lang.clone(config);
      return config;
    },

    _createSingleQuerySetting:function(tr){
      var args = {
        map: this.map,
        nls: this.nls,
        config: tr.singleConfig,
        tr: tr,
        _layerDefinition: tr._layerDefinition,
        appConfig: this.appConfig
      };
      this.currentSQS = new SingleQuerySetting(args);
      this.currentSQS.placeAt(this.singleQueryContainer);

      this.own(on(this.currentSQS, 'name-change', lang.hitch(this, function(queryName){
        this.queryList.editRow(tr, {name: queryName});
      })));

      this.own(on(this.currentSQS, 'show-shelter', lang.hitch(this, function(){
        this.shelter.show();
      })));

      this.own(on(this.currentSQS, 'hide-shelter', lang.hitch(this, function(){
        this.shelter.hide();
      })));

      //first bind event, then setConfig, don't startup here
      this.currentSQS.setConfig(this.currentSQS.config);

      return this.currentSQS;
    },

    _onAddNewClicked:function(){
      if(this.currentSQS){
        var singleConfig = this.currentSQS.getConfig();
        if(singleConfig){
          this.currentSQS.tr.singleConfig = singleConfig;
        }
        else{
          return;
        }
      }

      var args = {
        titleLabel: this.nls.setDataSource,

        dijitArgs: {
          multiple: false,
          createMapResponse: this.map.webMapResponse,
          portalUrl: this.appConfig.portalUrl,
          style: {
            height: '100%'
          }
        }
      };

      var sourcePopup = new _QueryableLayerSourcePopup(args);
      this.own(on(sourcePopup, 'ok', lang.hitch(this, function(item){
        //{name, url, definition}
        var radioType = sourcePopup.getSelectedRadioType();
        sourcePopup.close();
        sourcePopup = null;

        if(this.currentSQS){
          this.currentSQS.destroy();
          this.currentSQS = null;
        }

        //var queryName = this._getSuitableQueryName(item.name);
        var queryName = item.name || "";
        var addResult = this.queryList.addRow({name: queryName});
        if (addResult.success) {
          var tr = addResult.tr;
          this.queryList.selectRow(tr);
          if(this.currentSQS){
            var expr = null;
            if(radioType === 'map'){
              var layerObject = item.layerInfo && item.layerInfo.layerObject;
              if(layerObject && typeof layerObject.getDefinitionExpression === 'function'){
                expr = layerObject.getDefinitionExpression();
              }
            }
            this.currentSQS.setNewLayerDefinition(item.name, item.url, item.definition,
                                                  queryName, expr);
          }
        }
      })));

      this.own(on(sourcePopup, 'cancel', lang.hitch(this, function(){
        sourcePopup.close();
        sourcePopup = null;
      })));

      sourcePopup.startup();
    },

    _getSuitableQueryName: function(name){
      var finalName = name;
      var data = this.queryList.getData();
      var allNames = array.map(data, lang.hitch(this, function(rowData){
        return rowData.name;
      }));

      var flag = 2;
      while(array.indexOf(allNames, finalName) >= 0){
        name += ' ' + flag;
        flag++;
      }

      return name;
    },

    _onQueryItemRemoved:function(tr){
      if(this.currentSQS){
        if(this.currentSQS.tr === tr){
          this.currentSQS.destroy();
          this.currentSQS = null;
        }
      }
    },

    _onQueryItemSelected:function(tr){
      if(this.currentSQS){
        if(this.currentSQS.tr !== tr){
          var singleConfig = this.currentSQS.getConfig();
          if(singleConfig){
            this.currentSQS.tr.singleConfig = singleConfig;
            this.currentSQS.destroy();
            this.currentSQS = null;
            this._createSingleQuerySetting(tr);
          }
          else{
            this.queryList.selectRow(this.currentSQS.tr);
          }
        }
      }
      else{
        this._createSingleQuerySetting(tr);
      }
    }

  });
});