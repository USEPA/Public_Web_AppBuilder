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
    "dojo/text!./SpatialRelationshipsEdit.html"
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
      baseClass: "spatial-relationship-edit",
      templateString: template,
      _spatialrelationship: [{
        "name": "esriSpatialRelContains",
        "label": "entirely contained in"
      },{
        "name": "esriSpatialRelIntersects",
        "label": "intersected by"
      },{
        "name": "esriSpatialRelEnvelopeIntersects",
        "label": "intersected by envelope of"
      },{
        "name": "esriSpatialRelCrosses",
        "label": "crosses over"
      },{
        "name": "esriSpatialRelIndexIntersects",
        "label": "index intersected by"
      },{
        "name": "esriSpatialRelOverlaps",
        "label": "overlaped by"
      },{
        "name": "esriSpatialRelTouches",
        "label": "touched by"
      },{
        "name": "esriSpatialRelWithin",
        "label": "within"
      }],
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
        this._initSpatRelTable();
      },

      _initSpatRelTable:function(){
        this.SpatialRelationshipTable.clear();
        this.SpatialRelationshipTable.on('row-click', lang.hitch(this, function(){
          this._checkSelections();
        }));
        var spatRels = this.config;
        console.info(this.config);
        array.forEach(this._spatialrelationship, lang.hitch(this, function(spatialRel) {
          var args = {
            config:spatialRel,
            exists: this._inArray(spatRels, spatialRel.name)
          };
          this._createSpatialRelationship(args);
        }));
      },

      _inArray:function(array, name){
        for(var i=0;i<array.length;i++) {
          if(array[i].name === name){
            return true;
          }
        }
        return false;
      },

      _checkSelections: function(){
        var trs = this.SpatialRelationshipTable.getRowDataArrayByFieldValue("add",true);
        if(trs.length === 0){
          this.popup.disableButton(0);
        }else{
          this.popup.enableButton(0);
        }
      },

      _createSpatialRelationship:function(args){
        args.searchSetting = this;
        args.nls = this.nls;
        var rowData = {
          add: args.exists,
          label: (args.config && args.config.label)||'',
          name: (args.config && args.config.name)||''
        };
        var result = this.SpatialRelationshipTable.addRow(rowData);
        if(!result.success){
          return null;
        }
        return result.tr;
      },

      getConfig: function() {
        var trs = this.SpatialRelationshipTable.getRowDataArrayByFieldValue("add",true);
        var allSpatRels = array.map(trs,lang.hitch(this,function(item){
          delete item.add;
          return item;
        }));
        return allSpatRels;
      }
    });
  });
