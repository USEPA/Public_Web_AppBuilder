///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define, setTimeout*/

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
  'dojo/text!./SingleSearchEdit.html',
  'dijit/form/TextBox',
  'dijit/form/RadioButton',
  'dijit/form/Form',
  'jimu/dijit/LayerFieldChooser',
  'widgets/eSearch/setting/IncludeAllButton',
  'widgets/eSearch/setting/IncludeButton',
  'jimu/dijit/SimpleTable',
  'widgets/eSearch/setting/SimpleTable',
  'jimu/dijit/ServiceURLInput',
  'esri/request',
  'jimu/dijit/Popup',
  'widgets/eSearch/setting/SingleExpressionEdit',
  'widgets/eSearch/setting/FieldFormatEdit',
  'widgets/eSearch/setting/SingleLinkEdit',
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
             ServiceURLInput,
             esriRequest,
             Popup,
             SingleExpressionEdit,
             FieldFormatEdit,
             SingleLinkEdit,
             keys) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      baseClass: 'widget-esearch-singlesearch-setting',
      templateString: template,
      nls: null,
      config: null,
      searchSetting: null,
      _url: "",
      _layerDef: null,
      _links: null,
      _showAttachments: null,
      _spatialsearchlayer: null,
      layerUniqueCache: null,
      layerInfoCache: null,
      popup: null,
      popup2: null,
      popup3: null,
      popup4: null,
      fieldformatedit: null,
      singleExpressionedit: null,
      singleLinkedit: null,
      tr: null,
      featureLayerDetails:null,

      postCreate: function () {
        this.inherited(arguments);
        this._setConfig(this.config);
        this._bindEvents();
        this._initTables();
      },

      _setConfig: function (config) {
        this.config = config;
        this.resetAll();
        if (!this.config.url) {
          return;
        }
        this._url = lang.trim(this.config.url || "");
        this._links = this.config.links;
        this._showAttachments = this.config.showattachments;
        if(this.config.zoomScale){
          this.zoomScale.set('value', parseInt(this.config.zoomScale,10));
        }
        if(this.config.layersymbolfrom && this.config.layersymbolfrom === 'config'){
          this.defaultSymRadio.set("checked", true);
        }else{
          this.serverSymRadio.set("checked", true);
        }
        this.isSpatialLayer.setValue(this.config.spatialsearchlayer || false);
        this.layerUrl.set('value', this._url);
        if(this.config.name){
          this.layerName.set('value', lang.trim(this.config.name));
          this.layerName.proceedValue = true;
        }else{
          this.layerName.proceedValue = false;
        }
        this.definitionExpression.set('value', lang.trim(this.config.definitionexpression || ""));
        this._layerDef = lang.trim(this.config.definitionexpression || "");
        var displayFields = this.config.fields.field;
        this._addDisplayFields(displayFields, this.config.titlefield);
        this.allFieldsTable.refresh(this._url);
        if (this._url) {
          this.includeAllButton.enable();
          this.layerUrl.proceedValue = true;
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
//        console.info(allSingleExpressions);
        var allSingleLinks = this._getAllSingleLinks();
        var config = {
          name: lang.trim(this.layerName.get('value')),
          url: this._url,
          definitionexpression: lang.trim(this.definitionExpression.get('value')),
          spatialsearchlayer: this.isSpatialLayer.getValue(),
          zoomScale: parseInt(this.zoomScale.get('value'),10),
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
        config.expressions.expression = allSingleExpressions;
        config.links.link = allSingleLinks;
        this._addLinkFields(config.fields.field, config.links.link);
        this.config = config;
//        console.info(this.config);
        return this.config;
      },

      _addLinkFields: function(fields, links) {
        var linkFldNames = [];
        for (var l=0; l<links.length; l++){
          var link = links[l];
          var lfields = this._getFieldsfromLink(link.content);
          for (var lf=0; lf<lfields.length; lf++){
            linkFldNames.push(lfields[lf]);
          }
        }
        var item;
        var fldExists = false;
        for (var lfld=0; lfld<linkFldNames.length; lfld++){
          fldExists = false;
          for (var i in fields) {
            item = fields[i];
            if (item.name.toLowerCase() === linkFldNames[lfld].toLowerCase()) {
              fldExists = true;
              break;
            }
          }
          if(!fldExists){
            var fld2add = {
              name: linkFldNames[lfld],
              visible: false
            };
            fields.push(fld2add);
          }
        }
      },

      _getFieldsfromLink:function(strLink) {
        var retArr = [];
        var b1 = 0;
        var e1 = 0;
        var fldName = '';
        do{
          b1 = strLink.indexOf("{", e1);
          if(b1 === -1 ){break;}
          e1 = strLink.indexOf("}", b1);
          fldName = strLink.substring(b1 + 1,e1);
          retArr.push(fldName);
        } while(e1 < strLink.length - 1);
        return retArr;
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
        var rowData = {
          alias: (args.config && args.config.alias) || ''
        };
        var result = this.linksTable.addRow(rowData);
        if (!result.success) {
          return null;
        }
        result.tr.singleLink = args.config;
        return result.tr;
      },

      _createSingleExpression: function (args) {
        var rowData = {
          alias: (args.config && args.config.alias) || ''
        };
        var result = this.expressionsTable.addRow(rowData);
        if (!result.success) {
          return null;
        }
        result.tr.singleExpression = args.config;
        return result.tr;
      },

      _onServiceUrlChange: function(){
        this.popup.disableButton(0);
      },

      _onServiceFetch: function(urlDijit, evt){
        var result = false;
        var errormessage = null;
        var url = evt.url.replace(/\/*$/g, '');
        if (this._checkForFeatureLayer(url)) {
          urlDijit.proceedValue = true;
          result = true;
          this.featureLayerDetails = evt;
          this._refreshLayerFields();
        } else {
          urlDijit.proceedValue = false;
          result = false;
          errormessage = this.nls.invalidsearchlayer;
          this.featureLayerDetails = null;
        }
        return result;
      },

      _onServiceFetchError: function(){
      },

      _checkForFeatureLayer: function(layerUrl){
        var isFeatureService = (/\/featureserver\//gi).test(layerUrl);
        var isMapService = (/\/mapserver\//gi).test(layerUrl);
        if(isFeatureService || isMapService){
          return (/\/\d+$/).test(layerUrl);
        }
      },

      _bindEvents: function () {
        this.own(on(this.layerName, 'change', lang.hitch(this, this._checkProceed)));
        this.own(on(this.displayFieldsTable, 'row-add', lang.hitch(this, this._checkProceed)));
        this.own(on(this.layerUrl, 'Change', lang.hitch(this, '_onServiceUrlChange')));
        this.layerUrl.proceedValue = false;
        this.layerUrl.setProcessFunction(lang.hitch(this, '_onServiceFetch', this.layerUrl),
                                    lang.hitch(this, '_onServiceFetchError'));
        this.own(on(this.includeButton, 'Click', lang.hitch(this, this.onIncludeClick)));
        this.own(on(this.includeAllButton, 'Click', lang.hitch(this, this.onIncludeAllClick)));
        this.own(on(this.btnAddExpression, 'click', lang.hitch(this, function () {
          var args = {
            config: null
          };
          var tr = this._createSingleExpression(args);
          if (tr) {
            this.popupState = 'ADD';
            this._showSingleExpressionsEdit(tr);
          }
        })));
        this.own(on(this.btnAddLink, 'click', lang.hitch(this, function () {
          var args = {
            config: null
          };
          var tr = this._createSingleLink(args);
          if (tr) {
            this.popupState = 'ADD';
            this._showSingleLinksEdit(tr);
          }
        })));
        this.own(on(this.displayFieldsTable, 'actions-edit', lang.hitch(this, function (tr) {
          if (tr.fieldInfo) {
            this._openFieldEdit(this.nls.edit + ": " + tr.fieldInfo.name, tr);
          }
        })));
        this.own(on(this.expressionsTable, 'actions-edit', lang.hitch(this, function (tr) {
          this.popupState = 'EDIT';
          this._showSingleExpressionsEdit(tr);
        })));
        this.own(on(this.linksTable, 'actions-edit', lang.hitch(this, function (tr) {
          this.popupState = 'EDIT';
          this._showSingleLinksEdit(tr);
        })));
        this.own(on(this.linksTable, 'row-delete', lang.hitch(this, function (tr) {
          delete tr.singleLink;
        })));
        this.own(on(this.expressionsTable, 'row-delete', lang.hitch(this, function (tr) {
          delete tr.singleSearch;
        })));
        this.own(on(this.layerUrl, 'keydown', lang.hitch(this, function(evt){
          var keyNum = evt.keyCode !== undefined ? evt.keyCode : evt.which;
          if (keyNum === 13) {
            this.layerUrl._onServiceUrlChange(this.layerUrl.get('value'));
          }
        })));
      },

      _openFieldEdit: function (name, tr) {
        this.fieldformatedit = new FieldFormatEdit({
          nls: this.nls,
          tr: tr
        });
        this.fieldformatedit.setConfig(tr.fieldInfo || {});
        this.popup4 = new Popup({
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
        html.addClass(this.popup4.domNode, 'widget-setting-popup');
        this.fieldformatedit.startup();
      },

      _onFieldEditOk: function () {
        var edits = {};
        var fieldInfo = this.fieldformatedit.getConfig();
//        console.info(fieldInfo);
        if (fieldInfo.useutc) {
          edits.useutc = true;
        }else{
          edits.useutc = false;
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
        this.popup4.close();
      },

      _onFieldEditClose: function () {
        this.fieldformatedit = null;
        this.popup4 = null;
      },

      _initTables: function () {
        this.own(on(this.allFieldsTable, 'row-select', lang.hitch(this, function () {
          this.includeButton.enable();
        })));
        this.own(on(this.allFieldsTable, 'rows-clear', lang.hitch(this, function () {
          this.includeButton.disable();
          this.includeAllButton.disable();
        })));
        this.own(on(this.allFieldsTable, 'row-dblclick', lang.hitch(this, function () {
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
          if(this.featureLayerDetails.data.fields){
            this.includeAllButton.enable();
          }
        }
        this.layerUrl.proceedValue = true;
        this._checkProceed();
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

      _checkProceed: function() {
        if(this.layerName.get('value') !== ''){
          this.layerName.proceedValue = true;
        }
        var errormessage = '';
        var canProceed = true;
        html.setAttr(this.errorMessage, 'innerHTML', '');
        if (this.layerName.proceedValue) {
          canProceed = canProceed && this.layerUrl.proceedValue && this.displayFieldsTable.getData().length > 0;
        } else {
          canProceed = false;
        }
        if(!this.layerName.proceedValue){
          errormessage += this.nls.title + ' ' + this.nls.requiredfield + ' ';
        }
        if(!this.layerUrl.proceedValue){
          if(errormessage === ''){
            errormessage += this.nls.searchUrl + ' ' + this.nls.requiredfield;
          }else{
            errormessage += ', ' + this.nls.searchUrl + ' ' + this.nls.requiredfield;
          }
        }
        if(this.displayFieldsTable.getData().length === 0){
          if(errormessage === ''){
            errormessage += this.nls.includedFields + ' ' + this.nls.isempty;
          }else{
            errormessage += ', ' + this.nls.includedFields + ' ' + this.nls.isempty;
          }
        }
        if (canProceed) {
          this.popup.enableButton(0);
        } else {
          this.popup.disableButton(0);
          if (errormessage) {
            html.setAttr(this.errorMessage, 'innerHTML', errormessage);
          }
        }
      },

      _createDisplayField: function (fieldInfo, titleField) {
//        console.info(fieldInfo);
        var isNumeric = (this._isNumberType(fieldInfo.type) || fieldInfo.isnumber);
        var rowData = {
          name: fieldInfo.name,
          alias: fieldInfo.alias || fieldInfo.name,
          title: fieldInfo.name === titleField,
          isnumber: isNumeric,
          isdate: (fieldInfo.type === "esriFieldTypeDate" || fieldInfo.isdate)
        };
        if (fieldInfo.hasOwnProperty('visible') && fieldInfo.visible === false){
          return false;
        }
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

      _showSingleLinksEdit: function(tr) {
        this._openSingleLinksEdit((this.popupState === 'EDIT')?this.nls.updateLink:this.nls.addLink, tr);
      },

      _showSingleExpressionsEdit: function (tr) {
        this._openSingleExprEdit((this.popupState === 'EDIT')?this.nls.updateSearchExpr:this.nls.addSearchExpr, tr);
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
      },

      _openSingleLinksEdit: function (name, tr) {
        this.singleLinkedit = new SingleLinkEdit({
          nls: this.nls,
          tr: tr,
          searchSetting: this,
          layerURL: this._url,
          layerInfoCache: this.layerInfoCache
        });
        this.singleLinkedit.setConfig(tr.singleLink || {});
        this.popup2 = new Popup({
          titleLabel: name,
          autoHeight: true,
          content: this.singleLinkedit,
          container: 'main-page',
          buttons: [
            {
              label: this.nls.ok,
              key: keys.ENTER,
              onClick: lang.hitch(this, '_onSingleLinksEditOk')
            }, {
              label: this.nls.cancel,
              key: keys.ESCAPE
            }
          ],
          onClose: lang.hitch(this, '_onSingleLinksEditClose')
        });
        html.addClass(this.popup2.domNode, 'widget-setting-popup');
        this.singleLinkedit.startup();
      },

      _onSingleLinksEditOk: function () {
        var edits = {};
        var linkConfig = this.singleLinkedit.getConfig();
//        console.info(linkConfig);
        edits.alias = linkConfig.alias;
        this.singleLinkedit.tr.singleLink = linkConfig;
        this.linksTable.editRow(this.singleLinkedit.tr, edits);
        this.popupState = '';
        this.popup2.close();
      },

      _onSingleLinksEditClose: function () {
        if(this.popupState === 'ADD'){
          this.linksTable.deleteRow(this.singleLinkedit.tr);
        }
        this.singleLinkedit = null;
        this.popup2 = null;
      },

      _openSingleExprEdit: function (name, tr) {
        this.singleExpressionedit = new SingleExpressionEdit({
          nls: this.nls,
          tr: tr,
          searchSetting: this,
          layerURL: this._url,
          layerDef: this._layerDef,
          layerUniqueCache: this.layerUniqueCache,
          layerInfoCache: this.layerInfoCache
        });
        this.singleExpressionedit.setConfig(tr.singleExpression || {});
        this.popup3 = new Popup({
          titleLabel: name,
          autoHeight: true,
          content: this.singleExpressionedit,
          container: 'main-page',
          buttons: [
            {
              label: this.nls.ok,
              key: keys.ENTER,
              onClick: lang.hitch(this, '_onSingleExprEditOk')
            }, {
              label: this.nls.cancel,
              key: keys.ESCAPE
            }
          ],
          onClose: lang.hitch(this, '_onSingleExprEditClose')
        });
        html.addClass(this.popup3.domNode, 'widget-setting-popup');
        this.singleExpressionedit.startup();
      },

      _onSingleExprEditOk: function () {
        var edits = {};
        var exprConfig = this.singleExpressionedit.getConfig();
//        console.info(exprConfig);
        edits.alias = exprConfig.alias;
        this.singleExpressionedit.tr.singleExpression = exprConfig;
        this.expressionsTable.editRow(this.singleExpressionedit.tr, edits);
        this.popupState = '';
        this.popup3.close();
      },

      _onSingleExprEditClose: function () {
        if(this.popupState === 'ADD'){
          this.expressionsTable.deleteRow(this.singleExpressionedit.tr);
        }
        this.singleExpressionedit = null;
        this.popup3 = null;
      }

    });
  });
