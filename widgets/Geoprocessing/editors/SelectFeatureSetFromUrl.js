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
  'dojo/_base/array',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/dijit/CheckBox',
  'jimu/dijit/LoadingIndicator',
  'jimu/dijit/Message',
  'esri/tasks/query',
  'esri/layers/GraphicsLayer',
  'esri/SpatialReference',
  'esri/tasks/QueryTask',
  'esri/symbols/jsonUtils',
  'esri/renderers/SimpleRenderer',
  '../BaseEditor',
  'dojo/text!./SelectFeatureSetFromUrl.html',
  'jimu/dijit/URLInput'
],
function(declare, lang, array, _TemplatedMixin, _WidgetsInTemplateMixin, CheckBox,
  LoadingIndicator, Message, Query, GraphicsLayer, SpatialReference, QueryTask,
  symbolUtils, SimpleRenderer, BaseEditor, template) {
  //from url
  var clazz = declare([BaseEditor, _TemplatedMixin, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-gp-editor-base jimu-gp-editor-url',
    templateString: template,
    editorName: 'SelectFeatureSetFromUrl',

    postCreate: function(){
      this.inherited(arguments);
      this.inputLayer = new GraphicsLayer();
      if(this.param.symbol){
        var renderer = new SimpleRenderer(symbolUtils.fromJson(this.param.symbol));
        this.inputLayer.setRenderer(renderer);
      }
      this.map.addLayer(this.inputLayer);

      if(this.param.featureSetUrl){
        this.featureSetUrl.set('value', this.param.featureSetUrl);
      }

      if(this.param.showUrlContent){
        this.visibleCheckbox = new CheckBox({
          checked: false,
          label: this.nls.showLayerContent,
          onChange: lang.hitch(this, this.viewLayerContent)
        });
        this.visibleCheckbox.placeAt(this.visibleCheckboxDiv);
      }

      this.loading = new LoadingIndicator({
        hidden: true
      }, this.loadingNode);
      this.loading.startup();
    },

    viewLayerContent: function(checked){
      if(checked){
        if(!this.featureSetUrl.isValid()){
          new Message({
            message: this.nls.invalidUrl
          });
          return;
        }
        this._showLoading();

        var query = new Query();
        query.geometry = this.map.extent;
        query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
        query.returnGeometry = true;
        query.outFields = ['*'];
        query.outSpatialReference = new SpatialReference(this.map.spatialReference.wkid);

        this.queryTask = new QueryTask(this.getValue());
        this.queryTask.execute(query, lang.hitch(this, this._addToLayer),
          lang.hitch(this, this._queryError));
      }else{
        this.inputLayer.clear();
      }
    },

    _showLoading: function(){
      this.visibleCheckbox.setStatus(false);
      this.loading.show();
    },

    _hideLoading: function(){
      this.visibleCheckbox.setStatus(true);
      this.loading.hide();
    },

    _queryError: function(err){
      this._hideLoading();
      new Message({
        message: err.message
      });
    },

    _addToLayer: function(featureSet){
      array.forEach(featureSet.features, function(feature){
        this.inputLayer.add(feature);
      }, this);
      this._hideLoading();
    },

    destroy: function(){
      this.inputLayer.clear();
      this.map.removeLayer(this.inputLayer);
    },

    getValue: function(){
      return this.featureSetUrl.get('value');
    },

    getGPValue: function(){
      var query = new Query();
      query.where = '1=1';
      query.returnGeometry = true;
      query.outFields = ['*'];
      query.outSpatialReference = new SpatialReference(this.querySetting.spatialReference.wkid);

      this.queryTask = new QueryTask(this.getValue());
      return this.queryTask.execute(query);
    }
  });

  return clazz;
});
