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
  'dojo/_base/html',
  'dojo/_base/query',
  'dojo/on',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./MediaSelector.html',
  'dijit/form/Select',
  'jimu/dijit/LayerFieldChooser',
  'jimu/dijit/IncludeButton',
  'jimu/dijit/SimpleTable'
],
function(declare, lang, array, html, query, on, _WidgetBase,_TemplatedMixin, _WidgetsInTemplateMixin,
  template, Select, LayerFieldChooser, IncludeButton, SimpleTable) {/*jshint unused: false*/
  return declare([_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-setting-mediaselector',
    templateString: template,
    nls: null,
    config: null,

    postCreate: function(){
      this.inherited(arguments);
      this._bindEvents();
      this.setConfig(this.config);//fields,medias
    },

    setConfig: function(config){
      this.config = config;
      this.reset();

      if(this.config){
        var medias = this.config.medias;
        this.setMedias(medias);
        var fields = this.config.fields;
        this.setFieldItems(fields);
      }
    },

    getConfig:function(){
      var config = {
        fields:[],
        medias:this.getMedias()
      };

      array.forEach(config.medias,lang.hitch(this,function(media){
        var chartField = media.chartField;
        if(array.indexOf(config.fields,chartField) < 0){
          config.fields.push(chartField);
        }
      }));
      return config;
    },

    reset: function(){
      this.includeButton.disable();
      this.allFieldsTable.clear();
      this.displayFieldsTable.clear();
    },

    setAllFields: function(fields){
      this.allFieldsTable.setFieldItems(fields);
    },

    setMedias: function(medias){
      if(medias && medias.length > 0){
        for(var i = 0;i < medias.length;i++){
          var media = medias[i];
          this._createChartMedia(media);
        }
      }
    },

    getMedias: function(){
      var result = [];
      var trs = this.displayFieldsTable.getRows();
      result = array.map(trs,lang.hitch(this,function(tr){
        var rowData = this.displayFieldsTable.getRowData(tr);
        var select = tr.select;
        var a = {
          chartField:rowData.chartField,
          title:rowData.title,
          type:select.get('value'),
          description:rowData.description
        };
        return a;
      }));
      return result;
    },

    _bindEvents:function(){
      this.own(on(this.includeButton,'Click',lang.hitch(this,this.onIncludeClick)));

      this.own(on(this.allFieldsTable,'row-select', lang.hitch(this,function(){
        this.includeButton.enable();
      })));
      this.own(on(this.allFieldsTable,'rows-clear', lang.hitch(this,function(){
        this.includeButton.disable();
      })));
      this.own(on(this.allFieldsTable,'row-dblclick', lang.hitch(this,function(){
        this.includeButton.enable();
        this.includeButton.onClick();
      })));
    },

    onIncludeClick:function(){
      var tr = this.allFieldsTable.getSelectedRow();
      if(tr){
        var fieldInfo = tr.fieldInfo;
        var media = {
          chartField:fieldInfo.name,
          description:'',
          title:fieldInfo.alias||fieldInfo.name
        };
        this._createChartMedia(media);
      }
    },

    _createChartMedia:function(media){
      var rowData = {
        chartField:media.chartField||'',
        description:media.description||'',
        title:media.title||''
      };
      var result = this.displayFieldsTable.addRow(rowData);
      if(result.success && result.tr){
        var tr = result.tr;
        var td = query('.simple-table-td',tr)[3];
        html.setStyle(td,"verticalAlign","middle");
        var select = new Select({
          style: {
            width: "70px",
            height: "30px"
          }
        });
        select.placeAt(td);
        select.startup();
        var options = [{
          value:'barschart',
          label:'Bar'
        },{
          value:'columnschart',
          label:'Column'
        },{
          value:'linechart',
          label:'Line'
        },{
          value:'piechart',
          label:'Pie'
        }];
        select.addOption(options);
        select.set('value',media.type);
        tr.select = select;
      }
    }
  });
});