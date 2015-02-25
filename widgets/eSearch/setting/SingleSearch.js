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
/*global define, console, setTimeout*/
/*jslint nomen: true, sloppy: true, vars: true, plusplus: true*/
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/_base/query',
  'dojo/on',
  'dojo/json',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/Tooltip',
  'dojo/text!./SingleSearch.html',
  'dijit/form/TextBox',
  'dijit/form/RadioButton',
  'dijit/form/Form',
  'jimu/dijit/LayerFieldChooser',
  'widgets/eSearch/setting/IncludeAllButton',
  'widgets/eSearch/setting/IncludeButton',
  'jimu/dijit/SimpleTable',
  'widgets/eSearch/setting/SimpleTable',
  'jimu/dijit/URLInput',
  'esri/request',
  'jimu/dijit/Popup',
  'widgets/eSearch/setting/SingleExpression',
  'widgets/eSearch/setting/FieldFormatEdit',
  'widgets/eSearch/setting/SingleLink',
  'dojo/keys',
  'jimu/dijit/CheckBox'
],
  function (declare,
             lang,
             array,
             html,
             query,
             on,
             json,
             _WidgetBase,
             _TemplatedMixin,
             _WidgetsInTemplateMixin,
             Tooltip,
             template,
             TextBox,
             RadioButton,
             Form,
             LayerFieldChooser,
             IncludeAllButton,
             IncludeButton,
             SimpleTable,
             eSimpleTable,
             URLInput,
             esriRequest,
             Popup,
             SingleExpression,
             FieldFormatEdit,
             SingleLink,
             keys,
             CheckBox) { /*jshint unused: false*/
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-singlesearch-setting',
      templateString: template,
      nls: null,
      config: null,
      searchSetting: null,
      layerindex: null,
      _url: "",
      _layerDef: null,
      _isAddNow: true,
      _links: null,
      _showAttachments: null,
      _spatialsearchlayer: null,
      layerUniqueCache: null,
      layerInfoCache: null,
      popup: null,
      fieldformatedit: null,

      postCreate: function () {
        this.inherited(arguments);
        this._bindEvents();
        this._initTables();
        this.setConfig(this.config);
        this._isAddNow = this.config ? false : true;
        this.updateStatus(this._isAddNow);
      },

      setConfig: function (config) {
        this.config = config;
        this.resetAll();
        if (!this.config) {
          return;
        }

        this._url = lang.trim(this.config.url || "");
        this._links = this.config.links;
        this._showAttachments = this.config.showattachments;
        if(this.config.layersymbolfrom && this.config.layersymbolfrom === 'config'){
          this.defaultSymRadio.set("checked", true);
        }else{
          this.serverSymRadio.set("checked", true);
        }
        this.isSpatialLayer.setValue(this.config.spatialsearchlayer || false);
        this.layerUrl.set('value', this._url);
        this.layerName.set('value', lang.trim(this.config.name || ""));
        this.definitionExpression.set('value', lang.trim(this.config.definitionexpression || ""));
        this._layerDef = lang.trim(this.config.definitionexpression || "");
        var displayFields = this.config.fields.field;
        this._addDisplayFields(displayFields, this.config.titlefield);
        this.allFieldsTable.refresh(this._url);
        if (this._url) {
          this.includeAllButton.enable();
        }
        this._initExpressionsTable();
        if (this.config.links) {
          this._initLinksTable();
        }
      },

      getConfig: function () {
        if (!this.validate(false)) {
          return false;
        }
        var allSingleExpressions = this._getAllSingleExpressions();
        var allSingleLinks = this._getAllSingleLinks();
        var config = {
          name: lang.trim(this.layerName.get('value')),
          url: this._url,
          definitionexpression: lang.trim(this.definitionExpression.get('value')),
          spatialsearchlayer: this.isSpatialLayer.getValue(),
          expressions: {
            expression: []
          },
          titlefield: this._getTitleField(),
          fields: {
            all: false,
            field: []
          },
          links: {
            link: []
          },
          showattachments: this._showAttachments
        };
        this.sym = this.symFormDijit.get('value');
        if(this.sym.symRadioGroup === 'server'){
          config.layersymbolfrom = 'server';
        }else{
          config.layersymbolfrom = 'config';
        }
          
        var rowsData = this.displayFieldsTable.getData();
        var retVal;
        var fieldsArray = array.map(rowsData, lang.hitch(this, function (item) {
          retVal = {
            name: item.name,
            alias: item.alias
          };
          if (item.dateformat) {
            retVal.dateformat = item.dateformat;
          }
          if (item.useutc) {
            retVal.useutc = true;
          }
          if (item.numberformat) {
            retVal.numberformat = item.numberformat;
          }
          if (item.currencyformat) {
            retVal.currencyformat = item.currencyformat;
          }
          if (item.isnumber) {
            retVal.isnumber = true;
          }
          if (item.isdate) {
            retVal.isdate = true;
          }
          return retVal;
        }));
        config.fields.field = fieldsArray;

        var express = array.map(allSingleExpressions, lang.hitch(this, function (item) {
          return item.getConfig();
        }));
        config.expressions.expression = express;

        var slinks = array.map(allSingleLinks, lang.hitch(this, function (item) {
          return item.getConfig();
        }));
        config.links.link = slinks;

        this.config = config;
        return this.config;
      },

      _initExpressionsTable: function () {
        this.expressionsTable.clear();
        var expressions = this.config && this.config.expressions.expression;
        array.forEach(expressions, lang.hitch(this, function (expressConfig) {
          var args = {
            config: expressConfig
          };
          this._createSingleExpression(args);
        }));
      },

      _initLinksTable: function () {
        this.linksTable.clear();
        var links = this.config && this.config.links.link;
        array.forEach(links, lang.hitch(this, function (linkConfig) {
          var args = {
            config: linkConfig
          };
          this._createSingleLink(args);
        }));
      },

      _createSingleLink: function (args) {
        args.searchSetting = this;
        args.nls = this.nls;
        args.layerURL = this._url;
        args.layerInfoCache = this.layerInfoCache;
        var rowData = {
          alias: (args.config && args.config.alias) || ''
        };
        var result = this.linksTable.addRow(rowData);
        if (!result.success) {
          return null;
        }

        var singleLink = new SingleLink(args);
        singleLink.placeAt(this.singleLinksSection);
        singleLink.startup();
        html.setStyle(singleLink.domNode, 'display', 'none');
        result.tr.singleLink = singleLink;
        this.own(on(singleLink, 'Add', lang.hitch(this, function (config) {
          console.info(config);
          var alias = config.alias || '';
          this.linksTable.editRow(result.tr, {
            alias: alias
          });
          this._showSingleSearchesSection();
        })));
        this.own(on(singleLink, 'Update', lang.hitch(this, function (config) {
          console.info(config);
          var alias = config.alias || '';
          this.linksTable.editRow(result.tr, {
            alias: alias
          });
          this._showSingleSearchesSection();
        })));
        this.own(on(singleLink, 'AddCancel', lang.hitch(this, function () {
          delete result.tr.singleLink;
          this.linksTable.deleteRow(result.tr);
          this.linksTable.destroy();
          this._showSingleSearchesSection();
        })));
        this.own(on(singleLink, 'UpdateCancel', lang.hitch(this, function () {
          this._showSingleSearchesSection();
        })));
        return result.tr;
      },

      _createSingleExpression: function (args) {
        args.searchSetting = this;
        args.nls = this.nls;
        args.layerURL = this._url;
        args.layerDef = this._layerDef;
        args.layerUniqueCache = this.layerUniqueCache;
        args.layerInfoCache = this.layerInfoCache;
        var rowData = {
          alias: (args.config && args.config.alias) || ''
        };
        var result = this.expressionsTable.addRow(rowData);
        if (!result.success) {
          return null;
        }

        var singleExpression = new SingleExpression(args);
        singleExpression.placeAt(this.singleExpressionsSection);
        singleExpression.startup();
        html.setStyle(singleExpression.domNode, 'display', 'none');
        result.tr.singleExpression = singleExpression;
        this.own(on(singleExpression, 'Add', lang.hitch(this, function (config) {
          var alias = config.alias || '';
          this.expressionsTable.editRow(result.tr, {
            alias: alias
          });
          this._showSingleSearchesSection();
        })));
        this.own(on(singleExpression, 'Update', lang.hitch(this, function (config) {
          var alias = config.alias || '';
          this.expressionsTable.editRow(result.tr, {
            alias: alias
          });
          this._showSingleSearchesSection();
        })));
        this.own(on(singleExpression, 'AddCancel', lang.hitch(this, function () {
          delete result.tr.singleExpression;
          this.expressionsTable.deleteRow(result.tr);
          singleExpression.destroy();
          this._showSingleSearchesSection();
        })));
        this.own(on(singleExpression, 'UpdateCancel', lang.hitch(this, function () {
          this._showSingleSearchesSection();
        })));
        return result.tr;
      },

      updateStatus: function (isAddNow) {
        this._isAddNow = !!isAddNow;
        if (this._isAddNow) {
          html.setStyle(this.btnAdd, 'display', 'block');
          html.setStyle(this.btnUpdate, 'display', 'none');
        } else {
          html.setStyle(this.btnUpdate, 'display', 'block');
          html.setStyle(this.btnAdd, 'display', 'none');
        }
      },

      onAdd: function (config) { /*jshint unused: false*/ },

      onUpdate: function (config) { /*jshint unused: false*/ },

      onAddCancel: function () {},

      onUpdateCancel: function () {},

      _bindEvents: function () {
        this.own(on(this.btnBrowse, 'click', lang.hitch(this, this._refreshLayerFields)));
        this.own(on(this.includeButton, 'Click', lang.hitch(this, this.onIncludeClick)));
        this.own(on(this.includeAllButton, 'Click', lang.hitch(this, this.onIncludeAllClick)));
        this.own(on(this.btnAddExpression, 'click', lang.hitch(this, function () {
          var args = {
            config: null
          };
          var tr = this._createSingleExpression(args);
          if (tr) {
            var se = tr.singleExpression;
            this._showSingleExpressionsSection(se);
          }
        })));
        this.own(on(this.btnAddLink, 'click', lang.hitch(this, function () {
          var args = {
            config: null
          };
          var tr = this._createSingleLink(args);
          if (tr) {
            var sl = tr.singleLink;
            this._showSingleLinksSection(sl);
          }
        })));
        this.own(on(this.btnAdd, 'click', lang.hitch(this, function () {
          var config = this.getConfig();
          if (config) {
            this.setConfig(config);
            this.updateStatus(false);
            this.onAdd(config);
          }
        })));
        this.own(on(this.btnUpdate, 'click', lang.hitch(this, function () {
          var config = this.getConfig();
          if (config) {
            this.updateStatus(false);
            this.onUpdate(config);
          }
        })));
        this.own(on(this.btnCancel, 'click', lang.hitch(this, function () {
          if (this._isAddNow) {
            this.onAddCancel();
          } else {
            this.setConfig(this.config);
            this.onUpdateCancel();
          }
        })));
        this.own(on(this.displayFieldsTable, 'actions-edit', lang.hitch(this, function (tr) {
          if (tr.fieldInfo) {
            this._openFieldEdit(this.nls.edit + ": " + tr.fieldInfo.name, tr);
          }
        })));
        this.own(on(this.expressionsTable, 'actions-edit', lang.hitch(this, function (tr) {
          var singleExpression = tr.singleExpression;
          if (singleExpression) {
            this._showSingleExpressionsSection(singleExpression);
          }
        })));
        this.own(on(this.linksTable, 'actions-edit', lang.hitch(this, function (tr) {
          var singleLink = tr.singleLink;
          if (singleLink) {
            this._showSingleLinksSection(singleLink);
          }
        })));
        this.own(on(this.linksTable, 'row-delete', lang.hitch(this, function (tr) {
          var singleLink = tr.singleLink;
          if (singleLink) {
            singleLink.destroy();
          }
          delete tr.singleLink;
        })));
        this.own(on(this.expressionsTable, 'row-delete', lang.hitch(this, function (tr) {
          var singleExpression = tr.singleExpression;
          if (singleExpression) {
            singleExpression.destroy();
          }
          delete tr.singleSearch;
        })));
        this.own(on(this.expressionsTable, 'rows-clear', lang.hitch(this, function (trs) {
          array.forEach(trs, lang.hitch(this, function (tr) {
            var singleExpression = tr.singleExpression;
            if (singleExpression) {
              singleExpression.destroy();
            }
            delete tr.singleExpression;
          }));
        })));
      },

      _openFieldEdit: function (name, tr) {
        this.fieldformatedit = new FieldFormatEdit({
          nls: this.nls,
          tr: tr
        });
        this.fieldformatedit.setConfig(tr.fieldInfo || {});
        this.popup = new Popup({
          titleLabel: name,
          autoHeight: true,
          content: this.fieldformatedit,
          container: 'main-page',
          width: 660,
          buttons: [
            {
              label: this.nls.ok,
              key: keys.ENTER,
              onClick: lang.hitch(this, '_onFieldEditOk')
            }, {
              label: this.nls.cancel,
              key: keys.ESCAPE
            }
          ],
          onClose: lang.hitch(this, '_onFieldEditClose')
        });
        html.addClass(this.popup.domNode, 'widget-setting-popup');
        this.fieldformatedit.startup();
      },

      _onFieldEditOk: function () {
        var edits = {};
        var fieldInfo = this.fieldformatedit.getConfig();
        //console.info(fieldInfo);
        if (fieldInfo.useutc) {
          edits.useutc = fieldInfo.useutc;
        }
        if (fieldInfo.dateformat) {
          edits.dateformat = fieldInfo.dateformat;
        }
        if (fieldInfo.numberformat) {
          edits.numberformat = fieldInfo.numberformat;
        }
        if (fieldInfo.currencyformat) {
          edits.currencyformat = fieldInfo.currencyformat;
        }
        this.displayFieldsTable.editRow(this.fieldformatedit.tr, edits);
        this.popup.close();
      },

      _onFieldEditClose: function () {
        this.fieldformatedit = null;
        this.popup = null;
      },

      _initTables: function () {
        this.own(on(this.allFieldsTable, 'Select', lang.hitch(this, function () {
          this.includeButton.enable();
        })));
        this.own(on(this.allFieldsTable, 'Clear', lang.hitch(this, function () {
          this.includeButton.disable();
          this.includeAllButton.disable();
        })));
        this.own(on(this.allFieldsTable, 'DblClick', lang.hitch(this, function () {
          this.includeButton.enable();
          this.includeButton.onClick();
        })));
      },

      validate: function (showTooltip) {
        if (lang.trim(this.layerUrl.get('value')) === '') {
          if (showTooltip) {
            this._showTooltip(this.layerUrl.domNode, "Please input value.");
          }
          return false;
        }
        if (lang.trim(this.layerName.get('value')) === '') {
          if (showTooltip) {
            this._showTooltip(this.layerName.domNode, "Please input value.");
          }
          return false;
        }
        var trs = this.displayFieldsTable._getNotEmptyRows();
        if (trs.length === 0) {
          if (showTooltip) {
            this._showTooltip(this.displayFieldsTable, "Please select display fields.");
          }
          return false;
        }
        return true;
      },

      _showTooltip: function (aroundNode, content, time) {
        this._scrollToDom(aroundNode);
        Tooltip.show(content, aroundNode);
        time = time || 2000;
        setTimeout(function () {
          Tooltip.hide(aroundNode);
        }, time);
      },

      _scrollToDom: function (dom) {
        var scrollDom = this.searchSetting.domNode.parentNode;
        var y1 = html.position(scrollDom).y;
        var y2 = html.position(dom).y;
        scrollDom.scrollTop = y2 - y1;
      },

      onBack: function (singleSearch, config) { /*jshint unused: false*/ },

      onIncludeClick: function () {
        var tr = this.allFieldsTable.getSelectedRow();
        if (tr) {
          var fieldInfo = tr.fieldInfo;
          this._createDisplayField(fieldInfo);
        }
      },

      onIncludeAllClick: function () {
        var tr = this.allFieldsTable.getRows();
        var r = 0;
        for (r = 0; r < tr.length; r++) {
          var fieldInfo = tr[r].fieldInfo;
          this._createDisplayField(fieldInfo);
        }
      },

      resetAll: function () {
        this.resetTables();
        this._url = '';
        this.layerUrl.set('value', this._url);
        this.layerName.set('value', '');
        this.definitionExpression.set('value', '');
      },

      resetTables: function () {
        this.includeButton.disable();
        this.includeAllButton.disable();
        this.allFieldsTable.clear();
        this.displayFieldsTable.clear();
      },

      _refreshLayerFields: function () {
        var value = lang.trim(this.layerUrl.get('value'));
        if (value !== this._url) {
          this._url = value;
          this.resetTables();
          this.allFieldsTable.refresh(this._url);
          this.includeAllButton.enable();
        }
      },

      _addDisplayFields: function (fieldInfos, titleField) {
        var i = 0;
        for (i = 0; i < fieldInfos.length; i++) {
          this._createDisplayField(fieldInfos[i], titleField);
        }
      },

      _isNumberType: function (type) {
        var numberTypes = ['esriFieldTypeOID',
                           'esriFieldTypeSmallInteger',
                           'esriFieldTypeInteger',
                           'esriFieldTypeSingle',
                           'esriFieldTypeDouble'];
        return array.indexOf(numberTypes, type) >= 0;
      },

      _createDisplayField: function (fieldInfo, titleField) {
        //console.info(fieldInfo);
        var isNumeric = (this._isNumberType(fieldInfo.type) || fieldInfo.isnumber);
        var rowData = {
          name: fieldInfo.name,
          alias: fieldInfo.alias || fieldInfo.name,
          title: fieldInfo.name === titleField,
          isnumber: isNumeric,
          isdate: (fieldInfo.type === "esriFieldTypeDate" || fieldInfo.isdate)
        };
        if (fieldInfo.dateformat) {
          rowData.dateformat = fieldInfo.dateformat;
        }
        if (fieldInfo.numberformat) {
          rowData.numberformat = fieldInfo.numberformat;
        }
        if (fieldInfo.currencyformat) {
          rowData.currencyformat = fieldInfo.currencyformat;
        }
        if (fieldInfo.useutc) {
          rowData.useutc = fieldInfo.useutc;
        }
        var result = this.displayFieldsTable.addRow(rowData);
        result.tr.fieldInfo = fieldInfo;
      },

      _getTitleField: function () {
        var result = null;
        var rowDatas = this.displayFieldsTable.getRowDataArrayByFieldValue('title', true);
        if (rowDatas.length > 0) {
          var rowData = rowDatas[0];
          result = rowData.name;
        }
        return result;
      },

      _showSingleExpressionsSection: function (singleExpression) {
        this._hideSingleExpressions(singleExpression);
        html.setStyle(this.singlesearchSection, 'display', 'none');
        html.setStyle(this.singleExpressionsSection, 'display', 'block');
        html.setStyle(this.singleLinksSection, 'display', 'none');
      },

      _showSingleLinksSection: function (singleLink) {
        this._hideSingleLinks(singleLink);
        html.setStyle(this.singlesearchSection, 'display', 'none');
        html.setStyle(this.singleExpressionsSection, 'display', 'none');
        html.setStyle(this.singleLinksSection, 'display', 'block');
      },

      _showSingleSearchesSection: function () {
        html.setStyle(this.singlesearchSection, 'display', 'block');
        html.setStyle(this.singleExpressionsSection, 'display', 'none');
        html.setStyle(this.singleLinksSection, 'display', 'none');
      },

      _hideSingleExpressions: function (ignoredSingleExpression) {
        var allSingleExpressions = this._getAllSingleExpressions();
        array.forEach(allSingleExpressions, lang.hitch(this, function (item) {
          html.setStyle(item.domNode, 'display', 'none');
        }));
        if (ignoredSingleExpression) {
          html.setStyle(ignoredSingleExpression.domNode, 'display', 'block');
        }
      },

      _hideSingleLinks: function (ignoredSingleLink) {
        var allSingleLinks = this._getAllSingleLinks();
        array.forEach(allSingleLinks, lang.hitch(this, function (item) {
          html.setStyle(item.domNode, 'display', 'none');
        }));
        if (ignoredSingleLink) {
          html.setStyle(ignoredSingleLink.domNode, 'display', 'block');
        }
      },

      _getAllSingleExpressions: function () {
        var trs = this.expressionsTable._getNotEmptyRows();
        var allSingleExpressions = array.map(trs, lang.hitch(this, function (item) {
          return item.singleExpression;
        }));
        return allSingleExpressions;
      },

      _getAllSingleLinks: function () {
        var trs = this.linksTable._getNotEmptyRows();
        var allSingleLinks = array.map(trs, lang.hitch(this, function (item) {
          return item.singleLink;
        }));
        return allSingleLinks;
      }

    });
  });