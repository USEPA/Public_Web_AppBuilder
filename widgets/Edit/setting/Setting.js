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
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    'jimu/LayerInfos/LayerInfos',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    'dojo/_base/array',
    "./EditFields",
    "../utils"
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Table,
    LayerInfos,
    lang,
    html,
    on,
    array,
    EditFields,
    editUtils) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-edit-setting',
      // selectLayer: null,
      // tooltipDialog: null,
      // featurelayers: [],
      // indexLayer: -1,

      _jimuLayerInfos: null,
      _layersTable: null,
      _editableLayerInfos: null,

      startup: function() {
        this.inherited(arguments);
        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(operLayerInfos) {
            this._jimuLayerInfos = operLayerInfos;
            this._init();
            this.setConfig();
          }));
      },

      _init: function() {
        this._initToolbar();
        this._initLayersTable();
      },

      _initToolbar: function() {
        this.toolbarVisible.set('checked', this.config.editor.toolbarVisible);
        this.enableUndoRedo.set('checked', this.config.editor.enableUndoRedo);
        this.mergeVisible.set('checked', this.config.editor.toolbarOptions.mergeVisible);
        this.cutVisible.set('checked', this.config.editor.toolbarOptions.cutVisible);
        this.reshapeVisible.set('checked', this.config.editor.toolbarOptions.reshapeVisible);
        this._onToolbarSelected();
      },

      _initLayersTable: function() {
        var fields = [{
          name: 'edit',
          title: this.nls.edit,
          type: 'checkbox',
          'class': 'editable'
        }, {
          name: 'label',
          title: this.nls.label,
          type: 'text'
        }, {
          name: 'disableGeometryUpdate',
          title: this.nls.update,
          type: 'checkbox',
          'class': 'update',
          width: '300px'
        }, {
          name: 'actions',
          title: this.nls.fields,
          type: 'actions',
          'class': 'edit-fields',
          actions: ['edit']
        }];
        var args = {
          fields: fields,
          selectable: false
        };
        this._layersTable = new Table(args);
        this._layersTable.placeAt(this.tableLayerInfos);
        this._layersTable.startup();

        this.own(on(this._layersTable,
          'actions-edit',
          lang.hitch(this, this._onEditFieldInfoClick)));
      },

      setConfig: function() {
        // if (!config.editor.layerInfos) { //***************
        //   config.editor.layerInfos = [];
        // }
        this._editableLayerInfos = this._getEditableLayerInfos();
        this._setLayersTable(this._editableLayerInfos);
      },

      _getEditableLayerInfos: function() {
        // summary:
        //   get all editable layers from map.
        // description:
        //   layerInfo will honor configuration if that layer has configured.
        var editableLayerInfos = [];
        for(var i = this.map.graphicsLayerIds.length - 1; i >= 0; i--) {
          var layerObject = this.map.getLayer(this.map.graphicsLayerIds[i]);
          if (layerObject.type === "Feature Layer" &&
              layerObject.url &&
              layerObject.isEditable &&
              layerObject.isEditable()) {
            var layerInfo = this._getLayerInfoFromConfiguration(layerObject);
            if(!layerInfo) {
              layerInfo = this._getDefaultLayerInfo(layerObject);
            }
            editableLayerInfos.push(layerInfo);
          }
        }
        return editableLayerInfos;
      },

      _getLayerInfoFromConfiguration: function(layerObject) {
        var layerInfo = null;
        var layerInfos = this.config.editor.layerInfos;
        if(layerInfos && layerInfos.length > 0) {
          for(var i = 0; i < layerInfos.length; i++) {
            if(layerInfos[i].featureLayer &&
               layerInfos[i].featureLayer.id === layerObject.id) {
              layerInfo = layerInfos[i];
              break;
            }
          }

          if(layerInfo) {
            // update fieldInfos.
            layerInfo.fieldInfos = this._getSimpleFieldInfos(layerObject, layerInfo);
            // set _editFlag to true
            layerInfo._editFlag = true;
          }
        }
        return layerInfo;
      },

      _getDefaultLayerInfo: function(layerObject) {
        var layerInfo = {
          'featureLayer': {
            'id': layerObject.id
          },
          'disableGeometryUpdate': false,
          'fieldInfos': this._getSimpleFieldInfos(layerObject),
          '_editFlag': this.config.editor.layerInfos &&
                        this.config.editor.layerInfos.length === 0 ? true : false
        };
        return layerInfo;
      },

      _setLayersTable: function(layerInfos) {
        array.forEach(layerInfos, function(layerInfo) {
          var _jimuLayerInfo = this._jimuLayerInfos.getLayerInfoById(layerInfo.featureLayer.id);
          var addRowResult = this._layersTable.addRow({
            label: _jimuLayerInfo.title,
            edit: layerInfo._editFlag,
            disableGeometryUpdate: layerInfo.disableGeometryUpdate
          });
          addRowResult.tr._layerInfo = layerInfo;

          // var editableCheckBox;
          // var editableCheckBoxDomNode = query(".editable .jimu-checkbox", addRowResult.tr)[0];
          // if(editableCheckBoxDomNode) {
          //   editableCheckBox = registry.byNode(editableCheckBoxDomNode);
          //   // this.own(on(editableCheckBox,
          //   // 'change',
          //   // lang.hitch(this, function() {
          //   //   console.log(layerInfo.id);
          //   // })));
          //   editableCheckBox.onChange = lang.hitch(this, function(checked) {
          //     layerInfo._editFlag = checked;
          //   });
          // }
        }, this);
      },

      // about fieldInfos mehtods.
      _getDefaultSimpleFieldInfos: function(layerObject) {
        var fieldInfos = [];
        for (var i = 0; i < layerObject.fields.length; i++) {
          if(layerObject.fields[i].editable) {
            fieldInfos.push({
              fieldName: layerObject.fields[i].name,
              label: layerObject.fields[i].alias || layerObject.fields[i].name,
              isEditable: true
            });
          }
        }
        return fieldInfos;
      },

      _getWebmapSimpleFieldInfos: function(layerObject) {
        var webmapSimpleFieldInfos = [];
        var webmapFieldInfos =
          editUtils.getFieldInfosFromWebmap(layerObject.id, this._jimuLayerInfos);
        if(webmapFieldInfos) {
          array.forEach(webmapFieldInfos, function(webmapFieldInfo) {
            if(webmapFieldInfo.isEditableOnLayer) {
              webmapSimpleFieldInfos.push({
                fieldName: webmapFieldInfo.fieldName,
                label: webmapFieldInfo.label,
                isEditable: webmapFieldInfo.isEditable
              });
            }
          });
          if(webmapSimpleFieldInfos.length === 0) {
            webmapSimpleFieldInfos = null;
          }
        } else {
          webmapSimpleFieldInfos = null;
        }
        return webmapSimpleFieldInfos;
      },

      _getSimpleFieldInfos: function(layerObject, layerInfo) {
        var baseSimpleFieldInfos;
        var simpleFieldInfos = [];
        var defautlSimpleFieldInfos = this._getDefaultSimpleFieldInfos(layerObject);
        var webmapSimpleFieldInfos = this._getWebmapSimpleFieldInfos(layerObject);

        baseSimpleFieldInfos =
          webmapSimpleFieldInfos ? webmapSimpleFieldInfos : defautlSimpleFieldInfos;

        if(layerInfo && layerInfo.fieldInfos) {
          // Edit widget had been configured
          // keep order of config fieldInfos and add new fieldInfos at end.
          array.forEach(layerInfo.fieldInfos, function(configuredFieldInfo) {
            for(var i = 0; i < baseSimpleFieldInfos.length; i++) {
              if(configuredFieldInfo.fieldName === baseSimpleFieldInfos[i].fieldName) {
                simpleFieldInfos.push(configuredFieldInfo);
                baseSimpleFieldInfos[i]._exit = true;
                break;
              }
            }
          });
          array.forEach(baseSimpleFieldInfos, function(baseSimpleFieldInfo) {
            if(!baseSimpleFieldInfo._exit) {
              simpleFieldInfos.push(baseSimpleFieldInfo);
            }
          });
        } else {
          simpleFieldInfos = baseSimpleFieldInfos;
        }
        return simpleFieldInfos;
      },

      _onEditFieldInfoClick: function(tr) {
        var rowData = this._layersTable.getRowData(tr);
        if(rowData && rowData.edit) {
          var editFields = new EditFields({
            nls: this.nls,
            _layerInfo: tr._layerInfo
          });
          editFields.popupEditPage();
        }
      },

      _onToolbarSelected: function() {
        if (!this.toolbarVisible.checked) {
          //html.setStyle(this.toolbarOptionsTr, 'display', 'none');
          html.setStyle(this.toolbarOptionsLabel, 'display', 'none');
          html.setStyle(this.toolbarOptionsTd, 'display', 'none');
        } else {
          //html.setStyle(this.toolbarOptionsTr, 'display', 'table-row');
          html.setStyle(this.toolbarOptionsLabel, 'display', 'table-cell');
          html.setStyle(this.toolbarOptionsTd, 'display', 'table-cell');
        }
      },

      _resetToolbarConfig: function() {
        this.config.editor.toolbarVisible = this.toolbarVisible.checked;
        this.config.editor.enableUndoRedo = this.enableUndoRedo.checked;
        this.config.editor.toolbarOptions.mergeVisible = this.mergeVisible.checked;
        this.config.editor.toolbarOptions.cutVisible = this.cutVisible.checked;
        this.config.editor.toolbarOptions.reshapeVisible = this.reshapeVisible.checked;
      },

      getConfig: function() {
        // get toolbar config
        this._resetToolbarConfig();

        // get layerInfos config
        var checkedLayerInfos = [];
        var layersTableData =  this._layersTable.getData();
        array.forEach(this._editableLayerInfos, function(layerInfo, index) {
          layerInfo._editFlag = layersTableData[index].edit;
          layerInfo.disableGeometryUpdate = layersTableData[index].disableGeometryUpdate;
          if(layerInfo._editFlag) {
            delete layerInfo._editFlag;
            checkedLayerInfos.push(layerInfo);
          }
        });

        // var checkedLayerInfos = [];
        // array.forEach(this._editableLayerInfos, function(layerInfo) {
        //   if(layerInfo._editFlag) {
        //     delete layerInfo._editFlag;
        //     checkedLayerInfos.push(layerInfo);
        //   }
        // });

        if(checkedLayerInfos.length === 0) {
          delete this.config.editor.layerInfos;
        } else {
          this.config.editor.layerInfos = checkedLayerInfos;
        }

        return this.config;
      }
    });
  });