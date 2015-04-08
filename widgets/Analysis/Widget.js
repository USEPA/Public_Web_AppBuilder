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
    'dojo/_base/event',
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
    'jimu/dijit/LayerChooserFromMapWithDropbox',
    'jimu/portalUtils',
    'jimu/portalUrlUtils',
    'jimu/LayerInfos/LayerInfos',
    './layerUtil',
    './toolValidate',
    './privilegeUtil',
    './toolSettings',
    'dojo/i18n!./setting/nls/strings',
    'dijit/form/Button'
  ],
  function(declare, lang, html, array, domStyle, domAttr, domClass, Event, Deferred, on,
    query, all, domConstruct, jsapiBundle, JSON, _WidgetsInTemplateMixin,
    esriRequest, JobInfo, FeatureLayer, PopupTemplate, AnalysisUtils, Extent,
    BaseWidget, ViewStack, LayerChooserFromMap2, portalUtils,
    portalUrlUtils, LayerInfos, layerUtil, toolValidate, privilegeUtil,
    toolSettings, settingBundle) {

    //var analysisGpServer = 'http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer';
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-analysis esriAnalysis',
      // clasName: 'esri.widgets.About',

      _hasContent: null,
      currentStack: 0,
      toolCountInList: 0,

      postMixInProperties: function(){
        this.inherited(arguments);
        lang.mixin(this.nls, jsapiBundle.analysisTools);
        this.nls.toolNotAvailable = settingBundle.toolNotAvailable;
      },

      postCreate: function() {
        this.inherited(arguments);

        this.errorMessage = 'Your user role is not able to perform analysis. In order to perform ' +
        'analysis, the administrator of your organization needs to grant you certain ' +
        '<a href="http://doc.arcgis.com/en/arcgis-online/reference/roles.htm" target="_blank">' +
        'privileges</a>.';

        this.viewStack = new ViewStack({
          viewType: 'dom',
          views: [this.toolListPanel, this.inputPanel, this.toolPanel, this.messagePanel]
        });
        html.place(this.viewStack.domNode, this.widgetContent);

        if(this.config.analysisTools.length === 0){
          this._noPrivilegeHandler(this.nls.noToolTip);
        }
        this._switchView(0);
      },

      onClose: function(){
        this._deactiveDrawTool();
      },

      _checkValidation:function(){
        //empty tool list
        domConstruct.empty(this.toolsTbody);

        if(this.config.analysisTools.length === 0){
          return;
        }

        this.shelter.show();
        privilegeUtil.loadPrivileges(this._getPortalUrl()).then(
            lang.hitch(this,function(status){
          if(!status || !privilegeUtil.isAnalysisAvailable()){
            this._noPrivilegeHandler(this.errorMessage);
          }else{
            domStyle.set(this.toolsSection, 'display', 'block');
            domStyle.set(this.noQueryTipSection, 'display', 'none');

            if(this.config.analysisTools.length === 1){
              this._initSingleTool().then(lang.hitch(this,function(){
                this.shelter.hide();
              }));
            }else{
              this._initToolList().then(lang.hitch(this,function(){
                this.shelter.hide();
              }));
            }
          }
        }), lang.hitch(this,function(){
          //load privileges error
          this._noPrivilegeHandler(this.errorMessage);
          this.shelter.hide();
        }));
      },

      _clearContent: function(){
        //empty tool list
        domConstruct.empty(this.toolsTbody);
        //empty layer chooser
        domConstruct.empty(this.layerNodeSection);
        if(this.inputLayerSelect){
          this.inputLayerSelect.destroy();
          this.inputLayer = null;
        }
        //remove dijit if exists
        if(this.currentAnalysisDijit){
          this.currentAnalysisDijit.destroy();
          this.currentAnalysisDijit = null;
        }
        this.currentToolSetting = null;
      },

      _noPrivilegeHandler: function(message){
        domStyle.set(this.toolsSection, 'display', 'none');
        domAttr.set(this.noQueryTipSection,'innerHTML', message);
        domStyle.set(this.noQueryTipSection, 'display', 'block');
      },

      _initSingleTool: function(){
        domStyle.set(this.homeBtn,'display','none');
        this.currentToolSetting = toolSettings.findToolSetting(
            this.config.analysisTools[0].name);

        if(this.currentToolSetting === null){
          this._noPrivilegeHandler(this.nls.noToolTip);
          return;
        }

        //check extra privileges
        var hasPrivileges = privilegeUtil.hasPrivileges(
              this.currentToolSetting.privileges);
        if(!hasPrivileges){
          this._noPrivilegeHandler(this.errorMessage);
          return;
        }
        return layerUtil.getLayerObjects(this.map).then(lang.hitch(this, function(){
          this._setIconAndLink(this.currentToolSetting);
          this.toolCountInList = 1;

          if(this.currentToolSetting.analysisLayer){
            this._switchToLayerChooser();
          }else{
            this._switchToAnalysisTool();
          }
        }));
      },

      _initToolList: function(){
        domStyle.set(this.homeBtn,'display','');
        this.toolCountInList = 0;
        var lastToolConfig = null;
        return layerUtil.getLayerObjects(this.map).then(lang.hitch(this, function(layerObjects){
          array.forEach(this.config.analysisTools, lang.hitch(this, function(item,idx){
            var toolSetting = toolSettings.findToolSetting(item.name);
            if(toolSetting !== null){
              //check extra privileges
              var hasPrivileges = privilegeUtil.hasPrivileges(toolSetting.privileges);

              if(hasPrivileges){
                //validate tool, check whether there are feature layer(s)
                //required to run this tool
                var isValid = toolValidate.isValidateTool(layerObjects,toolSetting);
                this._addTool(toolSetting,idx,isValid);
                this.toolCountInList += 1;
                lastToolConfig = toolSetting;
              }
            }
          }));
          if(this.toolCountInList === 0){
            this._noPrivilegeHandler(this.errorMessage);
          }else if(this.toolCountInList === 1){
            this._setIconAndLink(lastToolConfig);

            if(lastToolConfig.analysisLayer){
              this._switchToLayerChooser();
            }else{
              this._switchToAnalysisTool();
            }
          }
        }), lang.hitch(this,function(){
          console.error('layerUtil: getLayerObjects error');
        }));
      },

      destroy: function(){
        this._clearContent();
        this.inherited(arguments);
      },

      _addTool: function(rowData, idx, isValid){
        var tr = domConstruct.create("tr", {'class':'tools-table-tr'}, this.toolsTbody);
        if(idx%2===0){
          domClass.add(tr,'even');
        }else{
          domClass.add(tr, 'odd');
        }
        tr.rowData = rowData;

        //create name
        var iconTd = domConstruct.create("td",{'class':'icon-td'},tr);
        domConstruct.create('div', {
          'class': 'tool-name',
          innerHTML: this.nls[rowData.title]
        }, iconTd);
        //create img
        var iconDiv = domConstruct.create('div', {'class': 'icon-div'}, iconTd);
        domConstruct.create('img', {
          src: this.folderUrl + rowData.imgDisplay,
          'class': 'tool-icon'
        }, iconDiv);

        //create tooltip
        var tooltipTd = domConstruct.create('td',{
          'class':'tooltip-td esriAnalysis'
        },tr);
        var tooltipLink = domConstruct.create('a',{
          href:'#',
          esriHelpTopic:'toolDescription'
        },tooltipTd);
        domConstruct.create('img',{
          src: this.folderUrl + 'images/helpIcon.png',
          title: this.nls[rowData.title],
          'class': 'tooltip-icon'
        }, tooltipLink);

        //bind event
        var index = rowData.dijitID.lastIndexOf('\/');
        var helpFileName = rowData.dijitID.substring(index+1);
        AnalysisUtils.initHelpLinks(tr,true,{
          helpFileName:helpFileName
        });

        if(isValid === true){
          domAttr.set(tr, 'title', '');
          this.own(on(tr, 'click', lang.hitch(this,function(evt){
            Event.stop(evt);
            this._setIconAndLink(rowData);
            if(!rowData.analysisLayer){//no required param setting, go to analysis dijit
              this.currentToolSetting = rowData;
              this.inputLayer = null;
              this._switchToAnalysisTool();
            }else{
              if(this.currentToolSetting && this.currentToolSetting.dijitID === rowData.dijitID){
                this._switchView(1);//go to previous setting
              }else{
                //create new setting page
                console.debug('tool setting: ' + rowData.dijitID);
                this.currentToolSetting = rowData;
                this._switchToLayerChooser();
              }
            }
          })));
        }else{
          domAttr.set(tr, 'title', this.nls.toolNotAvailable);
          domClass.remove(tr,'even');
          domClass.remove(tr,'odd');
          domClass.add(tr, 'disabled');
        }
      },

      _setIconAndLink: function(rowData){
        domAttr.set(this.smallIcon,'src',this.folderUrl+rowData.icon);
        domAttr.set(this.toolTitle,'innerHTML',this.nls[rowData.title]);
        domAttr.set(this.toolInputTip,'innerHTML',settingBundle[rowData.inputlayerTip]);
        domAttr.set(this.smallIcon_1,'src',this.folderUrl+rowData.icon);
        domAttr.set(this.toolTitle_1,'innerHTML',this.nls[rowData.title]);

        //change help icon link
        var idx = rowData.dijitID.lastIndexOf('\/');
        var helpFileName = rowData.dijitID.substring(idx+1);

        if(this.helpLink){
          domConstruct.destroy(this.helpLink);
        }
        this.helpLink = domConstruct.create('a',{
          href:'#',
          esriHelpTopic: 'toolDescription'
        },this.inputHeader);
        domConstruct.create('img',{
          height:16,
          width:16,
          'class':'help-icon jimu-float-trailing',
          src:this.folderUrl + 'images/helpIcon.png'
        },this.helpLink);

        AnalysisUtils.initHelpLinks(this.inputHeader,true,{
          helpFileName: helpFileName
        });

        if(this.helpLink_1){
          domConstruct.destroy(this.helpLink_1);
        }
        this.helpLink_1 = domConstruct.create('a',{
          href:'#',
          esriHelpTopic: 'toolDescription'
        },this.inputHeader_1);
        domConstruct.create('img',{
          height:16,
          width:16,
          'class':'help-icon jimu-float-trailing',
          src:this.folderUrl + 'images/helpIcon.png'
        },this.helpLink_1);

        AnalysisUtils.initHelpLinks(this.inputHeader_1,true,{
          helpFileName: helpFileName
        });
      },

      _switchToLayerChooser: function(){
        domConstruct.empty(this.layerNodeSection);
        //create layer chooser
        if(this.inputLayerSelect){
          this.inputLayerSelect.destroy();
          this.inputLayer = null;
        }

        var args = this._createLayerChooserArgs(this.currentToolSetting.analysisLayer, false);

        this.inputLayerSelect = new LayerChooserFromMap2(args);
        this.inputLayerSelect.placeAt(this.layerNodeSection);
        this.own(on(this.inputLayerSelect, 'selection-change',
            lang.hitch(this, this._onInputLayerChange)));

        this.own(on(document.body,'click',
            lang.hitch(this,function(event){
          var target = event.target || event.srcElement;
          var node = this.inputLayerSelect.domNode;
          var isInternal = target === node || html.isDescendant(target, node);
          if(!isInternal){
            this.inputLayerSelect.hideChooseNode();
          }
        })));

        //create button
        if(this.nextButton){
          domConstruct.destroy(this.nextButton);
          this.nextButton = null;
        }
        domConstruct.empty(this.buttonSection0);
        this.nextButton = domConstruct.create('div',{
          'class': 'jimu-btn jimu-state-disabled',
          innerHTML: this.nls.next
        });
        domConstruct.place(this.nextButton, this.buttonSection0);
        this.own(on(this.nextButton, 'click',
            lang.hitch(this, this._switchToNext)));

        if(this.toolCountInList > 1){
          var previousBtn = domConstruct.create('div',{
            'class': 'jimu-btn',
            innerHTML: this.nls.back
          });
          this.own(on(previousBtn, 'click', lang.hitch(this, this._switchToPrevious)));
          domConstruct.place(previousBtn, this.buttonSection0, 'first');
        }

        this._switchView(1);
      },

      _createLayerChooserArgs: function(param, isArray){
        var geometryTypes;
        if(param.geomTypes[0]==='*'){
          geometryTypes = ['esriGeometryPoint','esriGeometryMultipoint',
          'esriGeometryPolyline','esriGeometryPolygon'];
        }else{
          geometryTypes = param.geomTypes;
        }
        var args = {
          multiple: isArray,
          createMapResponse: this.map.webMapResponse,
          showLayerTypes: ['FeatureLayer'],
          geometryTypes: geometryTypes
        };
        return args;
      },

      _onInputLayerChange: function(layers){
        this.inputLayer = layers[0];
        if(this._checkInputParam()){
          domClass.remove(this.nextButton,'jimu-state-disabled');
        }else{
          domClass.add(this.nextButton,'jimu-state-disabled');
        }
      },

      _checkInputParam: function(){
        return this.inputLayerSelect && this.inputLayer;
      },

      _switchToAnalysisTool: function(){
        domStyle.set(this.toolLoadErrorNode,'display','none');

        this.shelter.show();
        require([this.currentToolSetting.dijitID],lang.hitch(this,function(AnalysisDijit){
          if(this.currentAnalysisDijit){
            this.currentAnalysisDijit.destroy();
            this.currentAnalysisDijit = null;
          }
          var args = {
            map: this.map,
            //analysisGpServer: analysisGpServer,
            showChooseExtent:true,
            showSelectFolder:true,
            portalUrl: this._getPortalUrl(privilegeUtil.getUserPortal())
          };
          //set analysis param
          if(this.currentToolSetting.analysisLayer){
            args[this.currentToolSetting.analysisLayer.name] = this.inputLayer;
          }
          //set required and optional param
          this._prepareLayerParams().then(lang.hitch(this,function(optionalArgs){
            lang.mixin(args,optionalArgs);
            try{
              //TODO: fix it, if don't set primaryActionButttonClass,
              //DeriveNewLocations, FindExistingLocations, FindSimilarLocations fails to build ui
              if(this.currentToolSetting.dijitID.indexOf('DeriveNewLocations') !== -1 ||
                this.currentToolSetting.dijitID.indexOf('FindExistingLocations') !== -1 ||
                this.currentToolSetting.dijitID.indexOf('FindSimilarLocations') !== -1){
                args.primaryActionButttonClass = "esriAnalysisSubmitButton";
              }
              this.currentAnalysisDijit = new AnalysisDijit(args);
              this._bindAnalysisEvents(this.currentAnalysisDijit);

              domConstruct.place(this.currentAnalysisDijit.domNode,this.toolPanel,'first');
              this.currentDijitID = this.currentToolSetting.dijitID;

              var submitButton;
              if(this.toolCountInList > 1 || this.currentToolSetting.analysisLayer){
                submitButton = query('.esriAnalysis .esriAnalysisSubmitButton',
                    this.toolPanel)[0];
                if(typeof submitButton !== 'undefined'){
                  domClass.add(submitButton, 'multiTool');
                  var btnDiv = domConstruct.create('div',{
                    'class':'toolpanel-button'
                  });
                  //create back button
                  var backBtn = domConstruct.create('div',{
                    'class':'jimu-btn',
                    innerHTML: this.nls.back
                  }, btnDiv);
                  domConstruct.place(btnDiv, submitButton, 'before');
                  domConstruct.place(submitButton, btnDiv);
                  this.currentAnalysisDijit.own(on(backBtn,'click',
                      lang.hitch(this,this._switchToPrevious)));
                }
              }
            }catch(err){
              console.error(err);
              domAttr.set(this.toolLoadErrorNode,'innerHTML',err);
              domStyle.set(this.toolLoadErrorNode,'display','');
            }

            this.shelter.hide();
          }));
        }),lang.hitch(this,function(err){
          domAttr.set(this.toolLoadErrorNode,'innerHTML',err);
          domStyle.set(this.toolLoadErrorNode,'display','');
          this.shelter.hide();
        }));

        this._switchView(2);
      },

      _prepareLayerParams: function(){
        var def = new Deferred();
        var optionalArgs = {};
        if('optionalParams' in this.currentToolSetting ||
            'requiredParam' in this.currentToolSetting){
          this._getLayerObjects().then(lang.hitch(this,function(layerObjects){
            var matchedLayers;
            if('requiredParam' in this.currentToolSetting){
              matchedLayers = this._prepareLayers(layerObjects,
                    this.currentToolSetting.requiredParam.geomTypes);
              if(this.currentToolSetting.requiredParam.isArray){
                optionalArgs[this.currentToolSetting.requiredParam.name] = matchedLayers;
              }else{
                optionalArgs[this.currentToolSetting.requiredParam.name] =
                  matchedLayers.length>0?matchedLayers[0]:null;
              }
            }
            if('optionalParams' in this.currentToolSetting){
              array.forEach(this.currentToolSetting.optionalParams, function(param){
                matchedLayers = this._prepareLayers(layerObjects,param.geomTypes);
                if(param.isArray){
                  optionalArgs[param.name] = matchedLayers;
                }else{
                  optionalArgs[param.name] = matchedLayers.length>0?matchedLayers[0]:null;
                }
              },this);
            }

            def.resolve(optionalArgs);
          }));
        }else{
          def.resolve(optionalArgs);
        }
        return def;
      },

      _prepareLayers: function(layerObjects, geomTypes){
        var geometryTypes;
        if(geomTypes[0]==='*'){
          geometryTypes = ['esriGeometryPoint', 'esriGeometryMultipoint',
          'esriGeometryPolyline','esriGeometryPolygon'];
        }else{
          geometryTypes = geomTypes;
        }

        var matchedLayers = [];
        array.forEach(layerObjects,function(layer){
          if (layer.declaredClass === "esri.layers.FeatureLayer"){
            if(geometryTypes.indexOf(layer.geometryType) > -1){
              matchedLayers.push(layer);
            }
          }
        },this);

        return matchedLayers;
      },

      _getLayerObjects: function(){
        var retDef = new Deferred();

        LayerInfos.getInstance(this.map,this.map.itemInfo).then(lang.hitch(this,function(
              layerInfosObject){
          var layerInfos = [];
          layerInfosObject.traversal(function(layerInfo){
            layerInfos.push(layerInfo);
            return false;
          });

          var defs = array.map(layerInfos, function(layerInfo){
            return layerInfo.getLayerObject();
          });
          all(defs).then(lang.hitch(this,function(layerObjects){
            var resultArray = [];
            array.forEach(layerObjects, function(layerObject){
              if(layerObject){
                resultArray.push(layerObject);
              }
            });
            retDef.resolve(resultArray);
          }),function(err){
            /*jshint unused: false*/
            retDef.resolve([]);
          });
        }));

        return retDef;
      },

      _deactiveDrawTool:function(){
        if(!this.currentAnalysisDijit){
          return;
        }
        if(this.currentToolSetting.title === 'findHotSpots' ||
            this.currentToolSetting.title === 'calculateDensity' ||
            this.currentToolSetting.title === 'traceDownstream' ||
            this.currentToolSetting.title === 'interpolatePoints' ||
            this.currentToolSetting.title === 'findSimilarLocations'){
          this.currentAnalysisDijit.clear();
        }else if(this.currentToolSetting.title === 'planRoutes' ||
            this.currentToolSetting.title === 'extractData'){
          this.currentAnalysisDijit.clear();
          this.map.setInfoWindowOnClick(true);
        }
      },

      _bindAnalysisEvents: function(analysisDijit){
        this.own(on(analysisDijit,'start',
            lang.hitch(this, this._onJobStart)));
        this.own(on(analysisDijit,'job-submit',
            lang.hitch(this, this._onJobSubmitted)));
        this.own(on(analysisDijit,'job-cancel',
            lang.hitch(this, this._onJobCancelled)));
        this.own(on(analysisDijit,'job-fail',
            lang.hitch(this, this._onJobFailed)));
        this.own(on(analysisDijit,'job-success',
            lang.hitch(this, this._onJobSucceed)));
        this.own(on(analysisDijit,'job-status',
            lang.hitch(this, this._onJobStatusChange)));
        this.own(on(analysisDijit,'job-result',
            lang.hitch(this, this._onJobResultData)));
        this.own(on(analysisDijit, 'drawtool-activate',lang.hitch(this, function(){
          this.map.setInfoWindowOnClick(false);
        })));
        this.own(on(analysisDijit, 'drawtool-deactivate',lang.hitch(this, function(){
          this.map.setInfoWindowOnClick(true);
        })));
      },

      _onJobStart: function(){
        this._clearMessageLogs();
        this.shelter.show();
        this._switchView(3);
      },

      _onJobSubmitted: function(res){
        /*{
          params: <Object>
        }*/
        this.shelter.hide();
        this.outputProperties = null;
        if(res.OutputName){
          this.outputProperties = JSON.parse(res.OutputName,true);
        }

        this._appendMessage(this.nls[this.currentToolSetting.title] + ' ' +
            this.nls.jobSubmitted);
        //add loading icon, wait for next message
        var node = domConstruct.create('div',{
          'class': 'job-message waiting'
        },this.messageSection);
        domConstruct.create('img',{
          'class':'job-running-icon',
          src: this.folderUrl+'images/loading.gif'
        },node);
      },

      _onJobCancelled: function(res){
        /*{
          "inputs": {},
          "jobId": <job id>,
          "jobStatus": <job status>,
          "messages": <an array of message text>,
          "results": {}
        }*/
        if(res.jobStatus){
          this._appendMessage(this.nls.jobCancelled + ': ' + res.jobStatus, 'cancelled');
        }else{
          this._appendMessage(this.nls.jobCancelled, 'cancelled');
        }

        this._onJobDone();
        //show button area
        domStyle.set(this.buttonSection,'display','');
      },

      _onJobFailed: function(res){
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
        if(this.currentStack !== 3){
          this._clearMessageLogs();
          this._switchView(3);
        }
        this._appendMessage(this.nls.jobFailed + ': ' +
          (res.analysisReport || res.message), 'failed');
        this._onJobDone();
        //show button area
        domStyle.set(this.buttonSection,'display','');
      },

      _onJobSucceed: function(res){
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
        this._appendMessage(this.nls.jobSuccess,'success');
        this._onJobDone();

        if(this.currentToolSetting.dijitID.indexOf('ExtractData') >= 0){
          domStyle.set(this.resultSection, 'display', '');
          domAttr.set(this.outputtip,'innerHTML', this.nls.outputSaveInPortal);
        }
        domStyle.set(this.buttonSection,'display','');
        domStyle.set(this.resultLoading,'display','');
      },

      _onJobDone: function(){
        //remove running and cancel images
        query('img.job-executing',this.messagePanel).forEach(function(node){
          domConstruct.destroy(node);
        });
      },

      _onJobStatusChange: function(res){
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
        if(res.jobId && res.jobId !== this.currentToolJobId){
          this.currentToolJobId = res.jobId;
        }

        if(res.jobStatus === JobInfo.STATUS_EXECUTING){
          this._appendExecutingMessage();
        }else{
          switch(res.jobStatus){
          case JobInfo.STATUS_FAILED:
          case JobInfo.STATUS_CANCELLED:
          case JobInfo.STATUS_DELETED:
          case JobInfo.STATUS_TIMED_OUT:
            this.shelter.hide();
            if(typeof res.message === 'string'){
              this._appendMessage(res.message,'failed');
            }
            this._onJobDone();
            domStyle.set(this.buttonSection,'display','');
            break;
          case JobInfo.STATUS_SUCCEEDED:
            if(typeof res.message === 'string'){
              this._appendMessage(res.message);
            }
            this._onJobDone();
            domStyle.set(this.buttonSection,'display','');
            break;
          }
        }
      },

      _onJobResultData: function(res){
        /*
          result: {
            "analysisReport": <analysis report message>,
            "dataType": <analysis report message>,
            "paramName": < parameter  name >,
            "value": <output item info | feature collection>
          }
        */
        domStyle.set(this.resultLoading,'display','none');
        domAttr.set(this.outputtip,'innerHTML', this.nls.outputtip);
        domStyle.set(this.resultSection, 'display', '');
        domStyle.set(this.buttonSection,'display','');
        var outputLayerName = this._appendResultMessage(res);
        console.debug('outputLayerName: ' + outputLayerName);
        if(this.currentToolSetting.dijitID.indexOf('ExtractData') < 0){
          var popupTemplate;
          if(res.value.itemId){
            var popupInfo = null;
            if('layerInfo' in res.value){
              popupInfo = res.value.layerInfo.popupInfo;
            }
            this._fetchResultByItemId(outputLayerName, res.value.itemId, popupInfo);
          }else if('layerDefinition' in res.value){// feature set
            popupTemplate = new PopupTemplate();
            var featureLayer = new FeatureLayer(res.value,{
              infoTemplate: popupTemplate,
              name: outputLayerName!==null?outputLayerName:'output'
            });
            this.map.addLayer(featureLayer);
          }
        }
      },

      _fetchResultByItemId:function(outputLayerName, itemId, popupInfo){
        var portal = portalUtils.getPortal(
            this._getPortalUrl(privilegeUtil.getUserPortal()));
        portal.getItemById(itemId).then(lang.hitch(this,function(portalItem){
          var baseUrl = portalItem.url;
          esriRequest({
            url: baseUrl,
            content: {f:'json'},
            handleAs: 'json'
          }).then(lang.hitch(this,function(serviceMeta){
            var tables = serviceMeta.tables || [];
            var layers = serviceMeta.layers || [];
            tables.reverse();
            layers.reverse();
            array.forEach(tables, function(table){
              var tableUrl = baseUrl + '\/' + table.id;
              var tableLyr = new FeatureLayer(tableUrl,{
                outFields:["*"]
              });
              tableLyr.title = outputLayerName + ' - ' + table.name;
              this.map.addLayer(tableLyr);
            }, this);
            array.forEach(layers, function(layer){
              var layerUrl = baseUrl + '\/' + layer.id;
              var popupLocal = null;
              if(layers.length === 1){
                popupLocal = popupInfo;
              }
              this._buildFeatureLayer(layer.name,layerUrl,popupLocal,
                  itemId).then(lang.hitch(this,function(featureLayer){
                this.map.addLayer(featureLayer);
              }));
            }, this);

            if(serviceMeta.initialExtent){
              this.map.setExtent(new Extent(serviceMeta.initialExtent));
            }
          }));
        }));
      },

      _buildFeatureLayer:function(layerName, url, popupInfo, itemId){
        if(popupInfo !== null){
          var ret = new Deferred();
          popupInfo.title = layerName;
          var featureLayer = new FeatureLayer(url,{
            mode: FeatureLayer.MODE_SNAPSHOT,
            infoTemplate: new PopupTemplate(popupInfo),
            outFields:["*"]
          });
          featureLayer._itemId = itemId;
          ret.resolve(featureLayer);
          return ret;
        }else{
          return esriRequest({
            url: url,
            content: {f:'json'},
            handleAs: 'json'
          }).then(lang.hitch(this,function(layerDefinition){
            var popupInfoLocal = {
              title: layerName,
              fieldInfos:[]
            };
            array.forEach(layerDefinition.fields, function(field){
              if(field.name !== layerDefinition.objectIdField){
                popupInfoLocal.fieldInfos.push({
                  fieldName:field.name,
                  visible:true,
                  label:field.alias,
                  isEditable:false
                });
              }
            });

            var featureLayer = new FeatureLayer(url,{
              mode: FeatureLayer.MODE_SNAPSHOT,
              infoTemplate: new PopupTemplate(popupInfoLocal),
              outFields:["*"]
            });
            featureLayer._itemId = itemId;
            return featureLayer;
          }),lang.hitch(this,function(){//on Error
            var featureLayer = new FeatureLayer(url);
            featureLayer._itemId = itemId;
            return featureLayer;
          }));
        }
      },

      _clearMessageLogs:function(){
        domConstruct.empty(this.messageSection);
        domConstruct.empty(this.outputSection);
        domStyle.set(this.resultSection, 'display', 'none');
        domStyle.set(this.buttonSection,'display','none');
      },

      _appendMessage:function(msg, type){
        domConstruct.create('div',{
          'class':'job-message '+ (type ? type : ''),
          innerHTML: msg
        },this.messageSection);
      },

      _appendExecutingMessage: function(){
        query('div.waiting', this.messagePanel).forEach(function(node){
          domConstruct.destroy(node);
        });
        var nodeList = query('div.job-executing',this.messagePanel);
        if(nodeList.length === 0){
          var node = domConstruct.create('div',{
            'class': 'job-message job-executing'
          },this.messageSection);
          domConstruct.create('span',{
            innerHTML: this.nls.executing
          },node);
          domConstruct.create('img',{
            'class':'job-running-icon job-executing',
            src: this.folderUrl+'images/loading.gif'
          },node);
          //create cancel button
          var cannotCancel = false;
          if(this.currentToolSetting.cannotCancel === true){
            cannotCancel = true;
          }else if(this.currentToolSetting.dijitID.indexOf('EnrichLayer')>=0){
            //Enrich layer with Drive Time Options also cannot be cancelled
            if(this.currentAnalysisDijit && this.currentAnalysisDijit.enableTravelModes){
              cannotCancel = true;
            }
          }
          if(!cannotCancel){
            var closeImg = domConstruct.create('img',{
              'class':'job-cancel-icon job-executing',
              src: this.folderUrl+'images/cancel.png',
              title: this.nls.cancelJob
            },node);

            this.own(on(closeImg,'click',lang.hitch(this,this._cancelTask)));
          }
        }
      },

      _appendResultMessage: function(res){
        if(res.paramName){
          var label = res.paramName;

          var node = domConstruct.create('div',{
            'class': 'output-item'
          },this.outputSection);

          if(res.value && res.value.itemId){
            var itemUrl = portalUrlUtils.getItemDetailsPageUrl(
                this._getPortalUrl(privilegeUtil.getUserPortal()), res.value.itemId);
            if(typeof this.outputProperties === 'object'){
              if(res.value.itemId === this.outputProperties.itemProperties.itemId){
                label = this.outputProperties.serviceProperties.name;
              }
            }

            domConstruct.create('a',{
              href: itemUrl,
              target: '_blank',
              innerHTML: label
            },node);
          }else{
            domAttr.set(node,'innerHTML',res.paramName);
          }
          return label;
        }else{
          return null;
        }
      },

      _getPortalUrl: function(url){
        if(url){
          return portalUrlUtils.getStandardPortalUrl(url);
        }else{
          return portalUrlUtils.getStandardPortalUrl(this.appConfig.portalUrl);
        }
      },

      _cancelTask: function(){
        if(this.currentToolJobId && this.currentAnalysisDijit){
          var jobInfo = {
            jobId: this.currentToolJobId
          };
          this.currentAnalysisDijit.cancel(jobInfo);
        }
      },

      _switchToPrevious:function(){
        if(this.currentStack===2 || this.currentStack===3){
          if(this.currentStack===2){
            this._deactiveDrawTool();
          }
          if(this.currentToolSetting.analysisLayer){
            this._switchToLayerChooser();
          }else{
            if(this.toolCountInList === 1){
              this._switchToAnalysisTool();
            }else{
              this._switchView(0);
            }
          }
        }else{
          this._switchView(0);
        }
      },

      _switchToNext:function(){
        if(html.hasClass(this.nextButton, 'jimu-state-disabled')){
          return;
        }
        this._switchToAnalysisTool();
      },

      _switchToHome:function(){
        if(this.toolCountInList > 1){
          this._switchView(0);
        }else{
          if(this.currentToolSetting.analysisLayer){
            this._switchToLayerChooser();
          }else{
            this._switchToAnalysisTool();
          }
        }
      },

      _switchView: function(idx){
        if(idx === 0){
          //perform validation check
          this._checkValidation();
        }
        this.currentStack = idx;
        this.viewStack.switchView(idx);
      }
    });
  });
