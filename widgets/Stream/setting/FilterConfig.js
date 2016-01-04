///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
/**
 * Stream widget panel.
 * @module widgets/Stream/setting/FilterConfig
 */
define(['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/on',
  'dojo/dom-style',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./FilterConfig.html',
  './SingleFilter',
  'jimu/dijit/Message',
  'jimu/dijit/SimpleTable',
  'jimu/dijit/LoadingShelter'
],
function(declare, lang, array, on, domStyle, _WidgetBase, _TemplatedMixin,
  _WidgetsInTemplateMixin, template, SingleFilter, Message) {
  return /**@alias module:widgets/Stream/setting/FilterConfig */ declare([_WidgetBase,
    _TemplatedMixin, _WidgetsInTemplateMixin
  ], {
    baseClass: 'jimu-widget-stream-filter',
    templateString: template,
    streamLayer: null,
    config: null,

    postCreate: function() {
      this.inherited(arguments);

      //this.config is filter array
      if(this.config && this.config.length > 0){
        this._applyConfig();
      }
    },

    _applyConfig: function(){
      this.filterList.clear();

      array.forEach(this.config, lang.hitch(this, function(singleConfig, index){
        var addResult = this.filterList.addRow({
          name: singleConfig.name || this.nls.newFilter
        });
        var tr = addResult.tr;
        this._createFilter(tr, singleConfig);
        if(index === 0){
          this.filterList.selectRow(tr);
        }
      }));
    },

    getConfig: function(){
      var currentFilter, config = [];

      array.forEach(this.filterList.getRows(), function(tr){
        currentFilter = tr.filter;
        config.push(currentFilter.getConfig());
      });

      return config;
    },

    _addFilter: function(){
      var addResult, tr;

      addResult = this.filterList.addRow({
        name: this.nls.newFilter
      });

      if(addResult.success) {
        tr = addResult.tr;
        this._createFilter(tr, {
          name: this.nls.newFilter
        });
        this.filterList.selectRow(tr);
      }else{
        new Message({
          message: this.nls.addFilterFailed
        });
      }
    },

    _onFilterSelected: function(tr){
      var currentFilter;
      if(this.currentTR){
        if(this.currentTR !== tr){
          currentFilter = this.currentTR.filter;
          if(currentFilter){
            domStyle.set(currentFilter.domNode, 'display', 'none');
          }

          this.currentTR = tr;
          currentFilter = this.currentTR.filter;
          if(currentFilter){
            domStyle.set(currentFilter.domNode, 'display', 'block');
          }
        }
      }else{
        this.currentTR = tr;
        currentFilter = this.currentTR.filter;
        if(currentFilter){
          domStyle.set(currentFilter.domNode, 'display', 'block');
        }
      }
    },

    _onFilterRemoved: function(tr){
      var currentFilter = tr.filter;
      if(currentFilter){
        currentFilter.destroy();
        tr.filter = null;
      }
    },

    _createFilter: function(tr, config){
      var singleFilter = new SingleFilter({
        config: config,
        streamLayer: this.streamLayer,
        nls: this.nls
      });
      singleFilter.placeAt(this.singleFilterContainer);
      tr.filter = singleFilter;

      this.own(on(singleFilter, 'filterNameChanged', lang.hitch(this, function(newValue){
        this.filterList.editRow(tr, {
          name: newValue
        });
      })));

      domStyle.set(singleFilter.domNode, 'display', 'none');
    }
  });
});
