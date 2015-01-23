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
  'dojo/Evented',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/Tooltip',
  'dijit/form/Select',
  'dojo/text!./SingleChartSetting.html',
  'dijit/form/ValidationTextBox',
  'jimu/dijit/LoadingShelter',
  'jimu/dijit/FeaturelayerSource',
  'jimu/dijit/Popup',
  'jimu/dijit/Message',
  './MediaSelector',
  'esri/request'
],
function(declare, lang, array, html, query, on, Evented, _WidgetBase, _TemplatedMixin,
  _WidgetsInTemplateMixin, Tooltip, Select, template, ValidationTextBox, LoadingShelter,
  FeaturelayerSource, Popup, Message, MediaSelector, esriRequest) {/*jshint unused: false*/
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    baseClass: 'jimu-widget-singlechart-setting',
    templateString: template,
    mediaSelector: null,

    //options
    chartSetting: null,
    config: null,
    map: null,
    nls: null,
    isNewAdd: true,

    //public methods:
    //setConfig
    //getConfig
    //validate
    //setNewLayerSource
    //reset
    //showValidationErrorTip

    //events"
    //edit
    //cancel
    

    postCreate: function(){
      this.inherited(arguments);
      var editLabel = this.isNewAdd ? this.nls.addChartSource : this.nls.updateChartSource;
      html.setAttr(this.btnEdit, 'innerHTML', editLabel);
      this.mediaSelector = new MediaSelector({nls:this.nls});
      this.mediaSelector.placeAt(this.mediaSelectorDiv);
      this.mediaSelector.startup();
      this.setConfig(this.config);
    },

    destroy: function(){
      this.chartSetting = null;
      this.inherited(arguments);
    },

    setConfig: function(config){
      this.config = config;
      this.reset();

      if(!this.config){
        return;
      }

      //this.layerUrl.set('value',config.url);
      //this.sourceLabel.set('value',config.label);
      
      this.shelter.show();

      esriRequest({
        url:lang.trim(config.url),
        content:{f:'json'},
        handleAs:'json',
        callbackParamName: 'callback'
      }).then(lang.hitch(this, function(definition){
        if (this.domNode) {
          this.shelter.hide();
          this.setNewLayerSource(config.label, config.url, definition);
          this.mediaSelector.setMedias(config.medias);

          if (config.labelField) {
            this.categorySelect.set('value', config.labelField);
          }
        }
      }),lang.hitch(this, function(err){
        if(this.domNode){
          this.shelter.hide();
        }
        console.error(err);
      }));
    },

    getConfig: function(){
      if(!this.validate()){
        return false;
      }
      var url = this.layerUrl.get('value');
      var config = {
        label:this._getSourceLabel(),
        url:url,
        labelField:this.categorySelect.get('value'),
        fields:[],
        medias:[]
      };

      var mediaConfig = this.mediaSelector.getConfig();
      var mediaConfigCopy = lang.clone(mediaConfig);
      config = lang.mixin(config, mediaConfigCopy);

      var fields = [config.labelField];
      array.forEach(config.medias, lang.hitch(this,function(media){
        var chartField = media.chartField;
        if(array.indexOf(fields, chartField) < 0){
          fields.push(chartField);
        }
      }));
      config.fields = fields;
      return config;
    },

    validate: function(){
      if(!this.layerUrl.get('value')){
        new Message({
          message: this.nls.setSourceTip
        });
        return false;
      }

      if(!this.categorySelect.get('value')){
        new Message({
          message: this.nls.setLabelFieldTip
        });
        return false;
      }

      if(!this._getSourceLabel()){
        this.showValidationErrorTip(this.sourceLabel);
        return false;
      }

      var mediaConfig = this.mediaSelector.getConfig();
      if(mediaConfig.medias.length === 0){
        new Message({
          message: this.nls.setMediaTip
        });
        return false;
      }

      return true;
    },

    setNewLayerSource: function(name, url, definition){
      this.reset();
      this.layerUrl.set('value', url);
      this._setSourceLabel(name);
      this._setCategorySelectByDefinition(definition);
      this.mediaSelector.setAllFields(definition.fields);
    },

    showValidationErrorTip:function(_dijit){
      if (!_dijit.validate() && _dijit.domNode) {
        if (_dijit.focusNode) {
          _dijit.focusNode.focus();
          setTimeout(lang.hitch(this, function() {
            _dijit.focusNode.blur();
          }), 100);
        }
      }
    },

    _onBtnSourceClicked: function(){
      var args = {
        multiple: false,
        createMapResponse: this.map.webMapResponse,
        appConfig: {
          portalUrl: window.portalUrl,
          appId: ''
        },
        style: {
          height: '100%'
        }
      };

      var sourceDijit = new FeaturelayerSource(args);
      
      var popup = new Popup({
        width: 830,
        height: 560,
        content: sourceDijit,
        titleLabel: this.nls.setSource
      });

      this.own(on(sourceDijit, 'ok', lang.hitch(this, function(items){
        if(items && items.length > 0){
          var item = items[0];
          sourceDijit.destroy();
          sourceDijit = null;
          popup.close();

          var definition = item.definition;

          if(definition){
            if(item.url !== this.layerUrl.get('value')){
              this.setNewLayerSource(item.name, item.url, definition);
            }
          }
          else{
            esriRequest({
              url: item.url,
              handAs: 'json',
              callbackParamName: 'callback',
              content: {
                f: 'json'
              }
            }).then(lang.hitch(this, function(response){
              definition = response;
              if(item.url !== this.layerUrl.get('value')){
                this.setNewLayerSource(item.name, item.url, definition);
              }
            }), lang.hitch(this, function(err){
              console.error(err);
            }));
          }
        }
      })));

      this.own(on(sourceDijit, 'cancel', lang.hitch(this, function(){
        sourceDijit.destroy();
        sourceDijit = null;
        popup.close();
      })));
    },

    _setSourceLabel: function(sourceLabel){
      this.sourceLabel.set('value', sourceLabel);
    },

    _setCategorySelectByDefinition: function(definition){
      this._clearCategorySelect();
      var options = [];
      var fieldInfos = definition.fields;
      for (var i = 0; i < fieldInfos.length; i++) {
        var fieldInfo = fieldInfos[i];
        if (fieldInfo.type !== 'esriFieldTypeGeometry') {
          options.push({
            value: fieldInfo.name,
            label: fieldInfo.alias || fieldInfo.name
          });
        }
      }

      this.categorySelect.addOption(options);
      if (definition.displayField) {
        this.categorySelect.set('value', definition.displayField);
      }
    },

    _getSourceLabel: function(){
      return this.sourceLabel.get('value');
    },

    reset: function(){
      this.layerUrl.set('value','');
      this._setSourceLabel('');
      this._clearCategorySelect();
      this.mediaSelector.reset();
    },

    _clearCategorySelect: function(){
      this.categorySelect.removeOption(this.categorySelect.getOptions());
      this.categorySelect.set('displayedValue','');
      var spans = query('span[role=option]',this.categorySelect.domNode);
      array.forEach(spans,lang.hitch(this,function(span){
        span.innerHTML = '';
      }));
    },

    _onBtnEditClicked: function(){
      var config = this.getConfig();
      if (config) {
        this.emit('edit', config);
      }
      return config;
    },

    _onBtnCancelClicked: function(){
      this.emit('cancel');
    }
  });
});