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
/**
 * Analysis widget setting content.
 * @module widgets/Analysis/setting/Setting
 */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/event',
    'dojo/query',
    'dojo/on',
    'dojo/fx',
    'dojo/dom',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/dom-construct',
    'dojo/dom-prop',
    'dojo/i18n!esri/nls/jsapi',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/utils',
    'dijit/form/CheckBox',
    '../toolSettings',
    './SingleToolSetting'
  ],
  function(
    declare, array, lang, Event, query, on, coreFx, dom, domClass, domStyle, domConstruct, domProp,
    jsapiBundle, _WidgetsInTemplateMixin, BaseWidgetSetting, utils, CheckBox, toolSettings,
    SingleToolSetting) {
    return /** @alias module:widgets/Analysis/setting/Setting */ declare([
        BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-analysis-setting',

      postMixInProperties: function(){
        this.inherited(arguments);
        lang.mixin(this.nls, jsapiBundle.analysisTools);
      },

      postCreate: function() {
        this.inherited(arguments);

        this.checkboxList = [];
        this._initToolsData();

        if(window.isRTL){
          this.infoString = this.rowsData.length + '/0';
          this.infoRegex = /\d+$/;
        }else{
          this.infoString = '0/' + this.rowsData.length;
          this.infoRegex = /^\d+/;
        }

        array.forEach(this.rowsData, lang.hitch(this, function(row){
          this._addRow(row);
        }));
        domProp.set(this.infoText, 'innerHTML', this.infoString.replace(this.infoRegex, 0));

        if(this.config){
          this.setConfig(this.config);
        }

        this.own(on(document.body, 'click', lang.hitch(this, function(event) {
          var target = event.target || event.srcElement, isInternal;
          query('tr.setting', this.tbody).forEach(function(tr){
            isInternal = (target === tr) || dom.isDescendant(target, tr);
            if(!isInternal) {
              //hide the tool setting
              if(tr.show){
                coreFx.wipeOut({
                  node: tr.toolSetting.domNode
                }).play();
                tr.show = false;
              }
            }
          }, this);
        })));
      },

      /**
       * Add a row to analysis dijit tool table.
       * @param {Object} rowData Config of analysis dijit tool
       */
      _addRow: function(rowData){
        var tr = domConstruct.create("tr", {'class':'tools-table-tr'}, this.tbody);

        tr.rowData = rowData;
        var toolName = toolSettings.getToolName(rowData);
        //create checkbox
        var chkTd = domConstruct.create("td", {'class': 'checkbox-td'}, tr);
        var chkBox = new CheckBox({
          checked: false,
          title: this.nls[rowData.title],
          rid: rowData.id
        });
        chkBox.placeAt(chkTd);
        this.checkboxList.push(chkBox);

        this.own(on(chkBox, 'onChange', lang.hitch(this, function(b){
          if(b){
            domClass.add(tr, 'selected');
          }
        })));

        //create name
        domConstruct.create("td", {
          innerHTML: utils.stripHTML(this.nls[rowData.title]),
          'class':'name-td'
        }, tr);
        //setting icon
        var settingIconTd = domConstruct.create("td", {'class': 'setting-td'}, tr);
        var settingImg = domConstruct.create('img', {
          src: this.folderUrl + 'images/setting.png',
          title: this.nls.toolSetting,
          'class': 'setting-icon'
        }, settingIconTd);
        //create img
        var imgTd = domConstruct.create("td", {'class': 'img-td'}, tr);
        domConstruct.create('img', {src: this.folderUrl + rowData.imgDisplay}, imgTd);
        //create usage
        domConstruct.create("td", {
          innerHTML: utils.stripHTML(this.nls[rowData.usage]),
          'class':'usage-td'},
        tr);

        //create tool setting
        var settingTr = domConstruct.create("tr", {
          'class':'setting',
          title: toolName
        }, this.tbody);
        var settingTd = domConstruct.create("td", {
          colspan: 5
        }, settingTr);
        var toolSetting = new SingleToolSetting({
          toolLabel: this.nls[rowData.title],
          rowData: rowData,
          nls: this.nls,
          appConfig: this.appConfig
        });
        domStyle.set(toolSetting.domNode, 'display', 'none');
        toolSetting.placeAt(settingTd);
        settingTr.toolSetting = toolSetting;
        settingTr.show = false;

        this.own(on(settingImg, 'click', lang.hitch(this, function(evt){
          Event.stop(evt);

          this._toggleToolSetting(settingTr);

          query('tr.setting', this.tbody).forEach(function(targetTr){
            if(targetTr.show && targetTr !== settingTr){
              coreFx.wipeOut({
                node: targetTr.toolSetting.domNode
              }).play();
              targetTr.show = false;
            }
          }, this);
        })));

        this.own(on(tr, 'click', lang.hitch(this, function(evt){
          Event.stop(evt);

          this._toggleSelected(tr);

          query('tr.setting', this.tbody).forEach(function(targetTr){
            if(targetTr.show && targetTr.toolSetting.rowData.id !== tr.rowData.id){
              coreFx.wipeOut({
                node: targetTr.toolSetting.domNode
              }).play();
              targetTr.show = false;
            }
          }, this);
        })));
      },

      _toggleToolSetting: function(tr){
        if(tr.show){
          coreFx.wipeOut({
            node: tr.toolSetting.domNode
          }).play();
          tr.show = false;
        }else{
          coreFx.wipeIn({
            node: tr.toolSetting.domNode
          }).play();
          tr.show = true;
        }
      },

      /**
       * Make all analysis tools selected.
       */
      _checkAll: function(){
        if(this.checkAllBtn.get('checked') === true){
          //select all
          query('tr.tools-table-tr', this.tbody).forEach(function(trDom){
            //Will not re-apply duplicate classes.
            domClass.add(trDom, 'selected');
          });
          array.forEach(this.checkboxList, function(item){
            item.set('checked', true);
          });
          this._updateInfoString();
        }else{
          //unselect all
          query('tr.tools-table-tr', this.tbody).forEach(lang.hitch(this, function(trDom){
            domClass.remove(trDom, 'selected');
          }));
          array.forEach(this.checkboxList, function(item){
            item.set('checked', false);
          });

          domProp.set(this.infoText, 'innerHTML', this.infoString.replace(this.infoRegex, 0));
        }
      },

      /**
       * Toggle selection of a table row.
       * @param  {Object} trDom The dom of a table row.
       */
      _toggleSelected: function(trDom){
        domClass.toggle(trDom, 'selected');
        var chkBox = this.checkboxList[trDom.rowData.id];
        if(chkBox){
          chkBox.set('checked', domClass.contains(trDom, 'selected'));
        }
        this._updateInfoString();
        console.debug(trDom.rowData.name + " toggled");
      },

      /**
       * Update the info string of analysis dijit tools. [selected]/[all]
       */
      _updateInfoString: function(){
        var selectedItems = query('tr.selected', this.tbody).length;
        domProp.set(this.infoText, 'innerHTML',
            this.infoString.replace(this.infoRegex, selectedItems));
        if(selectedItems === this.rowsData.length){
          this.checkAllBtn.set('checked', true);
        }else{
          this.checkAllBtn.set('checked', false);
        }
      },

      /**
       * Set tool state based the param passed in.
       * @param {object} toolConfig Configuration of the analysis dijit tool.
       * @param {bool} selected
       */
      _setSelected: function(toolConfig, selected){
        var rowData = toolSettings.findToolSetting(toolConfig.name);
        if(rowData !== null){
          query('tr.tools-table-tr', this.tbody).some(lang.hitch(this, function(trDom){
            if(trDom.rowData.dijitID === rowData.dijitID){
              var chkBox = this.checkboxList[rowData.id];
              if(chkBox){
                chkBox.set('checked', selected);
              }
              if(selected === true){
                domClass.add(trDom, 'selected');
              }else{
                domClass.remove(trDom, 'selected');
              }

              //set tool setting
              var settingTr = query('tr[title=' + toolConfig.name + ']', this.tbody)[0];
              if(settingTr){
                var toolSetting = settingTr.toolSetting;
                if(toolSetting){
                  toolSetting.setConfig(toolConfig);
                }
              }

              return true;
            }
          }));
        }
      },

      /**
       * Set the configuration of analysis widget.
       * @param {Object} config
       */
      setConfig: function(config) {
        this.config = config;

        array.forEach(this.config.analysisTools, lang.hitch(this, function(item){
          this._setSelected(item, true);
        }));

        this._updateInfoString();
      },

      /**
       * Get the configuration of analysis widget.
       * @return {Object} The selected tool names.
       */
      getConfig: function() {
        var config = {
          analysisTools:[]
        };

        array.forEach(this.checkboxList, lang.hitch(this, function(item){
          if(item.get('checked') === true){
            var rowData = this.rowsData[item.get('rid')];
            var toolName = toolSettings.getToolName(rowData);
            if(toolName !== null){
              var toolItem = {
                name: toolName
              };
              var settingTr = query('tr[title=' + toolName + ']', this.tbody)[0];
              var toolSetting = settingTr.toolSetting;

              if(toolSetting){
                lang.mixin(toolItem, toolSetting.getConfig());
              }

              config.analysisTools.push(toolItem);
            }else{
              console.warn('error find rowsData: ' + item.get('title'));
            }
          }
        }));

        return config;
      },

      /**
       * Init the analysis tool table.
       */
      _initToolsData: function(){
        this.rowsData = toolSettings.getAllSettings();
      }
    });
  });
