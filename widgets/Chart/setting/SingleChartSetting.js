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
  'dojo/_base/Color',
  'dojo/on',
  'dojo/Evented',
  'dojo/Deferred',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/Tooltip',
  'dijit/form/Select',
  'dojo/text!./SingleChartSetting.html',
  'dijit/form/ValidationTextBox',
  'dijit/TooltipDialog',
  'dijit/popup',
  'jimu/utils',
  'jimu/dijit/TabContainer3',
  'jimu/dijit/Filter',
  'jimu/dijit/LoadingShelter',
  'jimu/dijit/_FeaturelayerSourcePopup',
  'jimu/dijit/SymbolPicker',
  'jimu/dijit/Message',
  'jimu/dijit/SimpleTable',
  './DataFields',
  '../Preview',
  '../common/Parameters',
  'esri/request',
  'esri/tasks/query',
  'esri/tasks/QueryTask',
  'esri/symbols/jsonUtils'
],
function(declare, lang, array, html, query, Color, on, Evented, Deferred, _WidgetBase,
  _TemplatedMixin, _WidgetsInTemplateMixin, Tooltip, Select, template,
  ValidationTextBox, TooltipDialog, dojoPopup, jimuUtils, TabContainer3, Filter,
  LoadingShelter, _FeaturelayerSourcePopup, SymbolPicker, Message, SimpleTable,
  DataFields, Preview, Parameters, esriRequest, EsriQuery, QueryTask, esriSymbolJsonUtils) {
  /*jshint unused: false*/
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    baseClass: 'jimu-widget-singlechart-setting',
    templateString: template,
    mediaSelector: null,

    //options
    config: null,
    map: null,
    nls: null,
    tr: null,
    folderUrl: '',
    appConfig: null,

    //public methods:
    //setConfig
    //getConfig
    //setNewLayerDefinition

    _layerDefinition: null,

    _highLightColor: '#ff0000',

    _stringFieldType: 'esriFieldTypeString',

    _oidFieldType: 'esriFieldTypeOID',

    _numberFieldTypes: ['esriFieldTypeSmallInteger',
                        'esriFieldTypeInteger',
                        'esriFieldTypeSingle',
                        'esriFieldTypeDouble'],

    postCreate: function(){
      this.inherited(arguments);
      this._initSelf();
    },

    destroy: function(){
      this.tr = null;
      delete this.tr;
      //destroy TooltipDialog
      this._hideAllTooltipDialogs();
      this._destroyTooltipDialog('filterTooltipDialog');
      this._destroyTooltipDialog('sortOrderTooltipDialog');
      this._destroyTooltipDialog('columnTTD');
      this._destroyTooltipDialog('barTTD');
      this._destroyTooltipDialog('lineTTD');
      this._destroyTooltipDialog('pieTTD');
      this.inherited(arguments);
    },

    _destroyTooltipDialog: function(name){
      var ttd = this[name];
      if(ttd){
        this._hideTooltipDialog(ttd);
        ttd.destroy();
      }
      ttd = null;
      this[name] = null;
    },

    _hideAllTooltipDialogs: function(){
      this._hideTooltipDialog(this.filterTooltipDialog);
      this._hideTooltipDialog(this.sortOrderTooltipDialog);
      this._hideAllParamsTooltipDialogs();
    },

    _hideAllParamsTooltipDialogs: function(){
      if(this.columnTTD){
        this._hideTooltipDialog(this.columnTTD);
      }
      if(this.barTTD){
        this._hideTooltipDialog(this.barTTD);
      }
      if(this.lineTTD){
        this._hideTooltipDialog(this.lineTTD);
      }
      if(this.pieTTD){
        this._hideTooltipDialog(this.pieTTD);
      }
    },

    _hideTooltipDialog: function(tooltipDialog){
      if(tooltipDialog){
        dojoPopup.close(tooltipDialog);
        tooltipDialog.isOpendNow = false;
      }
    },

    _showTooltipDialog: function(tooltipDialog, around, /* optional */ orient){
      if(tooltipDialog){
        var args = {
          popup: tooltipDialog,
          around: around
        };
        if(orient){
          args.orient = orient;
        }
        dojoPopup.open(args);
        tooltipDialog.isOpendNow = true;
      }
    },

    startup: function(){
      if(!this._started){
        this.inherited(arguments);
        // setTimeout(lang.hitch(this, function(){
        //   this._updateUrlTextBoxLength();
        // }), 200);
      }
      this._started = true;
    },

    _updateUrlTextBoxLength: function(){
      try{
        var boxBtn = html.getMarginBox(this.btnSetSource);
        var boxDescription = html.getContentBox(this.descriptionTA);
        var width = Math.max(boxDescription.w - boxBtn.w - 10, 380);
        html.setStyle(this.urlTextBox.domNode, 'width', width + 'px');
      }
      catch(e){
        console.error(e);
      }
    },

    setConfig: function(config){
      if(!this._isObject(config)){
        return;
      }

      this.config = config;
      var url = config.url || '';
      var validUrl = url && typeof url === 'string';
      if(!validUrl){
        return;
      }

      if(this._layerDefinition && this._layerDefinition.url === url){
        this._resetByConfig(this.config, this._layerDefinition);
      }
      else{
        this._layerDefinition = null;
        this.showBigShelter();
        var def = esriRequest({
          url: url,
          hanleAs: 'json',
          content: {f: 'json'},
          callbackParamName: 'callback'
        });
        def.then(lang.hitch(this, function(response){
          if(!this.domNode){
            return;
          }
          this.hideBigShelter();
          this._layerDefinition = response;
          this._layerDefinition.url = url;
          this._resetByConfig(this.config, this._layerDefinition);
        }), lang.hitch(this, function(err){
          console.error(err);
          if(!this.domNode){
            return;
          }
          this.hideBigShelter();
        }));
      }
    },

    getConfig: function(showError){
      var config = {
        url: '',
        filter: '',
        name: '',
        description: '',
        mode:'',
        symbol: '',
        highLightColor: ''
        //column
        //pie
        //bar
        //line
      };

      config.url = this.urlTextBox.get('value');

      var filter = this.filter.toJson();
      var expr = filter && filter.expr;
      if(!expr){
        if(showError){
          if(this.tab.viewStack.getSelectedLabel() !== this.nls.preview){
            this._showTooltipDialog(this.filterTooltipDialog, this.urlTextBox.domNode);
          }
          this._showMessage(this.nls.setFilterTip);
        }
        return false;
      }
      config.filter = filter;

      var chartName = this.chartNameTextBox.get('value');
      chartName = jimuUtils.stripHTML(chartName);
      if(!chartName){
        if(showError){
          this._showMessage(this.nls.setChartTitleTip);
        }
        return false;
      }
      config.name = chartName;

      config.description = jimuUtils.stripHTML(this.descriptionTA.value);

      config.mode = this.chartModeSelect.get('value');

      if(this.columnCbx.checked){
        config.column = this.columnParameters.getConfig();
      }

      if(this.pieCbx.checked){
        config.pie = this.pieParameters.getConfig();
      }

      if(this.barCbx.checked){
        config.bar = this.barParameters.getConfig();
      }

      if(this.lineCbx.checked){
        config.line = this.lineParameters.getConfig();
      }

      if(!this.columnCbx.checked && !this.pieCbx.checked &&
       !this.barCbx.checked && !this.lineCbx.checked){
        if(showError){
          this._showMessage(this.nls.setChartTypeTip);
        }
        return false;
      }

      if(config.mode === 'feature'){
        var featureConfig = {
          labelField: '',
          valueFields: [],
          sortOrder: ''
        };

        featureConfig.labelField = this.featureAxisLabelSelect.get('value');

        var featureDataFields = this.valueFields.getSelectedFieldNames();
        if(featureDataFields.length === 0){
          if(showError){
            this._showMessage(this.nls.setDataFieldTip);
          }
          return false;
        }
        featureConfig.valueFields = featureDataFields;

        if(this.ascRadio.checked){
          featureConfig.sortOrder = "asc";
        }
        else{
          featureConfig.sortOrder = "des";
        }

        config = lang.mixin(config, featureConfig);
      }
      else if(config.mode === 'category'){
        var categoryConfig = {
          categoryField: '',
          operation: '',
          valueFields: [],
          sortOrder: ''
        };

        categoryConfig.categoryField = this.categoryFieldSelect.get('value');//check if none

        categoryConfig.operation = this.categoryOperationSelect.get('value');

        var categoryDataFields = this.valueFields.getSelectedFieldNames();
        if(categoryDataFields.length === 0){
          if(showError){
            this._showMessage(this.nls.setDataFieldTip);
          }
          return false;
        }
        categoryConfig.valueFields = categoryDataFields;

        if(this.ascRadio.checked){
          categoryConfig.sortOrder = "asc";
        }
        else{
          categoryConfig.sortOrder = "des";
        }

        config = lang.mixin(config, categoryConfig);
      }
      else if(config.mode === 'count'){
        var countConfig = {
          categoryField: '',
          sortOrder: ''
        };

        countConfig.categoryField = this.categoryFieldSelect.get('value');

        if(this.ascRadio.checked){
          countConfig.sortOrder = "asc";
        }
        else{
          countConfig.sortOrder = "des";
        }

        config = lang.mixin(config, countConfig);
      }
      else if(config.mode === 'field'){
        var fieldConfig = {
          operation: '',
          valueFields: []
        };

        fieldConfig.operation = this.fieldOperationSelect.get('value');

        var fieldDataFields = this.valueFields.getSelectedFieldNames();
        if(fieldDataFields.length === 0){
          if(showError){
            this._showMessage(this.nls.setDataFieldTip);
          }
          return false;
        }
        fieldConfig.valueFields = fieldDataFields;
        config = lang.mixin(config, fieldConfig);
      }

      this.config = lang.clone(config);

      var symbol = this.symbolPicker.getSymbol();
      if(symbol){
        config.symbol = symbol.toJson();
      }
      else{
        return false;
      }

      var color = this.colorPicker.getColor();
      config.highLightColor = color.toHex();

      this.tr._layerDefinition = this._layerDefinition;

      return lang.clone(config);
    },

    _getBarConfig: function(){
      var barConfig = null;

      if(this.barCbx.checked){
        barConfig = this.barParameters.getConfig();
      }

      return barConfig;
    },

    _getColumnConfig: function(){
      var columnConfig = null;

      if(this.columnCbx.checked){
        columnConfig = this.columnParameters.getConfig();
      }

      return columnConfig;
    },

    _getLineConfig: function(){
      var lineConfig = null;

      if(this.lineCbx.checked){
        lineConfig = this.lineParameters.getConfig();
      }

      return lineConfig;
    },

    _getPieConfig: function(){
      var pieConfig = null;

      if(this.pieCbx.checked){
        pieConfig = this.pieParameters.getConfig();
      }

      return pieConfig;
    },

    showBigShelter: function(){
      this.emit("show-shelter");
    },

    hideBigShelter: function(){
      this.emit("hide-shelter");
    },

    _showMessage: function(msg){
      new Message({
        message: msg
      });
    },

    _isObject:function(o){
      return o && typeof o === 'object';
    },

    _initSelf: function(){
      this._initTabs();
      this._initChartTypes();
      this._initFilter();
      this._initSortOrder();
      this._initDataFields();
      this._initPreview();
      this._onChartModeChnaged();
    },

    _initTabs: function(){
      var tabSettings = {
        title: this.nls.settings,
        content: this.settingsTabNode
      };

      var tabPreview = {
        title: this.nls.preview,
        content: this.previewTabNode
      };

      var tabs = [tabSettings, tabPreview];
      this.tab = new TabContainer3({tabs: tabs});
      this.tab.placeAt(this.tabDiv);
      this.own(on(this.tab, 'tabChanged', lang.hitch(this, function(title){
        this._hideAllTooltipDialogs();
        if(title === tabPreview.title){
          this._updatePreview();
        }
      })));
    },

    _initFilter: function(){
      var str = '<div>' +
        '<div class="filter-div"></div>' +
        '<div class="operations" style="overflow:hidden;">' +
          '<div class="jimu-btn  jimu-float-trailing btn-cancel"></div>' +
          '<div class="jimu-btn  jimu-float-trailing btn-ok"></div>' +
        '</div>' +
      '</div>';
      var ttdContent = html.toDom(str);
      var filterDiv = query('.filter-div', ttdContent)[0];
      var btnOk = query('.btn-ok', ttdContent)[0];
      var btnCancel = query('.btn-cancel', ttdContent)[0];
      btnOk.innerHTML = this.nls.ok;
      btnCancel.innerHTML = this.nls.close;

      if(window.isRTL){
        btnOk.style.marginLeft = "20px";
      }
      else{
        btnOk.style.marginRight = "20px";
      }

      this.filterTooltipDialog = new TooltipDialog({
        content: ttdContent
      });

      this.filter = new Filter();
      this.filter.allExpsBox.style.maxHeight = "300px";
      this.filter.allExpsBox.style.overflowY = "auto";
      this.filter.placeAt(filterDiv);
      this.filter.startup();

      this.own(on(btnOk, 'click', lang.hitch(this, function(){
        var result = this.filter.toJson();
        if(result){
          this._hideTooltipDialog(this.filterTooltipDialog);
        }
      })));

      this.own(on(btnCancel, 'click', lang.hitch(this, function(){
        //restore filter to previous config
        this._hideTooltipDialog(this.filterTooltipDialog);
      })));

      this.own(on(this.filterIcon, 'click', lang.hitch(this, function(event){
        var isOpendNow = !!this.filterTooltipDialog.isOpendNow;
        if(isOpendNow){
          this._hideTooltipDialog(this.filterTooltipDialog);
        }
        else{
          this._showTooltipDialog(this.filterTooltipDialog, this.urlTextBox.domNode);
        }
      })));
    },

    _initSortOrder: function(){
      var str = '<div>' +
        '<div class="asc-div">' +
          '<input type="radio" class="asc-radio" checked />' +
          '<span class="asc-span" style="margin-left:10px;">' + this.nls.ascending + '</span>' +
        '</div>' +
        '<div class="des" style="margin-top:10px;">' +
          '<input type="radio" class="des-radio" />' +
          '<span class="des-span" style="margin-left:10px;">' + this.nls.descending + '</span>' +
        '</div>' +
      '</div>';

      var name = "chart_" + jimuUtils.getRandomString();
      var ttdContent = html.toDom(str);
      this.ascRadio = query('.asc-radio', ttdContent)[0];
      this.desRadio = query('.des-radio', ttdContent)[0];
      this.ascRadio.name = name;
      this.desRadio.name = name;

      this.sortOrderTooltipDialog  = new TooltipDialog({
        content: ttdContent
      });

      this.own(on(document.body, 'click', lang.hitch(this, function(event){
        var isOpendNow = !!this.sortOrderTooltipDialog.isOpendNow;
        this._hideTooltipDialog(this.sortOrderTooltipDialog);
        var mode = this.chartModeSelect.get('value');
        var domIcon = null;

        if(mode === 'feature'){
          domIcon = this.featureSortOrderIcon;
        }
        else if(mode === 'category'){
          domIcon = this.categorySortOrderIcon;
        }

        var target = event.target || event.srcElement;
        if(domIcon){
          if(target === domIcon){
            //click featureSortOrderIcon or categorySortOrderIcon
            if(isOpendNow){
              this._hideTooltipDialog(this.sortOrderTooltipDialog);
            }
            else{
              this._showTooltipDialog(this.sortOrderTooltipDialog,
                                      domIcon,
                                      ['after-centered', 'below']);
            }
          } else {
            var a = target === this.sortOrderTooltipDialog.domNode;
            var b = html.isDescendant(target, this.sortOrderTooltipDialog.domNode);
            var isClickInternal = a || b;
            if(isClickInternal){
              if(isOpendNow){
                this._showTooltipDialog(this.sortOrderTooltipDialog,
                                        domIcon,
                                        ['after-centered', 'below']);
              }
              else{
                this._hideTooltipDialog(this.sortOrderTooltipDialog);
              }
            }
            else{
              this._hideTooltipDialog(this.sortOrderTooltipDialog);
            }
          }
        }
      })));
    },

    _initDataFields: function(){
      this.valueFields = new DataFields({
        nls: this.nls
      });
      this.valueFields.placeAt(this.dataFieldsDiv);
      this.valueFields.startup();
      this.own(on(this.valueFields, 'change', lang.hitch(this, function(){
        this._updateChartTypes();
        this._updateParametersDijit();
      })));
    },

    _updateParametersDijit: function(){
      var mode = this.chartModeSelect.get('value');

      if(mode === 'feature' || mode === 'category'){
        var fields = this.valueFields.getSelectedFieldNames();
        if(fields.length === 1){
          //if one field selected, should show single color section
          this.columnParameters.showSingleColor();
          this.barParameters.showSingleColor();
          this.lineParameters.showSingleColor();
        }
        else{
          //if none or more than two fields selected, should show multiple color section
          this.columnParameters.showMultiColor();
          this.barParameters.showMultiColor();
          this.lineParameters.showMultiColor();
        }
      }
      else{
        //chart only supports single color for count and field mode
        this.columnParameters.showSingleColor();
        this.barParameters.showSingleColor();
        this.lineParameters.showSingleColor();
      }
    },

    _updateChartTypes: function(){
      this.pieCbx.disabled = false;

      var chartMode = this.chartModeSelect.get('value');

      if(chartMode === 'feature' || chartMode === 'category'){
        var fields = this.valueFields.getSelectedFieldNames();
        if(fields.length > 1){
          this.pieCbx.checked = false;
          this.pieCbx.disabled = true;
        }
      }

      if(this.pieCbx.disabled) {
        html.addClass(this.pieLabel, 'gray');
      }
      else{
        html.removeClass(this.pieLabel, 'gray');
      }
    },

    _initChartTypes: function(){
      var imagesUrl = this.folderUrl + 'common/images';
      //column
      jimuUtils.combineRadioCheckBoxWithLabel(this.columnCbx, this.columnLabel);
      this.columnParameters = new Parameters({
        type: 'column',
        imagesUrl: imagesUrl,
        isInWidget: false,
        singleColor: false,
        nls: this.nls,
        config: null
      });
      this.columnTTD = this._createParametersDialog(this.columnCbx,
                                                    this.columnEdit,
                                                    this.columnParameters);

      //pie
      jimuUtils.combineRadioCheckBoxWithLabel(this.pieCbx, this.pieLabel);
      this.pieParameters = new Parameters({
        type: 'pie',
        imagesUrl: imagesUrl,
        isInWidget: false,
        singleColor: false,
        nls: this.nls,
        config: null
      });
      this.pieTTD = this._createParametersDialog(this.pieCbx, this.pieEdit, this.pieParameters);

      //bar
      jimuUtils.combineRadioCheckBoxWithLabel(this.barCbx, this.barLabel);
      this.barParameters = new Parameters({
        type: 'bar',
        imagesUrl: imagesUrl,
        isInWidget: false,
        singleColor: false,
        nls: this.nls,
        config: null
      });
      this.barTTD = this._createParametersDialog(this.barCbx, this.barEdit, this.barParameters);

      //line
      jimuUtils.combineRadioCheckBoxWithLabel(this.lineCbx, this.lineLabel);
      this.lineParameters = new Parameters({
        type: 'line',
        imagesUrl: imagesUrl,
        isInWidget: false,
        singleColor: false,
        nls: this.nls,
        config: null
      });
      this.lineTTD = this._createParametersDialog(this.lineCbx, this.lineEdit, this.lineParameters);

      this.own(on(document.body, 'click', lang.hitch(this, function(event){
        var target = event.target || event.srcElement;
        this._unselectEditDivs();
        var isOpendNow = null;
        var cbx = null;
        var editDiv = null;
        var tooltipDialog = null;
        var isCheckBox = (target === this.columnCbx) ||
                         (target === this.pieCbx) ||
                         (target === this.barCbx) ||
                         (target === this.lineCbx);
        var isEditDiv = (target === this.columnEdit) ||
                        (target === this.pieEdit) ||
                        (target === this.barEdit) ||
                        (target === this.lineEdit);
        if(isCheckBox){
          cbx = target;
          if(cbx === this.columnCbx){
            editDiv = this.columnEdit;
            tooltipDialog = this.columnTTD;
          }
          else if(cbx === this.pieCbx){
            editDiv = this.pieEdit;
            tooltipDialog = this.pieTTD;
          }
          else if(cbx === this.barCbx){
            editDiv = this.barEdit;
            tooltipDialog = this.barTTD;
          }
          else if(cbx === this.lineCbx){
            editDiv = this.lineEdit;
            tooltipDialog = this.lineTTD;
          }
          isOpendNow = !!tooltipDialog.isOpendNow;
          this._hideAllParamsTooltipDialogs();

          if(cbx.checked){
            this._showEditDiv(editDiv);
            html.addClass(editDiv, 'selected');
            this._showTooltipDialog(tooltipDialog, editDiv);
          }
          else{
            this._hideTooltipDialog(tooltipDialog);
            this._hideEditDiv(editDiv);
          }
        }
        else if(isEditDiv){
          editDiv = target;
          if(editDiv === this.columnEdit){
            tooltipDialog = this.columnTTD;
          }
          else if(editDiv === this.pieEdit){
            tooltipDialog = this.pieTTD;
          }
          else if(editDiv === this.barEdit){
            tooltipDialog = this.barTTD;
          }
          else if(editDiv === this.lineEdit){
            tooltipDialog = this.lineTTD;
          }
          isOpendNow = !!tooltipDialog.isOpendNow;
          this._hideAllParamsTooltipDialogs();
          if(isOpendNow){
            this._hideTooltipDialog(tooltipDialog);
          }
          else{
            this._showTooltipDialog(tooltipDialog, editDiv);
            html.addClass(editDiv, 'selected');
          }
        }
        else{
          if(this.columnTTD.isOpendNow){
            editDiv = this.columnEdit;
            tooltipDialog = this.columnTTD;
          }
          else if(this.pieTTD.isOpendNow){
            editDiv = this.pieEdit;
            tooltipDialog = this.pieTTD;
          }
          else if(this.barTTD.isOpendNow){
            editDiv = this.barEdit;
            tooltipDialog = this.barTTD;
          }
          else if(this.lineTTD.isOpendNow){
            editDiv = this.lineEdit;
            tooltipDialog = this.lineTTD;
          }
          if(tooltipDialog){
            var a = target === tooltipDialog.domNode;
            var b = html.isDescendant(target, tooltipDialog.domNode);
            var isClickInternal = a || b;
            if(isClickInternal){
              this._hideAllParamsTooltipDialogs();
              this._showTooltipDialog(tooltipDialog, editDiv);
              html.addClass(editDiv, 'selected');
            }
            else{
              this._hideAllParamsTooltipDialogs();
            }
          }
          else{
            this._hideAllParamsTooltipDialogs();
          }
        }
      })));
    },

    _createParametersDialog: function(cbx, editDiv, parametersDijit){
      var ttdContent = html.create('div');
      parametersDijit.placeAt(ttdContent);
      var tooltipDialog = new TooltipDialog({
        content: ttdContent
      });

      return tooltipDialog;
    },

    _unselectEditDivs: function(){
      html.removeClass(this.columnEdit, 'selected');
      html.removeClass(this.pieEdit, 'selected');
      html.removeClass(this.barEdit, 'selected');
      html.removeClass(this.lineEdit, 'selected');
    },

    _showEditDiv: function(editDiv){
      html.setStyle(editDiv, 'display', 'inline-block');
    },

    _hideEditDiv: function(editDiv){
      html.setStyle(editDiv, 'display', 'none');
    },

    _initPreview: function(){
      this.preview = new Preview({
        nls: this.nls,
        folderUrl: this.folderUrl
      });

      this.preview.placeAt(this.previewDiv);
      this.preview.startup();
    },

    _onChartModeChnaged: function(){
      var chartMode = this.chartModeSelect.get('value') || '';

      var className = chartMode + '-tr';
      var trs = query('.detail-tr', this.detailsTable);

      array.forEach(trs, lang.hitch(this, function(tr){
        if(html.hasClass(tr, className)){
          html.addClass(tr, 'show-tr');
        }
        else{
          html.removeClass(tr, 'show-tr');
        }
      }));

      this._updateChartTypes();
      this._updateParametersDijit();
    },

    _onChartNameBlurred: function(){
      var value = jimuUtils.stripHTML(this.chartNameTextBox.get('value'));
      this.chartNameTextBox.set('value', value);
    },

    _onChartNameChanged: function(){
      this.emit('name-change', this.chartNameTextBox.get('value'));
    },

    _onDescriptionBlurred: function(){
      this.descriptionTA.value = jimuUtils.stripHTML(this.descriptionTA.value);
    },

    _clear: function(){
      //reset general
      this._layerDefinition = null;
      this.urlTextBox.set('value', '');
      this.filter.reset();

      this.chartNameTextBox.set('value', '');

      this.descriptionTA.value = '';

      this.chartModeSelect.removeOption(this.chartModeSelect.getOptions());

      //reset details
      this.categoryFieldSelect.removeOption(this.categoryFieldSelect.getOptions());

      this.categoryOperationSelect.set('value', 'sum');

      this.fieldOperationSelect.set('value', 'sum');

      this.valueFields.clear();

      this.featureAxisLabelSelect.removeOption(this.featureAxisLabelSelect.getOptions());

      this.ascRadio.checked = true;

      this.columnCbx.checked = false;
      this.pieCbx.checked = false;
      this.barCbx.checked = false;
      this.lineCbx.checked = false;

      this.columnParameters.reset();
      this.pieParameters.reset();
      this.barParameters.reset();
      this.lineParameters.reset();

      //reset symbol picker
      this.symbolPicker.reset();
      this.colorPicker.setColor(new Color(this._highLightColor));

      //reset preview
      this.preview.clear();
    },

    _onBtnSetClicked: function(){
      var args = {
        titleLabel: this.nls.setDataSource,

        dijitArgs: {
          multiple: false,
          createMapResponse: this.map.webMapResponse,
          portalUrl: this.appConfig.portalUrl,
          style: {
            height: '100%'
          }
        }
      };

      var featurePopup = new _FeaturelayerSourcePopup(args);
      this.own(on(featurePopup, 'ok', lang.hitch(this, function(item){
        featurePopup.close();
        this.setNewLayerDefinition(item.name, item.url, item.definition);
      })));
      this.own(on(featurePopup, 'cancel', lang.hitch(this, function(){
        featurePopup.close();
      })));

      featurePopup.startup();
    },

    _hasNumberFields: function(layerDefinition){
      var result = false;
      var fieldInfos = layerDefinition.fields;
      if(fieldInfos && fieldInfos.length > 0){
        result = array.some(fieldInfos, lang.hitch(this, function(fieldInfo){
          return this._numberFieldTypes.indexOf(fieldInfo.type) >= 0;
        }));
      }
      return result;
    },

    setNewLayerDefinition: function(name, url, definition, /* optional */ chartName){
      definition.name = name;
      definition.url = url;
      var oldUrl = this._layerDefinition && this._layerDefinition.url;
      if (url !== oldUrl) {
        this._resetByNewLayerDefinition(definition, chartName);
      }
    },

    _resetByNewLayerDefinition: function(layerInfo, /* optional */ chartName){
      this._clear();
      if(!layerInfo){
        return;
      }

      //general
      this._layerDefinition = layerInfo;
      var url = layerInfo.url;
      this.urlTextBox.set('value', url);
      if(this._layerDefinition){
        this.filter.buildByExpr(url, '1=1', this._layerDefinition);
      }

      this.chartNameTextBox.set('value', chartName || layerInfo.name);

      //details
      //reset categoryFieldSelect, featureAxisLabelSelect, valueFields
      this._resetFieldsDijitsByLayerInfo(this._layerDefinition);

      // this.columnCbx.checked = true;

      //reset symbol
      var geoType = jimuUtils.getTypeByGeometryType(layerInfo.geometryType);
      var symType = '';
      if(geoType === 'point'){
        symType = 'marker';
      }
      else if(geoType === 'polyline'){
        symType = 'line';
      }
      else if(geoType === 'polygon'){
        symType = 'fill';
      }
      if(symType){
        this.symbolPicker.showByType(symType);
      }
    },

    _resetFieldsDijitsByLayerInfo: function(layerDefinition){
      //reset chartModeSelect
      this.chartModeSelect.removeOption(this.chartModeSelect.getOptions());
      if(this._hasNumberFields(layerDefinition)){
        this.chartModeSelect.addOption({
          value: 'feature',
          label: this.nls.featureOption
        });
        this.chartModeSelect.addOption({
          value: 'category',
          label: this.nls.categoryOption
        });
        this.chartModeSelect.addOption({
          value: 'count',
          label: this.nls.countOption
        });
        this.chartModeSelect.addOption({
          value: 'field',
          label: this.nls.fieldOption
        });
        this.chartModeSelect.set('value', 'feature');
      }
      else{
        this.chartModeSelect.addOption({
          value: 'count',
          label: this.nls.countOption
        });
        this.chartModeSelect.set('value', 'count');
      }

      var displayField = layerDefinition.displayField;
      var fieldInfos = lang.clone(layerDefinition.fields);

      //categoryFieldSelect
      var categoryFieldTypes = [this._stringFieldType].concat(lang.clone(this._numberFieldTypes));

      var availableCategoryFieldInfos = array.filter(fieldInfos,
        lang.hitch(this, function(fieldInfo){
        return categoryFieldTypes.indexOf(fieldInfo.type) >= 0;
      }));

      this.categoryFieldSelect.removeOption(this.categoryFieldSelect.getOptions());

      var selectedCategoryFieldValue = '';

      array.forEach(availableCategoryFieldInfos, lang.hitch(this, function(fieldInfo){
        var option = {
          value: fieldInfo.name,
          label: fieldInfo.alias
        };

        this.categoryFieldSelect.addOption(option);

        if(fieldInfo.name === displayField){
          selectedCategoryFieldValue = displayField;
        }
      }));

      this.categoryFieldSelect.set('value', selectedCategoryFieldValue);

      //featureAxisLabelSelect
      var a = this._stringFieldType;
      var b = this._oidFieldType;
      var featureLabelFieldTypes = [a, b].concat(lang.clone(this._numberFieldTypes));

      var availableLabelFieldInfos = array.filter(fieldInfos, lang.hitch(this, function(fieldInfo){
        return featureLabelFieldTypes.indexOf(fieldInfo.type) >= 0;
      }));

      this.featureAxisLabelSelect.removeOption(this.featureAxisLabelSelect.getOptions());

      var selectedAxisLabelValue = '';

      array.forEach(availableLabelFieldInfos, lang.hitch(this, function(fieldInfo){
        var option = {
          value: fieldInfo.name,
          label: fieldInfo.alias
        };

        if(displayField){
          if(fieldInfo.name === displayField){
            selectedAxisLabelValue = fieldInfo.name;
          }
        }
        else{
          if(fieldInfo.type === this._oidFieldType){
            selectedAxisLabelValue = fieldInfo.name;
          }
        }

        this.featureAxisLabelSelect.addOption(option);
      }));

      this.featureAxisLabelSelect.set('value', selectedAxisLabelValue);

      //valueFields
      var numberFieldInfos = array.filter(fieldInfos, lang.hitch(this, function(fieldInfo){
        return this._numberFieldTypes.indexOf(fieldInfo.type) >= 0;
      }));
      this.valueFields.setFields(numberFieldInfos);
    },

    _resetByConfig: function(cfg, layerInfo){
      this._clear();
      var config = lang.clone(cfg);

      //general
      this._layerDefinition = layerInfo;
      this.urlTextBox.set('value', config.url);
      var filter = config.filter;
      // this.whereClause.innerHTML = filter.expr;
      this.filter.buildByFilterObj(layerInfo.url, filter, layerInfo);
      this.chartNameTextBox.set('value', config.name || layerInfo.name || '');
      this.descriptionTA.value = config.description || '';

      //details
      //reset categoryFieldSelect, featureAxisLabelSelect, valueFields
      this._resetFieldsDijitsByLayerInfo(layerInfo);

      this.chartModeSelect.set('value', config.mode);

      var setPieConfig = lang.hitch(this, function(){
        if(config.pie){
          this.pieParameters.setConfig(config.pie);
          this.pieCbx.checked = true;
          this._showEditDiv(this.pieEdit);
        }
      });

      if(config.mode === 'feature'){
        this.featureAxisLabelSelect.set('value', config.labelField);
        this.valueFields.selectFields(config.valueFields);

        if(config.sortOrder === 'des'){
          this.desRadio.checked = true;
        }
        else{
          this.ascRadio.checked = true;
        }

        if(config.valueFields.length <= 1){
          setPieConfig();
        }
      }
      else if(config.mode === 'category'){
        this.categoryFieldSelect.set('value', config.categoryField);
        this.categoryOperationSelect.set('value', config.operation);
        this.valueFields.selectFields(config.valueFields);

        if(config.sortOrder === 'des'){
          this.desRadio.checked = true;
        }
        else{
          this.ascRadio.checked = true;
        }

        if(config.valueFields.length <= 1){
          setPieConfig();
        }
      }
      else if(config.mode === 'count'){
        this.categoryFieldSelect.set('value', config.categoryField);

        if(config.sortOrder === 'des'){
          this.desRadio.checked = true;
        }
        else{
          this.ascRadio.checked = true;
        }

        setPieConfig();
      }
      else if(config.mode === 'field'){
        this.fieldOperationSelect.set('value', config.operation);
        this.valueFields.selectFields(config.valueFields);
        setPieConfig();
      }

      //should execute setConfig method of Parameters after execute setConfig method of valueFields
      if(config.column){
        this.columnParameters.setConfig(config.column);
        this.columnCbx.checked = true;
        this._showEditDiv(this.columnEdit);
      }

      if(config.bar){
        this.barParameters.setConfig(config.bar);
        this.barCbx.checked = true;
        this._showEditDiv(this.barEdit);
      }

      if(config.line){
        this.lineParameters.setConfig(config.line);
        this.lineCbx.checked = true;
        this._showEditDiv(this.lineEdit);
      }

      //set symbol
      var symbol = esriSymbolJsonUtils.fromJson(config.symbol);
      this.symbolPicker.showBySymbol(symbol);

      ////highlight color
      this.colorPicker.setColor(new Color(config.highLightColor));
    },

    _updatePreview: function(){
      this.preview.clear();
      var config = this.getConfig(true);
      if(!config){
        return;
      }

      var queryParams = new EsriQuery();
      queryParams.returnGeometry = false;
      queryParams.where = config.filter.expr || '1=1';
      queryParams.outFields = [];

      if(config.mode === 'feature'){
        queryParams.outFields = lang.clone(config.valueFields);
        if(queryParams.outFields.indexOf(config.labelField) < 0){
          queryParams.outFields = [config.labelField].concat(queryParams.outFields);
        }
      }
      else if(config.mode === 'category'){
        queryParams.outFields = lang.clone(config.valueFields);
        if(queryParams.outFields.indexOf(config.categoryField) < 0) {
          queryParams.outFields =  [config.categoryField].concat(queryParams.outFields);
        }
      }
      else if(config.mode === 'count'){
        queryParams.outFields = [config.categoryField];
      }
      else if(config.mode === 'field'){
        queryParams.outFields = lang.clone(config.valueFields);
      }

      this.tab.showShelter();
      this.showBigShelter();

      this._queryFeatures(queryParams, config.url).then(lang.hitch(this, function(featureSet) {
        if(!this.domNode){
          return;
        }

        var box = html.getContentBox(this.domNode.parentNode);
        var h = Math.max(box.h - 60, 150);
        html.setStyle(this.preview.domNode, 'height', h + 'px');

        var args = {
          config: config,
          featureSet: featureSet,
          layerDefinition: this._layerDefinition,
          resultLayer: null
        };
        this.preview.createCharts(args);
        this.tab.hideShelter();
        this.hideBigShelter();
      }), lang.hitch(this, function(err) {
        if(!this.domNode){
          return;
        }

        console.error(err);
        this.tab.hideShelter();
        this.hideBigShelter();
      }));
    },

    _queryFeatures: function(queryParams, url){
      var def = new Deferred();
      var queryTask = new QueryTask(url);
      queryTask.execute(queryParams).then(lang.hitch(this, function(featureSet){
        def.resolve(featureSet);
      }), lang.hitch(this, function(err){
        //maybe a joined layer
        if(err && err.code === 400){
          queryParams.outFields = ["*"];
          var queryTask2 = new QueryTask(url);
          queryTask2.execute(queryParams).then(lang.hitch(this, function(featureSet2){
            def.resolve(featureSet2);
          }), lang.hitch(this, function(err2){
            def.reject(err2);
          }));
        }else{
          def.reject(err);
        }
      }));
      return def;
    }

  });
});