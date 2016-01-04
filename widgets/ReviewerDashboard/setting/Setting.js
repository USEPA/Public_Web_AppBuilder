define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/query',
    'dojo/on',
    'jimu/dijit/Message',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    'esri/tasks/datareviewer/DashboardTask',
    'dijit/form/ValidationTextBox', 'dijit/form/RadioButton', 'dijit/form/NumberTextBox'
  ],
  function(
    declare, array, lang, query, on, Message,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting, Table, DashboardTask) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'drs-widget-dashboard-setting',
      startup: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
        this.own(on(this.includeGeoFilter, "change", lang.hitch(this, this._setFilterVisibility)));
      },
      setConfig: function(config) {
        this.config = config;
        if (config.drsSOEURL) {
          this.drsSOEURL.set('value', config.drsSOEURL);
        }
        if (config.numberChartSections) {
          this.chartDataSections.set('value', config.numberChartSections);
        }
        if (config.includeGeographicFilter === "true"){
          this.includeGeoFilter.set('checked', true);
        }
        else{
          this.includeGeoFilter.set('checked', false);
          this.showHideDynamicRows(false, this.geoFilterSettingsTable);
        }
        if (config.selectUrl) {
          this.selectUrl.set('value', config.selectUrl);
        }
        if (config.selectMapUrl) {
          this.selectMapUrl.set('value', config.selectMapUrl);
        }
        if (config.geometryServiceURL) {
          this.geometryServiceURL.set('value', config.geometryServiceURL);
        }
        var fields = [{
          name: 'isDefault',
          title: 'Default',
          type: 'radio',
          width:'100px'
        }, {
          name: 'isVisible',
          title: this.nls.visibleColumn,
          type: 'checkbox',
          'class': 'update',
          width: '100px'
        }, {
          name: 'dashboardFieldName',
          title: this.nls.fieldNameColumn,
          type: 'text',
          width:'300px'
        },  {
          name: 'alias',
          title: this.nls.aliasColumn,
          type: 'text',
          editable: 'true',
          width:'300px'
        }];
        var args = {
          fields: fields,
          selectable: false
        };
        this.displayFieldsTable = new Table(args);
        this.displayFieldsTable.placeAt(this.dashboardFieldNameInfos);
        this.displayFieldsTable.startup();
        this.getDashboardFieldInfos(config.drsSOEURL, config.dashboardFieldNames);
      },
      getDashboardFieldInfos:function(drsSOEURL, fieldInfos){
        var task = new DashboardTask(drsSOEURL);
        var result = task.getDashboardFieldNames();
        result.then(lang.hitch(this, function(response){
          //add lifecycle phase field Name. This will eventually come from server
          //doesnt need to be localized
          response.fieldNames.push("LIFECYCLEPHASE");
          for (var i = 0;i < response.fieldNames.length;i++){
            var fieldName = response.fieldNames[i];
            //do not show field name batchjob checkgroup
            if (fieldName.toLowerCase() !== "batchjobcheckgroup"){
              var isdefault = "", isVisible = "", aliasName = "", filteredArr;
              for (var j = 0; j < fieldInfos.length; j++ ){
                if (fieldInfos[j].dashboardFieldName === response.fieldNames[i]){
                  filteredArr = fieldInfos[j];
                  break;
                }
              }
              if ( filteredArr !== null && filteredArr !== undefined){
                isdefault = filteredArr.isDefault;
                isVisible = filteredArr.isVisible;
                aliasName = filteredArr.alias;
              }
              else{
                if (fieldInfos.length === 0){
                  if (fieldName.toLowerCase() === "severity"){
                    isdefault = true;
                  }
                }
              }
              this.displayFieldsTable.addRow({
                isDefault: (isdefault === "") ? false : isdefault,
                isVisible: (isVisible === "") ? true : isVisible,
                dashboardFieldName : fieldName,
                alias:(aliasName === "") ? fieldName : aliasName
              });
            }
          }
        }));
      },
      _onBtnSetSourceClicked: function(){
        this.displayFieldsTable.clear();
        this.getDashboardFieldInfos(this.drsSOEURL.value, []);
      },

      getConfig: function() {
        this.config.drsSOEURL = this.drsSOEURL.value;
        this.config.numberChartSections = this.chartDataSections.value;
        if (this.includeGeoFilter.checked){
          this.config.includeGeographicFilter = "true";
        }
        else{
          this.config.includeGeographicFilter = "false";
        }
        this.config.selectUrl = this.selectUrl.value;
        this.config.selectMapUrl = this.selectMapUrl.value;
        this.config.geometryServiceURL = this.geometryServiceURL.value;
        var data = this.displayFieldsTable.getData();
        //var len = this.featurelayers.length;
        this.config.dashboardFieldNames = [];

        var fieldInfos = [];
        var len = data.length;
        for (var i = 0; i < len; i++) {
          var field = {};
          field.dashboardFieldName = data[i].dashboardFieldName;
          field.alias = data[i].alias;
          field.isVisible = data[i].isVisible;
          field.isDefault = data[i].isDefault;
          fieldInfos.push(field);
        }
        //validations
        var visibleField = array.filter(fieldInfos, function(item){
          return item.isVisible === true ;
        });
        if (visibleField.length === 0){
          new Message({
            message: this.nls.selectFieldWarning
          });
          return false;
        }
        var defaultField = array.filter(fieldInfos, function(item){
          return item.isDefault === true ;
        });
        if (defaultField === null || defaultField.length === 0){
          new Message({
            message: this.nls.includeDefaultFieldName
          });
          return false;
        }
        if (defaultField.length > 0 && defaultField[0].isVisible === false){
          new Message({
            message: this.nls.defaultFieldNotVisible
          });
          return false;
        }
        this.config.dashboardFieldNames = fieldInfos;
        return this.config;
      },
      _setFilterVisibility: function(checked){
        var backButton = query(this.geoFilterSettings);
        if (checked){
          backButton.style({'display':'block'});
          this.showHideDynamicRows(true, this.geoFilterSettingsTable);
        }
        else{
          this.showHideDynamicRows(false, this.geoFilterSettingsTable);
        }
      },
      showHideDynamicRows:function(bShowHide, container){
        var dynamicRows = query('.dynamicRow', container);
        if(dynamicRows !== undefined && dynamicRows !== null && dynamicRows.length > 0){
          for(var i = 0; i < dynamicRows.length; i++){
            if(bShowHide){
              dynamicRows[i].style.display = '';
            }else {
              dynamicRows[i].style.display = 'none';
            }
          }
        }
      }
    });
  });