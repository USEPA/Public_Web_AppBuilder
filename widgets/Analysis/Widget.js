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
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/dom-style',
  'dojo/dom-attr',
  'dojo/dom-class',
  'dojo/Deferred',
  'dojo/on',
  'dojo/query',
  'dojo/promise/all',
  'dojo/dom-construct',
  'dojo/i18n!esri/nls/jsapi',
  'dojo/json',
  'dijit/_WidgetsInTemplateMixin',
  'esri/request',
  'esri/tasks/JobInfo',
  'esri/layers/FeatureLayer',
  'esri/dijit/PopupTemplate',
  'esri/dijit/analysis/utils',
  'esri/geometry/Extent',
  'jimu/BaseWidget',
  'jimu/dijit/ViewStack',
  'jimu/dijit/Message',
  'jimu/utils',
  'jimu/portalUtils',
  'jimu/portalUrlUtils',
  'jimu/LayerInfos/LayerInfos',
  './layerUtil',
  './toolValidate',
  './PrivilegeUtil',
  './toolSettings',
  'dojo/i18n!./setting/nls/strings',
  'dijit/form/Button'
],
function(declare, lang, html, array, domStyle, domAttr, domClass, Deferred, on,
  query, all, domConstruct, jsapiBundle, JSON, _WidgetsInTemplateMixin,
  esriRequest, JobInfo, FeatureLayer, PopupTemplate, AnalysisUtils, Extent,
  BaseWidget, ViewStack, Message, jimuUtils, portalUtils,
  portalUrlUtils, LayerInfos, layerUtil, toolValidate, PrivilegeUtil,
  toolSettings, settingBundle) {
  var TOOLLIST_VIEW = 0, ANALYSIS_VIEW = 1, MESSAGE_VIEW = 2;

  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-analysis esriAnalysis',

    _hasContent: null,
    privilegeUtil: null,
    currentStack: 0,
    toolCountInList: 0,

    postMixInProperties: function() {
      this.inherited(arguments);
      lang.mixin(this.nls, jsapiBundle.analysisTools);
      this.nls.toolNotAvailable = settingBundle.toolNotAvailable;
    },

    postCreate: function() {
      this.inherited(arguments);

      this.privilegeUtil = new PrivilegeUtil();

      this.viewStack = new ViewStack({
        viewType: 'dom',
        views: [this.toolListPanel, this.toolPanel, this.messagePanel]
      });
      html.place(this.viewStack.domNode, this.widgetContent);

      if (this.config.analysisTools.length === 0) {
        this._noPrivilegeHandler(this.nls.noToolTip);
      }
      this._switchView(TOOLLIST_VIEW);
    },

    _closeHelpDialog: function(){
      if (AnalysisUtils._helpDialog &&
        typeof AnalysisUtils._helpDialog.close === 'function') {
        AnalysisUtils._helpDialog.close();
      }
    },

    onClose: function() {
      this._closeHelpDialog();
      this._deactiveDrawTool();
    },

    onDeActive: function(){
      this._deactiveDrawTool();
    },

    _checkValidation: function() {
      //empty tool list
      domConstruct.empty(this.toolsTbody);

      if (this.config.analysisTools.length === 0) {
        return;
      }

      this.shelter.show();
      this.privilegeUtil.loadPrivileges(this._getPortalUrl()).then(
        lang.hitch(this, function(status) {
          if (!status || !this.privilegeUtil.canPerformAnalysis()) {
            this._noPrivilegeHandler(this.nls.privilegeError);
          } else {
            domStyle.set(this.toolsSection, 'display', 'block');
            domStyle.set(this.noQueryTipSection, 'display', 'none');

            if (this.config.analysisTools.length === 1) {
              this._initSingleTool().then(lang.hitch(this, function() {
                this.shelter.hide();
              }));
            } else {
              this._initToolList().then(lang.hitch(this, function() {
                this.shelter.hide();
              }));
            }
          }
        }), lang.hitch(this, function() {
          //load privileges error
          this._noPrivilegeHandler(this.nls.privilegeError);
          this.shelter.hide();
        }));
    },

    _clearContent: function() {
      //empty tool list
      domConstruct.empty(this.toolsTbody);

      //remove dijit if exists
      if (this.currentAnalysisDijit) {
        // this.currentAnalysisDijit.destroy();
        this.currentAnalysisDijit = null;
        domConstruct.empty(this.toolCtr);
      }
      this.currentToolSetting = null;
    },

    _noPrivilegeHandler: function(message) {
      this.shelter.hide();
      domStyle.set(this.toolsSection, 'display', 'none');
      domAttr.set(this.noQueryTipSection, 'innerHTML', jimuUtils.stripHTML(message));
      domStyle.set(this.noQueryTipSection, 'display', 'block');
    },

    _initSingleTool: function() {
      domStyle.set(this.homeBtn, 'display', 'none');
      this.currentToolSetting = toolSettings.findToolSetting(
        this.config.analysisTools[0].name);

      if (this.currentToolSetting === null) {
        this._noPrivilegeHandler(this.nls.noToolTip);
        return;
      }

      //mix in custom tool setting
      this.currentToolSetting = lang.mixin(this.currentToolSetting, this.config.analysisTools[0]);
      if(!this.currentToolSetting.toolLabel){//If upgrade from 1.2, toolLabel is undefined.
        this.currentToolSetting.toolLabel = this.nls[this.currentToolSetting.title];
      }

      //check extra privileges
      var hasPrivileges = this.privilegeUtil.hasPrivileges(
        this.currentToolSetting.privileges);
      if (!hasPrivileges) {
        this._noPrivilegeHandler(this.nls.privilegeError);
        return;
      }
      return layerUtil.getLayerObjects(this.map).then(lang.hitch(this, function() {
        this._setIconAndLink(this.currentToolSetting);
        this.toolCountInList = 1;

        this._switchToAnalysisTool();
      }));
    },

    _initToolList: function() {
      domStyle.set(this.homeBtn, 'display', '');
      this.toolCountInList = 0;
      var lastToolConfig = null;
      return layerUtil.getLayerObjects(this.map).then(lang.hitch(this, function(res) {
        array.forEach(this.config.analysisTools, lang.hitch(this, function(item, idx) {
          var toolSetting = toolSettings.findToolSetting(item.name);
          if (toolSetting !== null) {
            toolSetting = lang.mixin(toolSetting, this.config.analysisTools[idx]);
            if(!toolSetting.toolLabel){//If upgrade from 1.2, toolLabel is undefined.
              toolSetting.toolLabel = this.nls[toolSetting.title];
            }
            //check extra privileges
            var hasPrivileges =
                this.privilegeUtil.hasPrivileges(toolSetting.privileges);

            if (hasPrivileges) {
              //validate tool, check whether there are feature layer(s)
              //required to run this tool
              var isValid = toolValidate.isValid(res, toolSetting, this.privilegeUtil);
              this._addTool(toolSetting, idx, isValid);
              this.toolCountInList += 1;
              lastToolConfig = toolSetting;
            }
          }
        }));
        if (this.toolCountInList === 0) {
          this._noPrivilegeHandler(this.nls.privilegeError);
        } else if (this.toolCountInList === 1) {
          this._setIconAndLink(lastToolConfig);
          this._switchToAnalysisTool();
        }
      }), lang.hitch(this, function() {
        console.error('layerUtil: getLayerObjects error');
      }));
    },

    destroy: function() {
      this._clearContent();
      this.inherited(arguments);
    },

    _addTool: function(rowData, idx, isValid) {
      var tr = domConstruct.create("tr", {
        'class': 'tools-table-tr'
      }, this.toolsTbody);
      if (idx % 2 === 0) {
        domClass.add(tr, 'even');
      } else {
        domClass.add(tr, 'odd');
      }
      tr.rowData = rowData;

      //create name
      var iconTd = domConstruct.create("td", {
        'class': 'icon-td'
      }, tr);
      domConstruct.create('div', {
        'class': 'tool-name',
        innerHTML: jimuUtils.stripHTML(rowData.toolLabel)
      }, iconTd);
      //create img
      var iconDiv = domConstruct.create('div', {
        'class': 'icon-div'
      }, iconTd);
      domConstruct.create('img', {
        src: this.folderUrl + rowData.imgDisplay,
        'class': 'tool-icon'
      }, iconDiv);

      //create tooltip
      var tooltipTd = domConstruct.create('td', {
        'class': 'tooltip-td esriAnalysis'
      }, tr);
      if(rowData.showHelp){
        var tooltipLink = domConstruct.create('a', {
          href: '#',
          esriHelpTopic: 'toolDescription'
        }, tooltipTd);
        domConstruct.create('img', {
          src: this.folderUrl + 'images/helpIcon.png',
          title: rowData.toolLabel,
          'class': 'tooltip-icon'
        }, tooltipLink);

        //bind event
        var index = rowData.dijitID.lastIndexOf('\/');
        var helpFileName = rowData.dijitID.substring(index + 1);
        var isPortal = !portalUrlUtils.isOnline(this._getPortalUrl());
        AnalysisUtils.initHelpLinks(tr, true, {
          helpFileName: helpFileName,
          isSingleTenant: isPortal
        });
      }

      if (isValid === true) {
        domAttr.set(tr, 'title', '');
        this.own(on(tr, 'click', lang.hitch(this, function() {
          this._setIconAndLink(rowData);
          this.currentToolSetting = rowData;
          this._switchToAnalysisTool();
        })));
      } else {
        domAttr.set(tr, 'title', this.nls.toolNotAvailable);
        domClass.remove(tr, 'even');
        domClass.remove(tr, 'odd');
        domClass.add(tr, 'disabled');
      }
    },

    _setIconAndLink: function(rowData) {
      domAttr.set(this.smallIcon, 'src', this.folderUrl + rowData.icon);
      domAttr.set(this.toolTitle, 'innerHTML', jimuUtils.stripHTML(rowData.toolLabel));

      //change help icon link
      var idx = rowData.dijitID.lastIndexOf('\/');
      var helpFileName = rowData.dijitID.substring(idx + 1);

      if (this.helpLink) {
        domConstruct.destroy(this.helpLink);
        this.helpLink = null;
      }
      if(rowData.showHelp){
        this.helpLink = domConstruct.create('a', {
          href: '#',
          esriHelpTopic: 'toolDescription'
        }, this.inputHeader);
        domConstruct.create('img', {
          height: 16,
          width: 16,
          'class': 'help-icon jimu-float-trailing',
          src: this.folderUrl + 'images/helpIcon.png'
        }, this.helpLink);

        AnalysisUtils.initHelpLinks(this.inputHeader, true, {
          helpFileName: helpFileName
        });
      }
    },

    _switchToAnalysisTool: function() {
      domStyle.set(this.toolLoadErrorNode, 'display', 'none');

      this.shelter.show();
      require([this.currentToolSetting.dijitID], lang.hitch(this, function(AnalysisDijit) {
        if (this.currentAnalysisDijit) {
          //this.currentAnalysisDijit.destroy();
          this.currentAnalysisDijit = null;
          domConstruct.empty(this.toolCtr);
        }
        var isPortal = !portalUrlUtils.isOnline(this._getPortalUrl());

        var args = {
          map: this.map,
          //analysisGpServer: analysisGpServer,
          showSelectFolder: true,
          portalUrl: this._getPortalUrl(this.privilegeUtil.getUserPortal()),
          showCredits: this.currentToolSetting.showCredits,
          showHelp: this.currentToolSetting.showHelp,
          showChooseExtent: this.currentToolSetting.showChooseExtent,
          returnFeatureCollection: this.currentToolSetting.returnFeatureCollection,
          showReadyToUseLayers: this.currentToolSetting.showReadyToUseLayers,
          isSingleTenant: isPortal
        };

        //Living Atlas Analysis Layer is not available in portal 10.4
        if(isPortal){
          args.showReadyToUseLayers = false;
        }

        if(this.currentToolSetting.title === 'findNearest' ||
            this.currentToolSetting.title === 'summarizeNearby' ||
            this.currentToolSetting.title === 'enrichLayer'){
          args.enableTravelModes = this.privilegeUtil.hasPrivileges(['networkanalysis']);
        }

        if('returnFeatureCollection' in this.currentToolSetting){
          args.showSelectFolder = !this.currentToolSetting.returnFeatureCollection;
        }
        this._getLayerObjects().then(lang.hitch(this, function(layerObjects){
          //set analysis param
          if (this.currentToolSetting.analysisLayer) {
            // args[this.currentToolSetting.analysisLayer.name] = this.inputLayer;
            args.showSelectAnalysisLayer = true;
            args[this.currentToolSetting.analysisLayer.name + 's'] =
                this._prepareLayers(layerObjects, this.currentToolSetting.analysisLayer.geomTypes);
          }

          //set required and optional param
          var optionalArgs = this._prepareLayerParams(layerObjects);
          lang.mixin(args, optionalArgs);
          try {
            //TODO: fix it, if don't set primaryActionButttonClass,
            //DeriveNewLocations, FindExistingLocations, FindSimilarLocations fails to build ui
            if (this.currentToolSetting.dijitID.indexOf('DeriveNewLocations') !== -1 ||
              this.currentToolSetting.dijitID.indexOf('FindExistingLocations') !== -1 ||
              this.currentToolSetting.dijitID.indexOf('FindSimilarLocations') !== -1) {
              args.primaryActionButttonClass = 'esriAnalysisSubmitButton';
            }
            this.currentAnalysisDijit = new AnalysisDijit(args, domConstruct.create('div', {
              style: {width:'100%'}
            }, this.toolCtr));
            this.currentAnalysisDijit._setTitleAttr(this.currentToolSetting.toolLabel);
            this._bindAnalysisEvents(this.currentAnalysisDijit);

            this.currentDijitID = this.currentToolSetting.dijitID;

            var submitButton;
            if (this.toolCountInList > 1) {
              submitButton = query('.esriAnalysis .esriAnalysisSubmitButton',
                this.toolPanel)[0];
              if (typeof submitButton !== 'undefined') {
                domClass.add(submitButton, 'multiTool');
                var btnDiv = domConstruct.create('div', {
                  'class': 'toolpanel-button'
                });
                //create back button
                var backBtn = domConstruct.create('div', {
                  'class': 'jimu-btn',
                  innerHTML: this.nls.back
                }, btnDiv);
                domConstruct.place(btnDiv, submitButton, 'before');
                domConstruct.place(submitButton, btnDiv);
                this.currentAnalysisDijit.own(on(backBtn, 'click',
                  lang.hitch(this, this._switchToPrevious)));
              }
            }
          } catch (err) {
            console.error(err.message || err);
            domAttr.set(this.toolLoadErrorNode, 'innerHTML',
                jimuUtils.stripHTML(err.message || err));
            domStyle.set(this.toolLoadErrorNode, 'display', '');
          }

          this.shelter.hide();
        }));
      }), lang.hitch(this, function(err) {
        domAttr.set(this.toolLoadErrorNode, 'innerHTML', jimuUtils.stripHTML(err));
        domStyle.set(this.toolLoadErrorNode, 'display', '');
        this.shelter.hide();
      }));

      this._switchView(ANALYSIS_VIEW);
    },

    _prepareLayerParams: function(layerObjects) {
      var optionalArgs = {};
      if ('optionalParams' in this.currentToolSetting ||
          'requiredParam' in this.currentToolSetting) {
        var matchedLayers;
        if ('requiredParam' in this.currentToolSetting) {
          matchedLayers = this._prepareLayers(layerObjects,
            this.currentToolSetting.requiredParam.geomTypes);
          if (this.currentToolSetting.requiredParam.isArray) {
            optionalArgs[this.currentToolSetting.requiredParam.name] = matchedLayers;
          } else {
            optionalArgs[this.currentToolSetting.requiredParam.name] =
              matchedLayers.length > 0 ? matchedLayers[0] : null;
          }
        }
        if ('optionalParams' in this.currentToolSetting) {
          array.forEach(this.currentToolSetting.optionalParams, function(param) {
            matchedLayers = this._prepareLayers(layerObjects, param.geomTypes);
            if (param.isArray) {
              optionalArgs[param.name] = matchedLayers;
            } else {
              optionalArgs[param.name] = matchedLayers.length > 0 ? matchedLayers[0] : null;
            }
          }, this);
        }
      }
      return optionalArgs;
    },

    _prepareLayers: function(layerObjects, geomTypes) {
      var geoType, types = ['point', 'polyline', 'polygon'], matchedLayers = [];

      if (geomTypes[0] !== '*') {
        types = array.map(geomTypes, function(esriGeoType){
          return jimuUtils.getTypeByGeometryType(esriGeoType);
        });
      }

      array.forEach(layerObjects, function(layer) {
        if (layer.declaredClass === "esri.layers.FeatureLayer") {
          geoType = jimuUtils.getTypeByGeometryType(layer.geometryType);
          if (types.indexOf(geoType) >= 0 && (layer.url || layer.graphics.length > 0)) {
            matchedLayers.push(layer);
          }
        }
      }, this);

      return matchedLayers;
    },

    _getLayerObjects: function() {
      var retDef = new Deferred();

      LayerInfos.getInstance(this.map, this.map.itemInfo).then(lang.hitch(this, function(
        layerInfosObject) {
        var layerInfos = [];
        layerInfosObject.traversal(function(layerInfo) {
          layerInfos.push(layerInfo);
        });

        var defs = array.map(layerInfos, function(layerInfo) {
          return layerInfo.getLayerObject();
        });
        all(defs).then(lang.hitch(this, function(layerObjects) {
          var resultArray = [];
          array.forEach(layerObjects, function(layerObject) {
            if (layerObject) {
              resultArray.push(layerObject);
            }
          });
          retDef.resolve(resultArray);
        }), function(err) {
          /*jshint unused: false*/
          retDef.resolve([]);
        });
      }));

      return retDef;
    },

    _deactiveDrawTool: function() {
      if (!this.currentAnalysisDijit) {
        return;
      }
      if (this.currentToolSetting.title === 'findHotSpots' ||
        this.currentToolSetting.title === 'calculateDensity' ||
        this.currentToolSetting.title === 'traceDownstream' ||
        this.currentToolSetting.title === 'interpolatePoints' ||
        this.currentToolSetting.title === 'findSimilarLocations' ||
        this.currentToolSetting.title === 'createViewshed' ||
        this.currentToolSetting.title === 'createWatershed') {
        this.currentAnalysisDijit.clear();
      } else if (this.currentToolSetting.title === 'planRoutes' ||
        this.currentToolSetting.title === 'extractData') {
        this.currentAnalysisDijit.clear();
        this.map.setInfoWindowOnClick(true);
      }
    },

    _bindAnalysisEvents: function(analysisDijit) {
      this.own(on(analysisDijit, 'start',
        lang.hitch(this, this._onJobStart)));
      this.own(on(analysisDijit, 'job-submit',
        lang.hitch(this, this._onJobSubmitted)));
      this.own(on(analysisDijit, 'job-cancel',
        lang.hitch(this, this._onJobCancelled)));
      this.own(on(analysisDijit, 'job-fail',
        lang.hitch(this, this._onJobFailed)));
      this.own(on(analysisDijit, 'job-success',
        lang.hitch(this, this._onJobSucceed)));
      this.own(on(analysisDijit, 'job-status',
        lang.hitch(this, this._onJobStatusChange)));
      this.own(on(analysisDijit, 'job-result',
        lang.hitch(this, this._onJobResultData)));
      this.own(on(analysisDijit, 'drawtool-activate',
        lang.hitch(this, function(){
        this.map.setInfoWindowOnClick(false);
      })));
      this.own(on(analysisDijit, 'drawtool-deactivate',
        lang.hitch(this, function(){
        this.map.setInfoWindowOnClick(true);
      })));
    },

    _onJobStart: function() {
      this._clearMessageLogs();
      this.shelter.show();
      this._switchView(MESSAGE_VIEW);
    },

    _onJobSubmitted: function(res) {
      /*{
        params: <Object>
      }*/
      this.shelter.hide();
      this.outputProperties = null;
      if (res.OutputName) {
        this.outputProperties = JSON.parse(res.OutputName, true);
      }

      this._appendMessage(this.nls[this.currentToolSetting.title] + ' ' +
        this.nls.jobSubmitted);
      //add loading icon, wait for next message
      var node = domConstruct.create('div', {
        'class': 'job-message waiting'
      }, this.messageSection);
      domConstruct.create('img', {
        'class': 'job-running-icon',
        src: this.folderUrl + 'images/loading.gif'
      }, node);
    },

    _onJobCancelled: function(res) {
      /*{
        "inputs": {},
        "jobId": <job id>,
        "jobStatus": <job status>,
        "messages": <an array of message text>,
        "results": {}
      }*/
      if (res.jobStatus) {
        this._appendMessage(this.nls.jobCancelled + ': ' + res.jobStatus, 'cancelled');
      } else {
        this._appendMessage(this.nls.jobCancelled, 'cancelled');
      }

      this._onJobDone();
      //show button area
      domStyle.set(this.buttonSection, 'display', '');
    },

    _onJobFailed: function(res) {
      /*
      If job parameter has some error, res structure
      {
        message: "A result layer already exists with this name. Result layers
        must be named uniquely across the organization. Please use a different name."
        messageCode: "AB_0002"
        type: "warning"
      }
      If job submitted and returns error, res structure
      {
        "analysisReport": <analysis report message>,
        "dataType": <analysis report message>,
        "paramName": < parameter  name >,
        "value": <output item info | feature collection>
      }*/
      this.shelter.hide();

      if(res.type === 'warning'){
        //re enable run
        this.currentAnalysisDijit.set('disableRunAnalysis', false);
        this._switchView(ANALYSIS_VIEW);
        new Message({
          message: res.message
        });
        return;
      }

      if (this.currentStack !== MESSAGE_VIEW) {
        this._clearMessageLogs();
        this._switchView(MESSAGE_VIEW);
      }
      this._appendMessage(this.nls.jobFailed + ': ' +
        (res.analysisReport || res.message), 'failed');
      this._onJobDone();
      //show button area
      domStyle.set(this.buttonSection, 'display', '');
    },

    _onJobSucceed: function(res) {
      /*
        jobInfo: {
          "inputs": {},
          "jobParams": <job parameters>,
          "jobId": <job id>,
          "jobStatus": <job status>,
          "messages": <an array of message text>,
          "results": {}
        }
      */
      /*jshint unused: false*/
      this._appendMessage(this.nls.jobSuccess, 'success');
      this._onJobDone();

      if (this.currentToolSetting.dijitID.indexOf('ExtractData') >= 0) {
        domStyle.set(this.resultSection, 'display', '');
        domAttr.set(this.outputtip, 'innerHTML', jimuUtils.stripHTML(this.nls.outputSaveInPortal));
      }
      domStyle.set(this.buttonSection, 'display', '');
      domStyle.set(this.resultLoading, 'display', '');
    },

    _onJobDone: function() {
      //remove running and cancel images
      query('img.job-executing', this.messagePanel).forEach(function(node) {
        domConstruct.destroy(node);
      });
    },

    _onJobStatusChange: function(res) {
      /*
        jobInfo: {
          "inputs": {},
          "jobParams": <job parameters>,
          "jobId": <job id>,
          "jobStatus": <job status>,
          "messages": <an array of message text>,
          "results": {}
        }
      */
      this.shelter.hide();
      if (res.jobId && res.jobId !== this.currentToolJobId) {
        this.currentToolJobId = res.jobId;
      }

      if (res.jobStatus === JobInfo.STATUS_EXECUTING) {
        this._appendExecutingMessage();
      } else {
        switch (res.jobStatus) {
          case JobInfo.STATUS_FAILED:
          case JobInfo.STATUS_CANCELLED:
          case JobInfo.STATUS_DELETED:
          case JobInfo.STATUS_TIMED_OUT:
            this.shelter.hide();
            if (typeof res.message === 'string') {
              this._appendMessage(res.message, 'failed');
            }
            this._onJobDone();
            domStyle.set(this.buttonSection, 'display', '');
            break;
          case JobInfo.STATUS_SUCCEEDED:
            if (typeof res.message === 'string') {
              this._appendMessage(res.message);
            }
            this._onJobDone();
            domStyle.set(this.buttonSection, 'display', '');
            break;
        }
      }
    },

    _onJobResultData: function(res) {
      /*
        result: {
          "analysisReport": <analysis report message>,
          "dataType": <analysis report message>,
          "paramName": < parameter  name >,
          "value": <output item info | feature collection>
        }
      */
      domStyle.set(this.resultLoading, 'display', 'none');
      domAttr.set(this.outputtip, 'innerHTML', jimuUtils.stripHTML(this.nls.outputtip));
      domStyle.set(this.resultSection, 'display', '');
      domStyle.set(this.buttonSection, 'display', '');
      var outputLayerName = this._appendResultMessage(res);
      console.debug('outputLayerName: ' + outputLayerName);
      if (this.currentToolSetting.dijitID.indexOf('ExtractData') < 0) {
        var popupTemplate;
        if (res.value.itemId) {
          var popupInfo = null;
          if ('layerInfo' in res.value) {
            popupInfo = res.value.layerInfo.popupInfo;
          }
          this._fetchResultByItemId(outputLayerName, res.value.itemId, popupInfo);
        } else if ('layerDefinition' in res.value) { // feature set
          var popupInfoLocal = {
            title: outputLayerName ? outputLayerName : 'output',
            fieldInfos: []
          };
          array.forEach(res.value.layerDefinition.fields, function(field) {
            if (field.name !== res.value.layerDefinition.objectIdField) {
              popupInfoLocal.fieldInfos.push({
                fieldName: field.name,
                visible: true,
                label: field.alias,
                isEditable: false
              });
            }
          });
          popupTemplate = new PopupTemplate(popupInfoLocal);
          var featureLayer = new FeatureLayer(res.value, {
            infoTemplate: popupTemplate
          });
          featureLayer.title = outputLayerName ? outputLayerName : 'output';
          this.map.addLayer(featureLayer);
        }
      }
    },

    _fetchResultByItemId: function(outputLayerName, itemId, popupInfo) {
      var portal = portalUtils.getPortal(
        this._getPortalUrl(this.privilegeUtil.getUserPortal()));
      portal.getItemById(itemId).then(lang.hitch(this, function(portalItem) {
        var baseUrl = portalItem.url;
        esriRequest({
          url: baseUrl,
          content: {
            f: 'json'
          },
          handleAs: 'json'
        }).then(lang.hitch(this, function(serviceMeta) {
          var tables = serviceMeta.tables || [];
          var layers = serviceMeta.layers || [];
          tables.reverse();
          layers.reverse();
          array.forEach(tables, function(table) {
            var tableUrl = baseUrl + '\/' + table.id;
            //add table using LayerInfos.addTable
            LayerInfos.getInstance(this.map, this.map.itemInfo).then(function(layerInfosObject){
              layerInfosObject.addTable({
                url: tableUrl,
                title: outputLayerName + ' - ' + table.name,
                options: {
                  outFields: ["*"]
                }
              });
            });
          }, this);
          array.forEach(layers, function(layer) {
            var layerUrl = baseUrl + '\/' + layer.id;
            var popupLocal = null;
            if (layers.length === 1) {
              popupLocal = popupInfo;
            }
            this._buildFeatureLayer(layer.name, layerUrl, popupLocal,
              itemId).then(lang.hitch(this, function(featureLayer) {
              this.map.addLayer(featureLayer);
            }));
          }, this);

          if (serviceMeta.initialExtent) {
            this.map.setExtent(new Extent(serviceMeta.initialExtent));
          }
        }));
      }));
    },

    _buildFeatureLayer: function(layerName, url, popupInfo, itemId) {
      if (popupInfo !== null) {
        var ret = new Deferred();
        popupInfo.title = layerName;
        var featureLayer = new FeatureLayer(url, {
          mode: FeatureLayer.MODE_SNAPSHOT,
          infoTemplate: new PopupTemplate(popupInfo),
          outFields: ["*"]
        });
        featureLayer._itemId = itemId;
        ret.resolve(featureLayer);
        return ret;
      } else {
        return esriRequest({
          url: url,
          content: {
            f: 'json'
          },
          handleAs: 'json'
        }).then(lang.hitch(this, function(layerDefinition) {
          var popupInfoLocal = {
            title: layerName,
            fieldInfos: []
          };
          array.forEach(layerDefinition.fields, function(field) {
            if (field.name !== layerDefinition.objectIdField) {
              popupInfoLocal.fieldInfos.push({
                fieldName: field.name,
                visible: true,
                label: field.alias,
                isEditable: false
              });
            }
          });

          var featureLayer = new FeatureLayer(url, {
            mode: FeatureLayer.MODE_SNAPSHOT,
            infoTemplate: new PopupTemplate(popupInfoLocal),
            outFields: ["*"]
          });
          featureLayer._itemId = itemId;
          return featureLayer;
        }), lang.hitch(this, function() { //on Error
          var featureLayer = new FeatureLayer(url);
          featureLayer._itemId = itemId;
          return featureLayer;
        }));
      }
    },

    _clearMessageLogs: function() {
      domConstruct.empty(this.messageSection);
      domConstruct.empty(this.outputSection);
      domStyle.set(this.resultSection, 'display', 'none');
      domStyle.set(this.buttonSection, 'display', 'none');
    },

    _appendMessage: function(msg, type) {
      domConstruct.create('div', {
        'class': 'job-message ' + (type ? type : ''),
        innerHTML: jimuUtils.stripHTML(msg)
      }, this.messageSection);
    },

    _appendExecutingMessage: function() {
      query('div.waiting', this.messagePanel).forEach(function(node) {
        domConstruct.destroy(node);
      });
      var nodeList = query('div.job-executing', this.messagePanel);
      if (nodeList.length === 0) {
        var node = domConstruct.create('div', {
          'class': 'job-message job-executing'
        }, this.messageSection);
        domConstruct.create('span', {
          innerHTML: jimuUtils.stripHTML(this.nls.executing)
        }, node);
        domConstruct.create('img', {
          'class': 'job-running-icon job-executing',
          src: this.folderUrl + 'images/loading.gif'
        }, node);
        //create cancel button
        var cannotCancel = false;
        if (this.currentToolSetting.cannotCancel === true) {
          cannotCancel = true;
        } else if (this.currentToolSetting.dijitID.indexOf('EnrichLayer') >= 0) {
          //Enrich layer with Drive Time Options also cannot be cancelled
          if (this.currentAnalysisDijit && this.currentAnalysisDijit.enableTravelModes) {
            cannotCancel = true;
          }
        }
        if (!cannotCancel) {
          var closeImg = domConstruct.create('img', {
            'class': 'job-cancel-icon job-executing',
            src: this.folderUrl + 'images/cancel.png',
            title: this.nls.cancelJob
          }, node);

          this.own(on(closeImg, 'click', lang.hitch(this, this._cancelTask)));
        }
      }
    },

    _appendResultMessage: function(res) {
      if (res.paramName) {
        var label = res.paramName;

        var node = domConstruct.create('div', {
          'class': 'output-item'
        }, this.outputSection);

        if (res.value && res.value.itemId) {
          var itemUrl = portalUrlUtils.getItemDetailsPageUrl(
            this._getPortalUrl(this.privilegeUtil.getUserPortal()),
                res.value.itemId);
          if (typeof this.outputProperties === 'object') {
            if (res.value.itemId === this.outputProperties.itemProperties.itemId) {
              label = this.outputProperties.serviceProperties.name;
            }
          }

          domConstruct.create('a', {
            href: itemUrl,
            target: '_blank',
            innerHTML: jimuUtils.stripHTML(label)
          }, node);
        } else {
          domAttr.set(node, 'innerHTML', res.paramName);
        }
        return label;
      } else {
        return null;
      }
    },

    _getPortalUrl: function(url) {
      if (url) {
        return portalUrlUtils.getStandardPortalUrl(url);
      } else {
        return portalUrlUtils.getStandardPortalUrl(this.appConfig.portalUrl);
      }
    },

    _cancelTask: function() {
      if (this.currentToolJobId && this.currentAnalysisDijit) {
        var jobInfo = {
          jobId: this.currentToolJobId
        };
        this.currentAnalysisDijit.cancel(jobInfo);
      }
    },

    _switchToPrevious: function() {
      if (this.currentStack === MESSAGE_VIEW) {
        this._switchToAnalysisTool();
      } else {
        this._deactiveDrawTool();
        this._switchView(TOOLLIST_VIEW);
      }
    },

    _switchToHome: function() {
      if (this.toolCountInList > 1) {
        this._switchView(TOOLLIST_VIEW);
      } else {
        this._switchToAnalysisTool();
      }
    },

    _switchView: function(idx) {
      this._closeHelpDialog();
      if (idx === TOOLLIST_VIEW) {
        //perform validation check
        this._checkValidation();
      }
      this.currentStack = idx;
      this.viewStack.switchView(idx);
    }
  });
});
