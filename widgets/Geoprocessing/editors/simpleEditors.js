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
  'dojo/_base/html',
  'dojo/on',
  'dojo/Deferred',
  'dojo/promise/all',
  'dojo/json',
  'dijit/form/NumberTextBox',
  'dijit/form/Select',
  'dijit/form/Textarea',
  'dijit/form/DateTextBox',
  'dijit/form/TimeTextBox',
  'jimu/dijit/CheckBox',
  'jimu/dijit/URLInput',
  'jimu/dijit/DrawBox',
  'jimu/utils',
  'esri/tasks/LinearUnit',
  'esri/tasks/FeatureSet',
  'esri/geometry/Polygon',
  'esri/graphic',
  'esri/graphicsUtils',
  '../BaseEditor',
  '../LayerOrderUtil'
],
function(declare, lang, array, html, on, Deferred, all, json, NumberTextBox, Select,
  Textarea, DateTextBox, TimeTextBox, CheckBox, URLInput, DrawBox, utils,
  LinearUnit, FeatureSet, Polygon, Graphic, graphicsUtils, BaseEditor, LayerOrderUtil) {
  var mo = {};

  mo.UnsupportEditor = declare(BaseEditor, {
    baseClass: 'jimu-gp-editor-base jimu-gp-editor-unsupport',
    editorName: 'UnsupportEditor',

    postCreate: function(){
      this.inherited(arguments);
      html.setAttr(this.domNode, 'innerHTML', utils.sanitizeHTML(this.message));
    },

    getValue: function(){
      return null;
    }
  });

  mo.ShowMessage = declare(BaseEditor, {
    baseClass: 'jimu-gp-editor-base jimu-gp-editor-message',
    editorName: 'ShowMessage',

    postCreate: function(){
      this.inherited(arguments);
      html.setAttr(this.domNode, 'innerHTML', utils.sanitizeHTML(this.message));
    },

    getValue: function(){
      return null;
    }
  });

  mo.GeneralEditorWrapperEditor = declare(BaseEditor, {
    baseClass: 'jimu-gp-editor-base jimu-gp-editor-wrapper',
    editorName: 'GeneralEditorWrapperEditor',

    postCreate: function(){
      this.inherited(arguments);
      html.setStyle(this.gEditor.domNode, 'width', '100%');
      if(this.editorName === 'Select'){
        html.addClass(this.gEditor.domNode, 'restrict-select-width');
      }
      this.gEditor.placeAt(this.domNode);
    },

    getValue: function(){
      return this.gEditor.getValue();
    }
  });

  mo.LongNumberEditor = declare(BaseEditor, {
    baseClass: 'jimu-gp-editor-base jimu-gp-editor-long',
    editorName: 'LongNumberEditor',

    postCreate: function(){
      this.inherited(arguments);
      this.value = this.param.defaultValue === undefined ? NaN : this.param.defaultValue;

      this.editor = new NumberTextBox({
        value: this.value,
        constraints: {places:0}
      });

      this.editor.placeAt(this.domNode);
    },

    getValue: function(){
      var ret = this.editor.getValue();

      if(isNaN(ret)){
        return null;
      }else{
        return ret;
      }
    }
  });

  mo.DoubleNumberEditor = declare(BaseEditor, {
    baseClass: 'jimu-gp-editor-base jimu-gp-editor-double',
    editorName: 'DoubleNumberEditor',

    postCreate: function(){
      this.inherited(arguments);
      this.value = this.param.defaultValue === undefined ? NaN : this.param.defaultValue;

      this.editor = new NumberTextBox({
        value: this.value
      });

      this.editor.placeAt(this.domNode);
    },

    getValue: function(){
      var ret = this.editor.getValue();

      if(isNaN(ret)){
        return null;
      }else{
        return ret;
      }
    }
  });

  mo.MultiValueChooser = declare(BaseEditor, {
    //this dijit is used to choose multi value from choice list
    //we support simple value only for now
    baseClass: 'jimu-gp-editor-base jimu-gp-editor-multivalue-chooser',
    editorName: 'MultiValueChooser',

    postCreate: function(){
      this.inherited(arguments);
      this.checkBoxs = [];
      array.forEach(this.param.choiceList, function(choice){
        var dijit = new CheckBox({
          label: choice,
          checked: this.param.defaultValue && this.param.defaultValue.indexOf(choice) > -1?
          true: false
        });
        dijit.placeAt(this.domNode);
        this.checkBoxs.push(dijit);
      }, this);
    },

    getValue: function(){
      var value = [];
      array.forEach(this.checkBoxs, function(checkBox){
        if(checkBox.checked){
          value.push(checkBox.label);
        }
      }, this);
      return value;
    }
  });

  mo.MultiValueEditor = declare(BaseEditor, {
    //this dijit is used to edit multi value, can add/delete value
    //we support simple value only for now
    baseClass: 'jimu-gp-editor-base jimu-gp-editor-multivalue',
    editorName: 'MultiValueEditor',

    postCreate: function(){
      this.inherited(arguments);
      this.editors = [];

      var inputListNode = html.create('div', {
        'class': 'input-list'
      }, this.domNode);

      var _param = lang.clone(this.param, inputListNode);
      _param.dataType = this.param.dataType.substr('GPMultiValue'.length + 1,
        this.param.dataType.length);
      _param.originParam = this.param;

      setTimeout(lang.hitch(this, this._initChildEditors, _param, inputListNode), 100);

      this._createAddInputNode(_param, inputListNode);
    },

    _initChildEditors: function(_param, inputListNode){
      if(this.param.defaultValue && this.param.defaultValue.length > 0){
        array.forEach(this.param.defaultValue, function(v){
          _param.defaultValue = v;
          this._createSingleInputContainerNode(_param, inputListNode);
        }, this);
      }else{
        //if no default value, create a default input area
        delete _param.defaultValue;
        this._createSingleInputContainerNode(_param, inputListNode);
      }
    },

    getValue: function(){
      var value = [];
      array.forEach(this.editors, function(editor){
        value.push(editor.getValue());
      }, this);
      return value;
    },

    getGPValue: function(){
      var def = new Deferred(), defs = [];
      array.forEach(this.editors, function(editor){
        defs.push(editor.getGPValue());
      }, this);
      all(defs).then(function(values){
        def.resolve(values);
      }, function(err){
        def.reject(err);
      });
      return def;
    },

    destroy: function(){
      array.forEach(this.editors, function(editor){
        editor.destroy();
      });
      this.editors = [];
      this.inherited(arguments);
    },

    _createSingleInputContainerNode: function(param, inputListNode){
      var node = html.create('div', {
        'class': 'single-input'
      }, inputListNode);

      var inputEditor = this.editorManager.createEditor(param, 'input', this.context, {
        widgetUID: this.widgetUID,
        config: this.config
      });
      var width = html.getContentBox(this.domNode).w - 30 - 3;
      html.setStyle(inputEditor.domNode, {
        display: 'inline-block',
        width: width + 'px'
      });
      inputEditor.placeAt(node);

      this._createRemoveInputNode(node);
      node.inputEditor = inputEditor;
      this.editors.push(inputEditor);
      return node;
    },

    _createRemoveInputNode: function(containerNode){
      var node = html.create('div', {
        'class': 'remove',
        innerHTML: '-'
      }, containerNode);
      this.own(on(node, 'click', lang.hitch(this, function(){
        this.editors.splice(this.editors.indexOf(containerNode.inputEditor), 1);
        containerNode.inputEditor.destroy();
        html.destroy(containerNode);
      })));
      return node;
    },

    _createAddInputNode: function(param, inputListNode){
      var node = html.create('div', {
        'class': 'add-input'
      }, this.domNode);
      var addNode = html.create('div', {
        'class': 'add-btn',
        innerHTML: '+'
      }, node);
      this.own(on(addNode, 'click', lang.hitch(this, function(){
        this._createSingleInputContainerNode(param, inputListNode);
      })));
      return node;
    }
  });

  mo.LinerUnitEditor = declare(BaseEditor, {
    baseClass: 'jimu-gp-editor-base jimu-gp-editor-liner-unit',
    editorName: 'LinerUnitEditor',

    postCreate: function(){
      this.inherited(arguments);
      this.distance = this.param.defaultValue === undefined? '': this.param.defaultValue.distance;
      this.units = this.param.defaultValue === undefined? '': this.param.defaultValue.units;

      if(this.distance === undefined){
        this.distance = 0;
      }
      if(this.units === undefined){
        this.units = 'esriMeters';
      }
      this.inputDijit = new NumberTextBox({value: this.distance});
      this.selectDijit = new Select({
        value: this.units,
        options: [
          {label: this.nls.Meter, value: 'esriMeters'},
          {label: this.nls.Kilometers, value: 'esriKilometers'},
          {label: this.nls.Feet, value: 'esriFeet'},
          {label: this.nls.Miles, value: 'esriMiles'},
          {label: this.nls.NauticalMiles, value: 'esriNauticalMiles'},
          {label: this.nls.Yards, value: 'esriYards'}
        ]
      });
      html.addClass(this.selectDijit.domNode, 'restrict-select-width');
      this.inputDijit.placeAt(this.domNode);
      this.selectDijit.placeAt(this.domNode);
    },

    getValue: function(){
      var ret = new LinearUnit();
      ret.distance = this.inputDijit.getValue();
      ret.units = this.selectDijit.getValue();
      return ret;
    }
  });

  mo.DateTimeEditor = declare(BaseEditor, {
    baseClass: 'jimu-gp-editor-base jimu-gp-editor-datatime',
    editorName: 'DateTimeEditor',

    postCreate: function(){
      var defaultDt = new Date(this.param.defaultValue);

      //we re-create date again because if we use the today/defaultDt directly,
      //the TimeTextBox can't work. I dont know why.
      this.value = this.param.defaultValue?
        new Date(defaultDt.getFullYear(),
          defaultDt.getMonth(),
          defaultDt.getDate(),
          defaultDt.getHours(),
          defaultDt.getMinutes(),
          defaultDt.getSeconds()):
          null;
      this.inherited(arguments);
      this.dateDijit = new DateTextBox({
        value: this.value,
        style: {width: '60%'}
      });

      this.timeDijit = new TimeTextBox({
        value: this.value,
        style: {width: '40%'},
        constraints: {
          timePattern: 'HH:mm:ss',
          clickableIncrement: 'T00:15:00',
          visibleIncrement: 'T00:15:00'
        }
      });
      this.dateDijit.placeAt(this.domNode);
      this.timeDijit.placeAt(this.domNode);
    },

    startup: function(){
      this.dateDijit.startup();
      this.timeDijit.startup();
    },

    getValue: function(){
      var ret = new Date();
      var dt = this.dateDijit.getValue();
      var time = this.timeDijit.getValue();

      if(dt !== null && time !== null){
        ret.setFullYear(dt.getFullYear());
        ret.setMonth(dt.getMonth());
        ret.setDate(dt.getDate());
        ret.setHours(time.getHours());
        ret.setMinutes(time.getMinutes());
        ret.setSeconds(time.getSeconds());
        return ret.getTime();
      }else{
        return null;
      }
    }
  });

  mo.SelectFeatureSetFromDraw = declare([BaseEditor, DrawBox], {
    editorName: 'SelectFeatureSetFromDraw',

    constructor: function(options){
      this.inherited(arguments);
      this.paramName = options.param.name;
      this.drawLayerId = options.widgetUID + options.param.name;
    },

    postCreate: function(){
      this.inherited(arguments);
      html.addClass(this.domNode, 'jimu-gp-editor-draw');
      html.addClass(this.domNode, 'jimu-gp-editor-base');

      try{
        var layerOrderUtil = new LayerOrderUtil(this.config, this.map);
        layerOrderUtil.calculateLayerIndex(this.paramName, this.widgetUID).then(
            lang.hitch(this, function(layerIndex){
          if(layerIndex !== -1){
            this.map.reorderLayer(this.drawLayer, layerIndex);
          }
        }));
      }catch(err){
        console.error(err.message);
      }

      this.startup();
    },

    getValue: function(){
      if(this.drawLayer && this.drawLayer.graphics.length > 0){
        return this._createFeatureSet(this.drawLayer.graphics);
      }else{
        return null;
      }
    },

    _createFeatureSet: function(graphics){
      var featureset = new FeatureSet();
      var features = [];
      var geometries = graphicsUtils.getGeometries(graphics);

      array.forEach(geometries, function(geom){
        var graphic;
        if(geom.type === 'extent'){
          graphic = new Graphic(Polygon.fromExtent(geom));
        }else{
          graphic = new Graphic(geom);
        }
        features.push(graphic);
      });
      featureset.features = features;
      return featureset;
    }
  });

  mo.GetUrlObjectFromLayer = declare([BaseEditor, Select], {
    editorName: 'GetUrlObjectFromLayer',

    postCreate: function(){
      this.options = [];
      array.forEach(this.map.graphicsLayerIds, function(layerId){
        var layer = this.map.getLayer(layerId);
        if(layer.declaredClass === 'esri.layers.FeatureLayer' &&
          (!this.geometryType || layer.geometryType === this.geometryType)){
          this.options.push({
            label: layer.label || layer.title || layer.name || layer.id,
            value: layer.id
          });
        }
      }, this);

      this.inherited(arguments);

      this.setValue(this.value);
      html.addClass(this.domNode, 'jimu-gp-editor-sffl');
      html.addClass(this.domNode, 'jimu-gp-editor-base');
    },

    getValue: function(){
      return this.value;
    },

    getGPValue: function(){
      var url, value;
      array.forEach(this.map.graphicsLayerIds, function(layerId){
        var layer = this.map.getLayer(layerId);
        if(layerId === this.getValue()){
          url = layer.url;
        }
      }, this);

      value = {url: url};
      value = this.wrapGPValue(value);
      return this.wrapValueToDeferred(value);
    }
  });

  mo.ObjectUrlEditor = declare([BaseEditor, URLInput], {
    editorName: 'ObjectUrlEditor',

    postCreate: function(){
      this.rest = false;
      this.inherited(arguments);
      html.addClass(this.domNode, 'jimu-gp-editor-ourl');
      html.addClass(this.domNode, 'jimu-gp-editor-base');
    },

    getValue: function(){
      return this.value;
    },

    getGPValue: function(){
      var value;
      if(this.getValue()){
        value = {url: this.getValue()};
      }else{
        value = null;
      }
      value = this.wrapGPValue(value);
      return this.wrapValueToDeferred(value);
    }
  });

  mo.SimpleJsonEditor = declare([BaseEditor, Textarea], {
    editorName: 'SimpleJsonEditor',

    postMixInProperties: function() {
      this.inherited(arguments);
      if(typeof this.value === 'object'){
        this.value = json.stringify(this.value);
      }
    },

    postCreate: function(){
      this.inherited(arguments);
      html.addClass(this.domNode, 'jimu-gp-editor-json');
      html.addClass(this.domNode, 'jimu-gp-editor-base');
    },

    getValue: function(){
      return this.value;
    },

    getGPValue: function(){
      var value;
      if(this.getValue()){
        value = json.parse(this.getValue());
      }else{
        value = null;
      }
      value = this.wrapGPValue(value);
      return this.wrapValueToDeferred(value);
    }
  });

  return mo;
});
