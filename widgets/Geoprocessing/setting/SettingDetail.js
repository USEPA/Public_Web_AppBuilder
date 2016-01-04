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
  'dojo/on',
  'dojo/query',
  'dojo/text!./SettingDetail.html',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/TitlePane',
  'jimu/dijit/ViewStack',
  'jimu/dijit/LoadingShelter',
  'jimu/dijit/Message',
  './ParamSetting',
  './ParamNodeList',
  './LayerOrder',
  './Options',
  '../utils'
],
function(declare, lang, html, array, on, query, template, _WidgetBase, _TemplatedMixin,
  TitlePane, ViewStack, LoadingShelter, Message, ParamSetting, ParamNodeList, LayerOrder,
  Options, gputils) {
  return declare([_WidgetBase, _TemplatedMixin], {
    baseClass: 'jimu-widget-setting-gp-detail',
    templateString: template,

    postCreate: function(){
      this.inherited(arguments);

      this.paramSetting = new ParamSetting({
        map: this.map,
        nls: this.nls
      });
      this.layerOrder = new LayerOrder({nls: this.nls});
      this.options = new Options({nls: this.nls});

      this.viewStack = new ViewStack({
        viewType: 'dijit',
        views: [this.paramSetting, this.layerOrder, this.options]
      }, this.settingPaneNode);

      this.loadingCover = new LoadingShelter({hidden: true});
      this.loadingCover.placeAt(this.domNode);
      this.loadingCover.startup();
    },

    startup: function(){
      this.inherited(arguments);
      this.viewStack.startup();
    },

    setConfig: function(_config){
      var config = lang.clone(_config);
      this.hasInputParam = true;
      if(this.config && this.config.taskUrl === config.taskUrl){
        this.config = config;
        if(!('serverInfo' in config)){
          this.loadingCover.show();
          //Load gp server info if it does not exist.
          gputils.getServiceDescription(this.config.taskUrl).then(lang.hitch(this,
            function(taskInfo){
              this.loadingCover.hide();
              this.config.serverInfo = taskInfo.serverInfo;
              this._initNavPane();
            }));
        }else{
          this._initNavPane();
        }
      }else{
        this.config = config;
        this.loadingCover.show();

        gputils.getServiceDescription(this.config.taskUrl).then(lang.hitch(this, function(taskInfo){
          this.loadingCover.hide();
          this._changeTaskInfoToConfig(taskInfo);
          this._initNavPane();
        }));
      }
    },

    getConfig: function(){
      //paramSetting, layerOrder, options will update this.config directly,
      //so, return it
      if(!this.config.taskUrl){
        new Message({
          message: this.nls.serviceURLPlaceholder
        });
        return false;
      }
      if(this.paramSetting.param){
        this.paramSetting.acceptValue();
      }
      this.layerOrder.acceptValue();
      this.options.acceptValue();

      //override the param order through param table
      this.config.inputParams = this.inputParamNodes.getConfig();
      this.config.outputParams = this.outputParamNodes.getConfig();

      return this.config;
    },

    _changeTaskInfoToConfig: function(taskInfo){
      var taskUrl = this.config.taskUrl;
      this.config = taskInfo;
      this.config.taskUrl = taskUrl;
      ///////
      if(this.config.executionType === 'esriExecutionTypeSynchronous'){
        this.config.isSynchronous = true;
      }else{
        this.config.isSynchronous = false;
      }
      delete this.config.executionType;

      this.config.inputParams = [];
      this.config.outputParams = [];
      array.forEach(taskInfo.parameters, function(param){

        //////////
        param.label = param.displayName;
        delete param.displayName;

        //////
        if(param.direction === 'esriGPParameterDirectionInput'){
          this.config.inputParams.push(param);
        }else{
          this.config.outputParams.push(param);
        }
        delete param.direction;

        ///////
        param.visible = true;

        //////////////
        if(param.parameterType === 'esriGPParameterTypeRequired'){
          param.required = true;
        }else{
          param.required = false;
        }
        delete param.parameterType;

        /////set the default input type
        if(param.dataType === 'GPFeatureRecordSetLayer'){
          param.featureSetMode = 'draw';
        }
      }, this);

      this.config.shareResults = gputils.allowShareResult(this.config);
      delete this.config.parameters;
    },

    _initNavPane: function(){
      html.empty(this.navPaneNode);

      this._createParamsSection('input');
      this._createParamsSection('output');
      this._createLayerOrderNode();
      this._createOptionsNode();

      this.layerOrder.setConfig(this.config);
      this.options.setConfig(this.config);
      this.paramSetting.setConfig(this.config);
    },

    _onParamChange: function(param, direction){
      query('.jimu-state-active', this.domNode).removeClass('jimu-state-active');
      if(direction === 'input'){
        this._clearParamSelection('output');
      }else{
        this._clearParamSelection('input');
      }
      //accept the current input values
      if(this.paramSetting.param){
        this.paramSetting.acceptValue();
      }
      this.layerOrder.acceptValue();
      this.options.acceptValue();

      if(html.getStyle(this.viewStack.domNode, 'display') === 'none'){
        html.setStyle(this.viewStack.domNode, 'display', '');
      }
      this.viewStack.switchView(this.paramSetting);
      this.paramSetting.setParam(param, direction);
    },

    _setActiveLinkNode: function(node){
      query('.jimu-state-active', this.domNode).removeClass('jimu-state-active');
      this._clearParamSelection();
      html.addClass(node, 'jimu-state-active');
    },

    _createParamsSection: function(direction){
      var params = direction === 'input'? this.config.inputParams: this.config.outputParams;

      var paramNodes = new ParamNodeList({
        params: params,
        nls: this.nls,
        direction: direction
      });

      this.own(on(paramNodes, 'select-param', lang.hitch(this, this._onParamChange)));

      if(direction === 'input'){
        this.inputParamNodes = paramNodes;
      }else{
        this.outputParamNodes = paramNodes;
      }

      var titlePane = new TitlePane({
        title: this.nls[direction],
        content: paramNodes.domNode,
        open: this.inputParamNodes.getSize() > 0 ? direction === 'input' : direction === 'output'
      });
      titlePane.placeAt(this.navPaneNode);

      //first input param or first output param
      if(this.inputParamNodes && this.inputParamNodes.getSize() > 0){
        setTimeout(lang.hitch(this, function(){
          this.inputParamNodes.selectDefault();
        }), 100);
      }else if(this.outputParamNodes && this.outputParamNodes.getSize() > 0){
        setTimeout(lang.hitch(this, function(){
          this.outputParamNodes.selectDefault();
        }), 100);
      }
    },

    _createLayerOrderNode: function(){
      var node = html.create('div', {
        'class': 'link-action-node nav-pane-node layer-order-node',
        innerHTML: this.nls.layerOrder
      }, this.navPaneNode);
      this.own(on(node, 'click', lang.hitch(this, function(){
        this.options.acceptValue();
        if(this.paramSetting.param){
          this.paramSetting.acceptValue();
        }
        this._setActiveLinkNode(node);
        this.layerOrder.setConfig(this.config);//update orderable layer table
        this.viewStack.switchView(this.layerOrder);
      })));
    },

    _createOptionsNode: function(){
      var node = html.create('div', {
        'class': 'link-action-node nav-pane-node options-node',
        innerHTML: this.nls.options
      }, this.navPaneNode);
      this.own(on(node, 'click', lang.hitch(this, function(){
        if(this.paramSetting.param){
          this.paramSetting.acceptValue();
        }
        this.layerOrder.acceptValue();
        this._setActiveLinkNode(node);
        this.viewStack.switchView(this.options);
      })));
    },

    _clearParamSelection: function(direction){
      if(direction === 'input' || typeof direction === 'undefined'){
        if(this.inputParamNodes && this.inputParamNodes.getSize() > 0){
          this.inputParamNodes.clearSelection();
        }
      }

      if(direction === 'output' || typeof direction === 'undefined'){
        if(this.outputParamNodes && this.outputParamNodes.getSize() > 0){
          this.outputParamNodes.clearSelection();
        }
      }
    }
  });
});
