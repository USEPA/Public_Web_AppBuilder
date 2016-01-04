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
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    'dojo/_base/html',
    'dojo/query',
    'dojo/on',
    'dijit/registry',
    'esri/tasks/datareviewer/ReviewerResultsTask',
    'jimu/dijit/Message',
    'dojo/dom-style',
    'dijit/form/ValidationTextBox',
    'jimu/dijit/RadioBtn'
  ],
  function(
    declare, array, lang,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting, Table, html, query, on, registry, ReviewerResultsTask, Message, domStyle) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'drs-widget-report-feature-setting',
      includeUserBy:'',
      defaultUserName:'',
      selectedUserType:'',
      postCreate: function(){
        this.own(on(this.currentUser, 'click', lang.hitch(this, function() {
          this._setRadioItem(this.currentUser);
        })));
        this.own(on(this.userName, 'click', lang.hitch(this, function() {
          this._setRadioItem(this.userName);
          //html.setStyle(this.rulerNode, 'display', 'none');
        })));
        this.own(on(this.userInput, 'click', lang.hitch(this, function() {
          this._setRadioItem(this.userInput);
        })));
      },
      startup: function() {
        this.inherited(arguments);
        if (!this.config.layers) {
          this.config.layers = [];
        }

        var fields = [{
          name: 'label',
          title: this.nls.label,
          width: '40%',
          type: 'text'
        },
         {
          name: 'id',
          title: 'index',
          type: 'text',
          hidden: true
        }, {
          name: 'alias',
          title: this.nls.alias,
          type: 'text',
          width: '40%',
          editable: 'true',
          'class': 'symbol'
        }, {
          name: 'show',
          title: this.nls.show,
          width: 'auto',
          type: 'checkbox',
          'class': 'show'
        }, {
          name: 'layerType',
          title: 'layerType',
          type: 'text',
          hidden: true
        }, {
          name: 'url',
          title: 'url',
          type: 'text',
          hidden: true
        }
        ];
        this._setUserNameVisibility(false);
        //on(this.defaultUser, "change", lang.hitch(this, this._setUserNameVisibility));
        var args = {
          fields: fields,
          selectable: true
        };
        this.displayFieldsTable = new Table(args);
        this.displayFieldsTable.placeAt(this.tableLayerInfos);
        html.setStyle(this.displayFieldsTable.domNode, {
          'height': '100%'
        });
        this.displayFieldsTable.startup();
        this.setConfig(this.config);
      },
      _setUserNameVisibility: function(checked){
        var userNameRow = query(this.userNameSettings);
        if (checked){
          this.set('includeUserBy', 'default');
          userNameRow.style({'display':'block'});
          this.showHideDynamicRows(true, this.userNameSettings);
        }
        else{
          this.showHideDynamicRows(false, this.userNameSettings);
        }
      },
      showHideDynamicRows:function(bShowHide){
        var dynamicRows = query('.dynamicRow');
        if(dynamicRows !== undefined && dynamicRows !== null && dynamicRows.length > 0){
          for(var i = 0; i < dynamicRows.length; i++){
            if(bShowHide){
              dynamicRows[i].style.display = '';
            }else {
              dynamicRows[i].style.display = 'none';
            }
          }
        }
      },
      setConfig: function(config) {
        this.config = config;
        this.populateSessionNames(this.config.drsUrl);
        if (config.drsUrl) {
          this.drsUrl.set('value', config.drsUrl);
        }
        if (config.includeReportedBy === "" || config.includeReportedBy === "logon" ||
          config.includeReportedBy === undefined) {
          this._setRadioItem(this.currentUser);
          //this.currentLogin.set('checked', true);
        }
        else if (config.includeReportedBy === "default"){
          //this.defaultUser.set('checked', true);
          this._setRadioItem(this.userName);
          this.defaultUserName.set('value', config.defaultUserName);
        }
        else if (config.includeReportedBy === "user"){
          this._setRadioItem(this.userInput);
          //this.allowUser.set('checked', true);
        }
        var operationallayers = this.map.itemInfo.itemData.operationalLayers;
        if (operationallayers.length <= 0){
          domStyle.set(this.tableNoLayersError, "display", "");
          this.tableNoLayersError.innerHTML = this.nls.noLayers;
        } else {
          domStyle.set(this.tableNoLayersError, "display", "none");
        }
        for (var i = 0; i < operationallayers.length; i++) {
          var layer = operationallayers[i];
          if (layer.hasOwnProperty("url") && layer.url.indexOf("MapServer") > 0 ||
          layer.layerType === "ArcGISFeatureLayer") {
            var alias, show, layerType = "ArcGISMapServiceLayer";
            alias =  this.isLayerInConfig(layer, "alias");
            show = this.isLayerInConfig(layer, "show");
            if (layer.layerType){
              layerType = layer.layerType;
            }
            this.displayFieldsTable.addRow({
            label: layer.title,
            id: layer.id,
            alias: alias === "" ? layer.title : alias,
            show: show === "" ? true : show,
            layerType: layerType,
            url: layer.url
          });
          }
        }
      },
      _onBtnSetSourceClicked: function (){
        this.populateSessionNames(this.drsUrl.value);
      },
      populateSessionNames: function(drsURL){
        this.defaultSessionSelect.options.length = null;
        var reviewerTask = new ReviewerResultsTask(drsURL);
        var sessionsDeferred = reviewerTask.getReviewerSessions();
        sessionsDeferred.then(lang.hitch(this, function(response) {
        var reviewerSessions = response.reviewerSessions;
        array.forEach(reviewerSessions, lang.hitch(this, function(session) {
          var option = {value: session.sessionId, label: session.toString()};
          this.defaultSessionSelect.addOption(option);
        }));
        if (this.config.sessionID){
          this.defaultSessionSelect.set("value", this.config.sessionID.toString());
        }
      }));},
      isLayerInConfig: function(layer, infoType) {
        if (this.config.layers) {
          var info = this.config.layers;
          var len = info.length;
          for (var i = 0; i < len; i++) {
            if (info[i].id.toLowerCase() === layer.id.toLowerCase()){
              if (infoType === "show"){
                return info[i].show;
              }
              else if (infoType === "alias"){
                return info[i].alias;
              }
            }
          }
        }
        return "";
      },
      _setRadioItem: function(parentNode) {
        var _radio = registry.byNode(query('.jimu-radio', parentNode)[0]);
        _radio.check(true);
        this.selectedUserType = _radio.value;
        if (_radio.value === "default"){
          this._setUserNameVisibility(true);
        }
        else{
          this._setUserNameVisibility(false);
        }

      },
      // check that user supplied required fields
      // (DRS url and layer ids)
      // build array of layer objects from the strings
      getConfig: function() {
        if (!this.drsUrl.value) {
          new Message({
            message: this.nls.warning
          });
          return false;
        }
        this.config.drsUrl = this.drsUrl.value;
        if (this.defaultSessionSelect.value === "" ||
          this.defaultSessionSelect.value === undefined){
          new Message({
            message: this.nls.noSessionName
          });
          return false;
        }
        this.config.sessionID = this.defaultSessionSelect.value;
        var data = this.displayFieldsTable.getData();
        //var len = this.featurelayers.length;
        this.config.layers = [];

        var layerInfos = [];
        var len = data.length;
        for (var i = 0; i < len; i++) {
          var layer = {};
          layer.label = data[i].label;
          layer.id = data[i].id;
          layer.alias = data[i].alias;
          layer.show = data[i].show;
          layer.layerType = data[i].layerType;
          layer.url = data[i].url;
          layerInfos.push(layer);
        }
        this.config.layers = layerInfos;
        if (this.selectedUserType === "default" && this.defaultUserName.value === ""){
          new Message({
            message: this.nls.noUserName
          });
          return false;
        }
        this.config.includeReportedBy = this.selectedUserType;
        this.config.defaultUserName = this.defaultUserName.value;
        return this.config;
      }
    });
  });