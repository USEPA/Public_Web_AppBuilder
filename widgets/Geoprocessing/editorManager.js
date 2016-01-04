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
  'dojo/_base/array',
  'dojo/on',
  'dojo/aspect',
  'dijit/form/Select',
  'dijit/form/TextBox',
  'esri/symbols/jsonUtils',
  'jimu/dijit/CheckBox',
  'jimu/dijit/URLInput',
  'jimu/utils',
  './editors/simpleEditors',
  './editors/FeatureSetEditorChooser',
  './editors/FeatureSetResultEditor',
  './editors/SelectFeatureSetFromUrl',
  './editors/SelectFeatureSetFromLayer',
  './editors/DataFileEditor',
  './editors/RasterLayerEditor',
  './editors/RecordSetEditor'
],
function(array, on, aspect,
  Select, TextBox, symbolUtils, CheckBox, URLInput, utils, simpleEditors,
  FeatureSetEditorChooser, FeatureSetResultEditor, SelectFeatureSetFromUrl,
  SelectFeatureSetFromLayer, DataFileEditor, RasterLayerEditor, RecordSetEditor) {
  var mo = {}, map, editors = [], nls;

  mo.createEditor = function(param, direction, context, options) {
    //summary:
    //  create input eidtor depends on the parameter type.
    //context: the editor is in the setting page, or the runtime widget page
    //  setting, widget
    var editor;
    var editorName = getEditorNameFromParam(param, direction, context);
    var o = {
      param: param,
      widgetUID: options?options.uid:undefined,
      config: options?options.config:undefined,
      map: map,
      nls: nls,
      context: context,
      editorManager: mo,
      style: {
        width: '100%'
      }
    };
    if(editorName === 'UnsupportEditor'){
      o.message = 'type ' + param.dataType + ' is not supported for now.';
      editor = new simpleEditors.UnsupportEditor(o);
    }else if(editorName === 'ShowMessage'){
      o.message = getRendererTipMessage(param);
      editor = new simpleEditors.UnsupportEditor(o);
    }else if(editorName === 'RecordSetEditor'){
      editor = new RecordSetEditor(o);
    }else if(editorName === 'MultiValueChooser'){
      editor = new simpleEditors.MultiValueChooser(o);
    }else if(editorName === 'MultiValueEditor'){
      editor = new simpleEditors.MultiValueEditor(o);
    }else if(editorName === 'LongNumberTextBox'){
      editor = new simpleEditors.LongNumberEditor(o);
    }else if(editorName === 'DoubleNumberTextBox'){
      editor = new simpleEditors.DoubleNumberEditor(o);
    }else if(editorName === 'Select'){
      o.gEditor = new Select({
        options: array.map(param.choiceList, function(choice) {
          return {
            label: choice,
            value: choice
          };
        }),
        value: param.defaultValue === undefined? '': param.defaultValue
      });
      o.editorName = 'Select';
      editor = new simpleEditors.GeneralEditorWrapperEditor(o);
    }else if(editorName === 'TextBox'){
      o.gEditor = new TextBox({value: param.defaultValue === undefined? '': param.defaultValue});

      editor = new simpleEditors.GeneralEditorWrapperEditor(o);
    }else if(editorName === 'CheckBox'){
      o.gEditor = new CheckBox({
        checked: param.defaultValue === undefined? false: param.defaultValue
      });

      editor = new simpleEditors.GeneralEditorWrapperEditor(o);
    }else if(editorName === 'LinerUnitEditor'){
      editor = new simpleEditors.LinerUnitEditor(o);
    }else if(editorName === 'DateTimeEditor'){
      editor = new simpleEditors.DateTimeEditor(o);
    }else if(editorName === 'URLInput'){
      o.gEditor = new URLInput({value: param.defaultValue === undefined? '': param.defaultValue});

      editor = new simpleEditors.GeneralEditorWrapperEditor(o);
    }else if(editorName === 'ObjectUrlEditor'){
      if(param.defaultValue && typeof param.defaultValue === 'string'){
        o.value = param.defaultValue;
      }
      editor = new simpleEditors.ObjectUrlEditor(o);
    }else if(editorName === 'SimpleJsonEditor'){
      if(param.defaultValue){
        o.value = param.defaultValue;
      }
      editor = new simpleEditors.SimpleJsonEditor(o);
    }else if(editorName === 'DataFileEditor'){
      if(param.defaultValue){
        o.value = param.defaultValue;
      }
      editor = new DataFileEditor(o);
    }else if(editorName === 'RasterLayerEditor'){
      if(param.defaultValue){
        o.value = param.defaultValue;
      }
      editor = new RasterLayerEditor(o);
    }else if(editorName === 'SelectFeatureSetFromDraw'){
      if(param.defaultValue === undefined){
        o.message = 'No defaultValue property.';
        editor = new simpleEditors.UnsupportEditor(o);
      }else{
        if(param.defaultValue && param.defaultValue.geometryType){
          var drawType = utils.getTypeByGeometryType(param.defaultValue.geometryType);
          o.types = [drawType];
          o.showClear = true;
          if(param.symbol){
            o[drawType + 'Symbol'] = symbolUtils.fromJson(param.symbol);
          }
        }else{
          o.showClear = true;
        }

        editor = new simpleEditors.SelectFeatureSetFromDraw(o);
      }
    }else if(editorName === 'SelectFeatureSetFromLayer'){
      if(param.defaultValue){
        o.value = param.defaultValue;
      }
      editor = new SelectFeatureSetFromLayer(o);
    }else if(editorName === 'SelectFeatureSetFromUrl'){
      o.querySetting = param.defaultValue;
      editor = new SelectFeatureSetFromUrl(o);
    }else if(editorName === 'FeatureSetEditorChooser'){
      editor = new FeatureSetEditorChooser(o);
    }else if(editorName === 'FeatureSetResultEditor'){
      editor = new FeatureSetResultEditor(o);
    }else if(editorName === 'GetUrlObjectFromLayer'){
      if(param.defaultValue){
        o.value = param.defaultValue;
      }
      editor = new simpleEditors.GetUrlObjectFromLayer(o);
    }else{
      o.message = 'wrong editorName.' + editorName;
      editor = new simpleEditors.UnsupportEditor(o);
    }

    if(param.editorDependParamName){
      editor.dependParam = param.editorDependParamName;
    }

    //destroy
    aspect.before(editor, 'destroy', function(){
      editors.splice(editors.indexOf(editor), 1);
    });

    //init the editor depends on the dependParam
    if(editor.dependParam){
      array.forEach(editors, function(_editor){
        if(_editor.param.name === editor.dependParam){
          editor.update(_editor.getValue());
        }
      });
    }

    //update layer field when layer change
    if(editorName === 'SelectFeatureSetFromLayer'){
      on(editor, 'change', function(){
        array.forEach(editors, function(_editor){
          if(_editor.dependParam === param.name){
            _editor.update(editor.getValue());
          }
        });
      });
    }
    editors.push(editor);
    return editor;
  };

  mo.setMap = function(_map){
    map = _map;
  };

  mo.setNls = function(_nls){
    nls = _nls;
  };

  function getEditorNameFromParam(param, direction, context){
    if(param.editorName && param.dataType.indexOf('GPMultiValue') < 0){
      return param.editorName;
    }
    if(direction === 'input'){
      return geteditorName(param, context);
    }else{
      return getOutputEditorName(param, context);
    }
  }

  function geteditorName(param, context){
    if(param.dataType === 'GPMultiValue:GPFeatureRecordSetLayer'){
      return 'UnsupportEditor';
    }else if(param.dataType.indexOf('GPMultiValue') > -1 &&
      (param.choiceList && param.choiceList.length > 0)){
      return 'MultiValueChooser';
    }else if(param.dataType.indexOf('GPMultiValue') > -1 &&
      (!param.choiceList || param.choiceList.length === 0)){
      return 'MultiValueEditor';
    }else if(param.dataType === 'GPLong'){
      return 'LongNumberTextBox';
    }else if(param.dataType === 'GPDouble'){
      return 'DoubleNumberTextBox';
    }else if(param.dataType === 'GPString'){
      if(param.choiceList && param.choiceList.length > 0){
        return 'Select';
      }else{
        return 'TextBox';
      }
    }else if(param.dataType === 'GPBoolean'){
      return 'CheckBox';
    }else if(param.dataType === 'GPLinearUnit'){
      return 'LinerUnitEditor';
    }else if(param.dataType === 'GPDate'){
      return 'DateTimeEditor';
    }else if(param.dataType === 'GPDataFile'){
      return 'DataFileEditor';
    }else if(param.dataType === 'GPRasterDataLayer'){
      return 'RasterLayerEditor';
    }else if(param.dataType === 'GPRecordSet'){
      return 'SimpleJsonEditor';
    }else if(param.dataType === 'GPFeatureRecordSetLayer'){
      //if code run to here, it's must be in setting page,
      //because when in widget, the editor name property must be existed.
      if(context === 'setting'){
        return 'FeatureSetEditorChooser';
      }else{
        if(param.featureSetMode === 'draw'){
          return 'SelectFeatureSetFromDraw';
        }else if(param.featureSetMode === 'layers'){
          return 'SelectFeatureSetFromLayer';
        }else if(param.featureSetMode === 'url'){
          return 'SelectFeatureSetFromUrl';
        }else{
          return 'UnsupportEditor';
        }
      }
    }else{
      return 'UnsupportEditor';
    }
  }

  function getOutputEditorName(param){
    //editors for output can only in setting page
    if(param.dataType === 'GPFeatureRecordSetLayer'){
      return 'FeatureSetResultEditor';
    }else if(param.dataType === 'GPRecordSet'){
      return 'RecordSetEditor';
    }else{
      return 'ShowMessage';
    }
  }

  function getRendererTipMessage(param){
    var message;
    if(param.dataType === 'GPRecordSet'){
      message = 'table';
    }else if(param.dataType === 'GPDataFile' || param.dataType === 'GPRasterDataLayer'){
      message = 'link';
    }else{
      message = 'text';
    }

    return message;
  }

  return mo;
});
