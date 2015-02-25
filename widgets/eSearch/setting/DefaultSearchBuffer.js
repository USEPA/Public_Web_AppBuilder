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
/*global define, dojo, dijit, require, esri, console, setTimeout*/
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/on',
  'dojo/json',
  'jimu/dijit/SymbolPicker',
  'jimu/dijit/TabContainer',
  'esri/symbols/jsonUtils',
  'esri/symbols/SimpleFillSymbol',
  './BufferUnitEdit',
  'jimu/dijit/Message',
  'jimu/dijit/Popup',
  'dojo/keys',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./DefaultSearchBuffer.html'
],
function(declare, lang, html, array, on, json, SymbolPicker, TabContainer, jsonUtils, SimpleFillSymbol, BufferUnitEdit, Message, Popup, keys,
          _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  template) {/*jshint unused: false*/
  return declare([_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-defaultbuffer-setting',
    templateString:template,
    nls:null,
    config:null,
    _isAddNow:true,
    searchSetting:null,
    _bufferDefaults:null,
    popupunitedit: null,
    popup: null,
    popupState: "", // ADD or EDIT

    postCreate:function(){
      this.inherited(arguments);
      this.own(on(this.layerSymbolPicker,'change',lang.hitch(this,this._onPolySymbolChange)));
      this._bindEvents();
      this.setConfig(this.config);
      this._isAddNow = this.config ? false : true;
      this.updateStatus(this._isAddNow);
    },

    setConfig:function(config){
      this.config = config;
      if(!this.config){
        return;
      }
      this._bufferDefaults = this.config.bufferDefaults;
      this.defaultBufferValue.set('value',this._bufferDefaults.bufferDefaultValue || 2);
      this.defaultBufferWKID.set('value',this._bufferDefaults.bufferWKID || 102003);
      if(this._bufferDefaults.simplefillsymbol){
        this.layerSymbolPicker.showBySymbol(jsonUtils.fromJson(this._bufferDefaults.simplefillsymbol));
      }else{
        this.layerSymbolPicker.showByType("fill");
      }
      this._initBufferUnitTable();
    },

    getConfig:function(){
      this._bufferDefaults.bufferDefaultValue = parseFloat(this.defaultBufferValue.get('value'));
      this._bufferDefaults.bufferWKID = parseInt(this.defaultBufferWKID.get('value'));
      var config = {
        bufferDefaults:this._bufferDefaults
      };
      
      this.config = config;
      return this.config;
    },
    
    _onPolySymbolChange:function(newSymbol){
      if(newSymbol.type == "simplefillsymbol"){
        this._bufferDefaults.simplefillsymbol = newSymbol.toJson();
      }
    },
    
    _initBufferUnitTable:function(){
      this.bufferUnitsTable.clear();
      var bUnits = this.config && this.config.bufferDefaults && this.config.bufferDefaults.bufferUnits.bufferUnit;
      array.forEach(bUnits, lang.hitch(this, function(bufferunit) {
        var args = {
          config:bufferunit
        };
        this._createBufferUnit(args);
      }));
    },
    
    _createBufferUnit:function(args){
      args.searchSetting = this;
      args.nls = this.nls;
      var rowData = {
        name: (args.config && args.config.label)||''
      };
      var result = this.bufferUnitsTable.addRow(rowData);
      if(!result.success){
        return null;
      }
      result.tr.bufferUnit = args.config;
      return result.tr;
    },

    updateStatus:function(isAddNow){
      this._isAddNow = !!isAddNow;
      if(this._isAddNow){
        html.setStyle(this.btnAdd,'display','block');
        html.setStyle(this.btnUpdate,'display','none');
      }
      else{
        html.setStyle(this.btnUpdate,'display','block');
        html.setStyle(this.btnAdd,'display','none');
      }
    },
    
    _getAllBufferUnits:function(){
      var trs = this.bufferUnitsTable._getNotEmptyRows();
      var allBufferUnits = array.map(trs,lang.hitch(this,function(item){
        return item.singleSearch;
      }));
      return allBufferUnits;
    },

    onAdd:function(config){/*jshint unused: false*/},

    onUpdate:function(config){/*jshint unused: false*/},

    onAddCancel:function(){},

    onUpdateCancel:function(){},
    
    _onEditOk: function() {
      var bufferUnits = this.popupunitedit.getConfig();

      if (bufferUnits.length < 0) {
        new Message({
          message: this.nls.warning
        });
        return;
      }
      this.config.bufferDefaults.bufferUnits.bufferUnit = bufferUnits;
      this._initBufferUnitTable();

      this.popup.close();
      this.popupState = "";
    },

    _onEditClose: function() {
      this.popupunitedit = null;
      this.popup = null;
    },
    
    _openEdit: function(title, bufferDefaults) {
        this.popupunitedit = new BufferUnitEdit({
          nls: this.nls,
          config: bufferDefaults || {}
        });

        this.popup = new Popup({
          titleLabel: title,
          autoHeight: true,
          content: this.popupunitedit,
          container: 'main-page',
          width: 640,
          height: 420,
          buttons: [{
            label: this.nls.ok,
            key: keys.ENTER,
            onClick: lang.hitch(this, '_onEditOk')
          }, {
            label: this.nls.cancel,
            key: keys.ESCAPE
          }],
          onClose: lang.hitch(this, '_onEditClose')
        });
        html.addClass(this.popup.domNode, 'widget-setting-popup');
        this.popupunitedit.startup();
      },

    _bindEvents:function(){
      this.own(on(this.btnAddBufferUnit,'click',lang.hitch(this,function(){
        this.popupState = "ADD";
        this._openEdit(this.nls.addbufferunit, this._bufferDefaults);
      })));
      this.own(on(this.btnAdd,'click',lang.hitch(this,function(){
        var config = this.getConfig();
        if(config){
          this.setConfig(config);
          this.updateStatus(false);
          this.onAdd(config);
        }
      })));
      this.own(on(this.btnUpdate,'click',lang.hitch(this,function(){
        var config = this.getConfig();
        if(config){
          this.updateStatus(false);
          this.onUpdate(config);
        }
      })));
      this.own(on(this.btnCancel,'click',lang.hitch(this,function(){
        if(this._isAddNow){
          this.onAddCancel();
        }
        else{
          this.setConfig(this.config);
          this.onUpdateCancel();
        }
      })));
      this.own(on(this.bufferUnitsTable,'row-delete',lang.hitch(this,function(tr){
        delete tr.bufferUnit;
      })));
      this.own(on(this.bufferUnitsTable,'rows-clear',lang.hitch(this,function(trs){
        array.forEach(trs,lang.hitch(this,function(tr){
          delete tr.bufferUnit;
        }));
      })));
    }
  });
});