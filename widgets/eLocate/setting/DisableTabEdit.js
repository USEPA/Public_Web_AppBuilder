///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define, console*/
define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "jimu/BaseWidgetSetting",
    "jimu/dijit/Message",
    "dojo/text!./DisableTabEdit.html"
  ],
  function(
    declare,
    lang,
    array,
    on,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Message,
    template) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: "disable-tabs-edit",
      templateString: template,
      _taboptions: null,
      config:null,

      postCreate: function() {
        this.inherited(arguments);
        this._setConfig(this.config);
      },

      startup: function() {
        this.inherited(arguments);
      },

      _setConfig: function(config) {
        this.config = config;
        if(!this.config){
          return;
        }
        this._taboptions = [{
          "name": "address",
          "label": this.nls.addresslabel
        },{
          "name": "coordinate",
          "label": this.nls.coordslabel
        },{
          "name": "reverse",
          "label": this.nls.addressinsplabel
        },{
          "name": "result",
          "label": this.nls.resultslabel
        }];
        this._initDiasableTabsTable();
      },

      _initDiasableTabsTable:function(){
        this.DisableTabsTable.clear();
        this.DisableTabsTable.on('row-click', lang.hitch(this, function(){
          this._checkSelections();
        }));
        var disTabs = this.config;
        array.forEach(this._taboptions, lang.hitch(this, function(disTab) {
          var args = {
            config: disTab,
            exists: this._inArray(disTabs, disTab.name)
          };
          this._createDisableTab(args);
        }));
      },

      _inArray:function(array, name){
        for(var i=0;i<array.length;i++) {
          if(array[i] === name){
            return true;
          }
        }
        return false;
      },

      _checkSelections: function(){
        var trs = this.DisableTabsTable.getRowDataArrayByFieldValue("add",true);
        if(trs.length === 4){
          this.popup.disableButton(0);
        }else{
          this.popup.enableButton(0);
        }
      },

      _createDisableTab:function(args){
        args.searchSetting = this;
        args.nls = this.nls;
        var rowData = {
          add: args.exists,
          label: (args.config && args.config.label)||'',
          name: (args.config && args.config.name)||''
        };
        var result = this.DisableTabsTable.addRow(rowData);
        if(!result.success){
          return null;
        }
        return result.tr;
      },

      getConfig: function() {
        var trs = this.DisableTabsTable.getRowDataArrayByFieldValue("add",true);
        var disArr = [];
        array.map(trs,lang.hitch(this,function(item){
          disArr.push(item.name);
        }));
        return disArr;
      }
    });
  });
