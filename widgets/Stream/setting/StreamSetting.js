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
 * @module widgets/Stream/setting/StreamSetting
 */
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/on',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./StreamSetting.html',
  'dojo/dom-class',
  'dojo/dom-style',
  'dojo/Evented',
  'esri/symbols/jsonUtils',
  'jimu/dijit/CheckBox',
  'jimu/dijit/SymbolPicker',
  './FilterConfigPopup',
  '../FilterUtil',
  'jimu/dijit/LoadingShelter'
],
function(declare, lang, on, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template,
  domClass, domStyle, Evented, jsonUtils, CheckBox, SymbolPicker, FilterConfigPopup, FilterUtil) {
  return /** @alias module:widgets/Stream/setting/StreamSetting */ declare([_WidgetBase,
      _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    baseClass: 'jimu-widget-stream-setting',
    templateString: template,
    map: null,
    nls: null,
    layerName: null,
    streamLayer: null,
    _filterList: [],
    _started: false,

    postCreate: function(){
      this.inherited(arguments);

      var drawSymbol = null;
      this._filterList = [];

      this.startStopCheckBox = new CheckBox({
        checked: true,
        label: this.nls.startStopStream
      });
      this.startStopCheckBox.placeAt(this.startStopCheckBoxDiv);

      this.clearPreviousCheckBox = new CheckBox({
        checked: true,
        label: this.nls.clearStream
      });
      this.clearPreviousCheckBox.placeAt(this.clearPreviousCheckBoxDiv);

      this.drawPreviousCheckBox = new CheckBox({
        checked: false,
        label: this.nls.drawPrevious
      });
      this.drawPreviousCheckBox.placeAt(this.drawPreviousCheckBoxDiv);

      if(this.streamLayer){
        if(this.streamLayer.maximumTrackPoints === 1){
          this.drawPreviousCheckBox.setStatus(false);
        }else if(this.streamLayer.maximumTrackPoints > 1){
          this.drawPreviousCheckBox.setValue(true);
        }
      }

      this.spatialFilterCheckBox = new CheckBox({
        checked: true,
        label: this.nls.spatialFilter,
        onChange: lang.hitch(this, this._spatialStatusChange)
      });
      this.spatialFilterCheckBox.placeAt(this.spatialFilterCheckBoxDiv);

      this.mapExtentCheckBox = new CheckBox({
        checked: false,
        label: this.nls.limitMapExtent
      });
      this.mapExtentCheckBox.placeAt(this.mapExtentCheckBoxDiv);

      this.drawExtentCheckBox = new CheckBox({
        checked: false,
        label: this.nls.limitDrawExtent,
        onChange: lang.hitch(this, function(checked){
          if(checked){
            domStyle.set(this.symbolPickerNode, 'display', 'inline');
          }else{
            domStyle.set(this.symbolPickerNode, 'display', 'none');
          }
        })
      });
      domStyle.set(this.drawExtentCheckBox.domNode, 'vertical-align', 'top');
      this.drawExtentCheckBox.placeAt(this.drawExtentCheckBoxDiv);

      if(this.config && this.config.drawSymbol){
        drawSymbol = jsonUtils.fromJson(this.config.drawSymbol);
      }
      this.symbolPicker = new SymbolPicker({
        symbol: drawSymbol,
        type: 'fill'
      });
      domStyle.set(this.symbolPicker.domNode, 'margin-top', '-16px');
      domStyle.set(this.symbolPicker.domNode, 'margin-left', '-20px');
      this.symbolPicker.placeAt(this.symbolPickerNode);
      this.symbolPicker.startup();

      this.filterCheckBox = new CheckBox({
        checked: false,
        label: this.nls.attributeFilter,
        onChange: lang.hitch(this, this._filterStatusChange)
      });
      this.filterCheckBox.placeAt(this.filterCheckBoxDiv);

      if(this.config){
        this.setConfig(this.config);
      }else{
        //First time to open widget configuration, read the filter defined in webmap
        if(this.streamLayer && this.streamLayer.getDefinitionExpression()){
          this.shelter.show();
          FilterUtil.buildFilterInfoFromString(this.streamLayer,
              this.streamLayer.getDefinitionExpression(),
              this.nls.newFilter).then(lang.hitch(this, function(info){
            if(info !== null){
              this._filterList.push(info);
              this.filterCheckBox.setValue(true);
              this.filterCheckBox.setStatus(false);//can not be unchecked
            }
            this.shelter.hide();
          }));
        }
      }
    },

    setConfig: function(config){
      this.config = config;

      this.layerName = this.config.layerName;
      this._filterList = this.config.filterList;
      this.startStopCheckBox.setValue(this.config.startStop);
      this.clearPreviousCheckBox.setValue(this.config.clear);
      this.drawPreviousCheckBox.setValue(this.config.drawPrevious);
      this.spatialFilterCheckBox.setValue(this.config.spatialFilter);
      this.mapExtentCheckBox.setValue(!!this.config.mapExtentFilter);
      this.drawExtentCheckBox.setValue(!!this.config.drawExtentFilter);
      if(!!this.config.drawExtentFilter){
        domStyle.set(this.symbolPickerNode, 'display', 'inline');
      }else{
        domStyle.set(this.symbolPickerNode, 'display', 'none');
      }
      this.filterCheckBox.setValue(this.config.attrFilter);
    },

    getConfig: function() {
      var ret = {
        layerId: this.streamLayer.id,
        layerName: this.layerName || '',
        startStop: this.startStopCheckBox.getValue(),
        clear: this.clearPreviousCheckBox.getValue(),
        drawPrevious: this.drawPreviousCheckBox.getValue(),
        spatialFilter: this.spatialFilterCheckBox.getValue(),
        mapExtentFilter: this.mapExtentCheckBox.getValue(),
        drawExtentFilter: this.drawExtentCheckBox.getValue(),
        attrFilter: this.filterCheckBox.getValue(),
        filterList: this._filterList
      };
      if(!ret.mapExtentFilter && !ret.drawExtentFilter){
        ret.spatialFilter = false;
      }

      if(ret.drawExtentFilter){
        ret.drawSymbol = this.symbolPicker.getSymbol().toJson();
      }
      return ret;
    },

    _filterStatusChange: function(state){
      if(state){
        domClass.remove(this.filterIcon, 'disabled');
      }else{
        domClass.add(this.filterIcon, 'disabled');
      }
    },

    _spatialStatusChange: function(state){
      if(state){
        domStyle.set(this.spatialChoices, 'display', 'block');
      }else{
        domStyle.set(this.spatialChoices, 'display', 'none');
      }
    },

    _showFilter: function(){
      if(this.filterCheckBox.getValue()){
        var filterConfigPopup;

        filterConfigPopup = new FilterConfigPopup({
          titleLabel: this.nls.configFilter,
          filterList: this._filterList,
          streamLayer: this.streamLayer,
          nls: this.nls
        });

        this.own(on(filterConfigPopup, 'ok', lang.hitch(this, function(res){
          this._filterList = res;
          filterConfigPopup.close();
        })));

        this.own(on(filterConfigPopup, 'cancel', lang.hitch(this, function(){
          filterConfigPopup.close();
        })));

        filterConfigPopup.startup();
      }
    }
  });
});
