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
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/event',
    'dojo/query',
    'dojo/on',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-prop',
    'dojo/i18n!esri/nls/jsapi',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'dijit/form/CheckBox',
    '../toolSettings'
  ],
  function(
    declare, array, lang, Event, query, on, domClass, domConstruct, domProp,
    jsapiBundle, _WidgetsInTemplateMixin, BaseWidgetSetting, CheckBox, toolSettings) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-analysis-setting',

      postMixInProperties: function(){
        this.inherited(arguments);
        lang.mixin(this.nls, jsapiBundle.analysisTools);
      },

      postCreate: function() {
        this.inherited(arguments);

        this.checkboxList=[];
        this._initToolsData();

        this.infoString = "0/" + this.rowsData.length;

        array.forEach(this.rowsData, lang.hitch(this, function(row){
          this._addRow(row);
        }));
        domProp.set(this.infoText, 'innerHTML', this.infoString.replace(/\d+/,0));

        if(this.config){
          this.setConfig(this.config);
        }
      },

      _addRow: function(rowData){
        var tr = domConstruct.create("tr", {'class':'tools-table-tr'}, this.tbody);

        tr.rowData = rowData;
        //create checkbox
        var chkTd = domConstruct.create("td",{'class': 'checkbox-td'},tr);
        var chkBox = new CheckBox({
          checked: false,
          title: this.nls[rowData.title],
          rid: rowData.id
        });
        chkBox.placeAt(chkTd);
        this.checkboxList.push(chkBox);

        this.own(on(chkBox, 'onChange', lang.hitch(this,function(b){
          if(b){
            domClass.add(tr,'selected');
          }
        })));

        //create name
        domConstruct.create("td",{innerHTML: this.nls[rowData.title],'class':'name-td'},tr);
        //create img
        var imgTd = domConstruct.create("td",{'class': 'img-td'},tr);
        domConstruct.create('img', {src: this.folderUrl + rowData.imgDisplay}, imgTd);
        //create usage
        domConstruct.create("td",{innerHTML: this.nls[rowData.usage],'class':'usage-td'},tr);

        this.own(on(tr, 'click', lang.hitch(this,function(evt){
          Event.stop(evt);
          this._toggleSelected(tr);
        })));
      },

      _checkAll: function(){
        if(this.checkAllBtn.get('checked') === true){
          //select all
          query('tr',this.tbody).forEach(function(trDom){
            //Will not re-apply duplicate classes.
            domClass.add(trDom,'selected');
          });
          array.forEach(this.checkboxList,function(item){
            item.set('checked',true);
          });
          this._updateInfoString();
        }else{
          //unselect all
          query('tr',this.tbody).forEach(lang.hitch(this,function(trDom){
            domClass.remove(trDom,'selected');
          }));
          array.forEach(this.checkboxList,function(item){
            item.set('checked',false);
          });
          domProp.set(this.infoText,'innerHTML',this.infoString.replace(/\d+/, 0));
        }
      },

      _toggleSelected: function(trDom){
        domClass.toggle(trDom, 'selected');
        var chkBox = this.checkboxList[trDom.rowData.id];
        if(chkBox){
          chkBox.set('checked',domClass.contains(trDom,'selected'));
        }
        this._updateInfoString();
        console.debug(trDom.rowData.name + " toggled");
      },

      _updateInfoString: function(){
        var selectedItems = query('tr.selected',this.tbody).length;
        domProp.set(this.infoText,'innerHTML',this.infoString.replace(/\d+/, selectedItems));
        if(selectedItems === this.rowsData.length){
          this.checkAllBtn.set('checked',true);
        }else{
          this.checkAllBtn.set('checked',false);
        }
      },

      _setSelected: function(toolName, selected){
        var rowData = toolSettings.findToolSetting(toolName);
        if(rowData !== null){
          query('tr',this.tbody).some(lang.hitch(this,function(trDom){
            if(trDom.rowData.dijitID === rowData.dijitID){
              var chkBox = this.checkboxList[rowData.id];
              if(chkBox){
                chkBox.set('checked',selected);
              }
              if(selected===true){
                domClass.add(trDom,'selected');
              }else{
                domClass.remove(trDom,'selected');
              }
              return true;
            }
          }));
        }
      },

      setConfig: function(config) {
        this.config = config;

        array.forEach(this.config.analysisTools, lang.hitch(this,function(item){
          this._setSelected(item.name,true);
        }));

        this._updateInfoString();
      },

      getConfig: function() {
        var config = {
          analysisTools:[]
        };

        array.forEach(this.checkboxList, lang.hitch(this,function(item){
          if(item.get('checked') === true){
            var rowData = this.rowsData[item.get('rid')];
            var toolName = toolSettings.getToolName(rowData);
            if(toolName !== null){
              var toolItem = {
                name: toolName
              };
              config.analysisTools.push(toolItem);
            }else{
              console.warn('error find rowsData: ' + item.get('title'));
            }
          }
        }));

        return config;
      },

      _initToolsData: function(){
        this.rowsData = toolSettings.getAllSettings();
      }
    });
  });
