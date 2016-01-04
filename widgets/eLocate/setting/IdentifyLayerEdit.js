/*global define*/
define(
  ['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/_base/query',
  'dojo/on',
  'dojo/json',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'dijit/Tooltip',
  'dojo/text!./IdentifyLayerEdit.html',
  'dijit/form/TextBox',
  'dijit/form/RadioButton',
  'dijit/form/Form',
  'jimu/dijit/LayerFieldChooser',
  'widgets/Identify/setting/IncludeAllButton',
  'widgets/Identify/setting/IncludeButton',
  'jimu/dijit/SimpleTable',
  'widgets/Identify/setting/SimpleTable',
  'jimu/dijit/ServiceURLInput',
  'esri/request',
  'jimu/dijit/Popup',
  'widgets/Identify/setting/FieldFormatEdit',
  'widgets/Identify/setting/LinkEdit',
  'dojo/keys',
  'jimu/dijit/CheckBox'
  ],
  function(
    declare,
    lang,
    array,
    html,
    query,
    on,
    json,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
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
    FieldFormatEdit,
    LinkEdit,
    keys) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'identify-layer-edit',
      templateString: template,
      config:null,
      tr:null,
      popup: null,
      popup1: null,
      popup2: null,
      fieldformatedit: null,
      linkedit: null,
      _url: '',
      _furl: '',
      _layerDef: null,
      _isAddNow: true,
      _links: null,
      layerInfoCache: null,
      featureLayerDetails:null,
      adding: false,

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        if(!this.config){
          this.popup.disableButton(0);
        }
        this._bindEvents();
        this._initTables();
        this._setConfig(this.config);
      },

      getConfig: function(){
        var indx = this._url.lastIndexOf('/');
        var fUrl = this._url.substring(0, indx);
        var fId = this._url.substring(indx + 1, this._url.length);
        var allSingleLinks = this._getAllSingleLinks();
//        console.info(allSingleLinks);
        var config = {
          name: lang.trim(this.layerName.get('value')),
          url: fUrl,
          id: parseInt(fId),
          zoomscale: this.zoomScale.get('value'),
          forcescale: this.forceScaleCbx.getValue(),
          fields: {
            all: false,
            field: []
          },
          links: {}
        };

        var rowsData = this.displayFieldsTable.getData();
        var retVal;
        var fieldsArray = array.map(rowsData, lang.hitch(this, function (item) {
          retVal = {
            name: item.name,
            alias: item.alias
          };
          if (item.useralias !== item.alias){
            retVal.useralias = item.useralias;
          }
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
          if (item.popuponly) {
            retVal.popuponly = true;
          }
          return retVal;
        }));
        config.fields.field = fieldsArray;

        if(this.displayFieldsTable.getData().length === 0){
          config.fields.all = true;
        }

        if(allSingleLinks.length){
          config.links.link = allSingleLinks;
        }

        this.config = config;
//        console.info(this.config);
        return [this.config, this.tr];
      },

      _setConfig: function(config) {
        this.config = config;
        this.resetAll();
        if (!this.config) {
          return;
        }
        if(this.config.url){
          if(this.config.url.substring(this.config.url.length,1) === '/'){
            this._furl = lang.trim(this.config.url) + this.config.id;
          }else{
            this._furl = lang.trim(this.config.url) + '/' + this.config.id;
          }
        }else{
          this.layerUrl.proceedValue = false;
          this._furl = '';
        }

        this._url = this._furl;
        this._links = this.config.links;
        this.layerUrl.set('value', this._url);
        if(this.config.name){
          this.layerName.set('value', lang.trim(this.config.name));
          this.layerName.proceedValue = true;
        }else{
          this.layerName.proceedValue = false;
        }
        this.zoomScale.set('value', this.config.zoomscale);
        this.forceScaleCbx.setValue(this.config.forcescale);
        var displayFields = this.config.fields.field;
        this._addDisplayFields(displayFields);
        this.allFieldsTable.refresh(this._url);
        if (this._url) {
          this.includeAllButton.enable();
          this.layerUrl.proceedValue = true;
        }
        if (this.config.links) {
          this._initLinksTable();
        }
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
        result.tr.singleLink = args.config;
        return result.tr;
      },

      resetAll: function () {
        this.resetTables();
        this._url = '';
        this.layerUrl.set('value', this._url);
        this.layerName.set('value', '');
      },

      resetTables: function () {
        this.includeButton.disable();
        this.includeAllButton.disable();
        this.allFieldsTable.clear();
        this.displayFieldsTable.clear();
      },

      _addDisplayFields: function (fieldInfos) {
        var i = 0;
        for (i = 0; i < fieldInfos.length; i++) {
          this._createDisplayField(fieldInfos[i]);
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

      _createDisplayField: function (fieldInfo) {
        //console.info(fieldInfo);
        var isNumeric = (this._isNumberType(fieldInfo.type) || fieldInfo.isnumber);
        var rowData = {
          /*name: (this.adding) ? fieldInfo.alias : fieldInfo.name,*/
          name: fieldInfo.name,
          alias: fieldInfo.alias || fieldInfo.name,
          useralias: fieldInfo.useralias || fieldInfo.alias || fieldInfo.name,
          popuponly: fieldInfo.popuponly,
          isnumber: isNumeric,
          isdate: (fieldInfo.type === 'esriFieldTypeDate' || fieldInfo.isdate)
        };
        if(isNumeric){
          fieldInfo.isnumber = true;
        }
        if(fieldInfo.type === 'esriFieldTypeDate' || fieldInfo.isdate){
          fieldInfo.isdate = true;
        }
        if (fieldInfo.dateformat) {
          rowData.dateformat = fieldInfo.dateformat;
          rowData.isdate = true;
          fieldInfo.isdate = true;
        }
        if (fieldInfo.numberformat) {
          rowData.numberformat = fieldInfo.numberformat;
          rowData.isnumber = true;
          fieldInfo.isnumber = true;
        }
        if (fieldInfo.currencyformat) {
          rowData.currencyformat = fieldInfo.currencyformat;
          rowData.isnumber = true;
          fieldInfo.isnumber = true;
        }
        if (fieldInfo.useutc) {
          rowData.useutc = fieldInfo.useutc;
          rowData.isdate = true;
          fieldInfo.isdate = true;
        }
        var result = this.displayFieldsTable.addRow(rowData);
        result.tr.fieldInfo = fieldInfo;
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
          errormessage = this.nls.invalididentifylayer;
          this.featureLayerDetails = null;
        }
        return result;
      },

      _checkForFeatureLayer: function(layerUrl){
        var isFeatureService = (/\/featureserver\//gi).test(layerUrl);
        var isMapService = (/\/mapserver\//gi).test(layerUrl);
        var isImageService = (/\/imageserver\//gi).test(layerUrl);
        if(isFeatureService || isMapService || isImageService){
          return (/\/\d+$/).test(layerUrl);
        }
      },

      _onServiceFetchError: function(){
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
        this.own(on(this.btnAddLink, 'click', lang.hitch(this, function () {
          var args = {
            config: null
          };
          this.popupState = 'ADD';
          var tr = this._createSingleLink(args);
          if (tr) {
            this._openLinkEdit(this.nls.addLink, tr);
          }
        })));
        this.own(on(this.displayFieldsTable, 'actions-edit', lang.hitch(this, function (tr) {
          if (tr.fieldInfo) {
            this._openFieldEdit(this.nls.edit + ': ' + tr.fieldInfo.name, tr);
          }
        })));
        this.own(on(this.linksTable, 'actions-edit', lang.hitch(this, function (tr) {
          this._openLinkEdit(this.nls.updateLink, tr);
        })));
        this.own(on(this.linksTable, 'row-delete', lang.hitch(this, function (tr) {
          delete tr.singleLink;
        })));
        this.own(on(this.layerUrl, 'keydown', lang.hitch(this, function(evt){
          var keyNum = evt.keyCode !== undefined ? evt.keyCode : evt.which;
          if (keyNum === 13) {
            this.layerUrl._onServiceUrlChange(this.layerUrl.get('value'));
          }
        })));
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

      _checkProceed: function() {
        if(this.layerName.get('value') !== ''){
          this.layerName.proceedValue = true;
        }
        var errormessage = '';
        var canProceed = true;
        html.setAttr(this.errorMessage, 'innerHTML', '');
        if (this.layerName.proceedValue) {
          canProceed = canProceed && this.layerUrl.proceedValue; //&& this.displayFieldsTable.getData().length > 0;
        } else {
          canProceed = false;
        }
        if(!this.layerName.proceedValue){
          errormessage += this.nls.layerName + ' ' + this.nls.requiredfield + ' ';
        }
        if(!this.layerUrl.proceedValue){
          if(errormessage === ''){
            errormessage += this.nls.identifyUrl + ' ' + this.nls.requiredfield;
          }else{
            errormessage += ', ' + this.nls.identifyUrl + ' ' + this.nls.requiredfield;
          }
        }
        /*if(this.displayFieldsTable.getData().length === 0){
          if(errormessage === ''){
            errormessage += this.nls.includedFields + ' ' + this.nls.isempty;
          }else{
            errormessage += ', ' + this.nls.includedFields + ' ' + this.nls.isempty;
          }
        }*/
        if (canProceed) {
          this.popup.enableButton(0);
        } else {
          this.popup.disableButton(0);
          if (errormessage) {
            html.setAttr(this.errorMessage, 'innerHTML', errormessage);
          }
        }
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
        if(this.featureLayerDetails.data.type === 'Raster Layer' && !this.featureLayerDetails.data.fields && this.adding){
          var fieldInfo = {
            name: 'Pixel Value',
            alias: 'Pixel Value',
            type: 'esriFieldTypeString',
            isnumber: false,
            isdate: false
          };
          this._createDisplayField(fieldInfo);
        }
        this.layerUrl.proceedValue = true;
        this._checkProceed();
      },

      _openFieldEdit: function (name, tr) {
        this.fieldformatedit = new FieldFormatEdit({
          nls: this.nls,
          tr: tr
        });
        this.fieldformatedit.setConfig(tr.fieldInfo || {});
        this.popup1 = new Popup({
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
        html.addClass(this.popup1.domNode, 'widget-setting-popup');
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
        this.popup1.close();
      },

      _onFieldEditClose: function () {
        this.fieldformatedit = null;
        this.popup1 = null;
      },

      _getAllSingleLinks: function () {
        var trs = this.linksTable._getNotEmptyRows();
        var allSingleLinks = array.map(trs, lang.hitch(this, function (item) {
          return item.singleLink;
        }));
        return allSingleLinks;
      },

      _openLinkEdit: function (name, tr) {
//        console.info(tr.singleLink);
        this.linkedit = new LinkEdit({
          nls: this.nls,
          tr: tr,
          config: tr.singleLink || {},
          layerURL: this._url,
          layerInfoCache: this.layerInfoCache
        });
        this.popup2 = new Popup({
          titleLabel: name,
          autoHeight: true,
          content: this.linkedit,
          container: 'main-page',
          buttons: [
            {
              label: this.nls.ok,
              key: keys.ENTER,
              onClick: lang.hitch(this, '_onLinkEditOk')
            }, {
              label: this.nls.cancel,
              key: keys.ESCAPE
            }
          ],
          onClose: lang.hitch(this, '_onLinkEditClose')
        });
        html.addClass(this.popup.domNode, 'widget-setting-popup');
        this.linkedit.startup();
      },

      _onLinkEditOk: function () {
        var edits = {};
        var linkConfig = this.linkedit.getConfig();
        edits.alias = linkConfig[0].alias || '';
        console.info(linkConfig[0]);
        this.linkedit.tr.singleLink = linkConfig[0];
        this.linksTable.editRow(linkConfig[1], edits);
        this.popupState = '';
        this.popup2.close();
      },

      _onLinkEditClose: function () {
        var linkConfig = this.linkedit.getConfig();
        if(this.popupState === 'ADD'){
          this.linksTable.deleteRow(linkConfig[1]);
        }
        this.linkedit = null;
        this.popup2 = null;
      }
    });
  });
