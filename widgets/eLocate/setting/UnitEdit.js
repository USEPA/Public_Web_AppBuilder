/*global define*/
define(
  ['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/dom-style',
  'dojo/on',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'dojo/text!./UnitEdit.html',
  'dijit/form/TextBox',
  'dijit/form/RadioButton',
  'jimu/SpatialReference/utils',
  'dijit/registry'
  ],
  function(
    declare,
    lang,
    domStyle,
    on,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    template,
    TextBox,
    RadioButton,
    utils,
    registry) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'unit-edit',
      templateString: template,
      config:null,
      tr:null,
      popup: null,
      adding: false,
      currentWkid: null,
      wgs84Opt: null,

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        if(!this.config){
          this.popup.disableButton(0);
        }
        this._setConfig(this.config);
        registry.byId("radioOne").on("change", lang.hitch(this, function(isChecked){
          if(isChecked){
            this.wgs84Opt = "dd";
          }
        }));

        registry.byId("radioTwo").on("change", lang.hitch(this, function(isChecked){
          if(isChecked){
            this.wgs84Opt = "dms";
          }
        }));

        registry.byId("radioThree").on("change", lang.hitch(this, function(isChecked){
          if(isChecked){
            this.wgs84Opt = "dm";
          }
        }));

        registry.byId("radioFour").on("change", lang.hitch(this, function(isChecked){
          if(isChecked){
            this.wgs84Opt = "ddm";
          }
        }));
      },

      getConfig: function(){
        var fwgs84Opt;
        if(this.currentWkid === 4326){
          fwgs84Opt = this.wgs84Opt;
        }else{
          fwgs84Opt = '';
        }
        var config = {
          wkid: utils.standardizeWkid(this.wkid.get('value')),
          name: this.unitnameTB.get('value'),
          example: this.unitExampleTB.get('value'),
          xlabel: this.unitXLabelTB.get('value'),
          ylabel: this.unitYLabelTB.get('value'),
          wgs84option: fwgs84Opt
        };
        this.config = config;
        return [this.config, this.tr];
      },

      _setConfig: function(config) {
        this._config = lang.clone(config);

        utils.loadResource().then(lang.hitch(this, function() {
          if (config && config.wkid) {
            this.wkid.set('value', parseInt(config.wkid, 10));
            this.currentWkid = parseInt(config.wkid, 10);
            this.unitnameTB.set('value', lang.trim(this.config.name));
            this.unitExampleTB.set('value', lang.trim(this.config.example));
            this.unitXLabelTB.set('value', lang.trim(this.config.xlabel));
            this.unitYLabelTB.set('value', lang.trim(this.config.ylabel));
            if(this.currentWkid === 4326){
              //select wgs option
              switch(this.config.wgs84option){
                case 'dd': {
                  registry.byId("radioOne").set('checked', true);
                  this.wgs84Opt = 'dd';
                  break;
                }
                case 'dms': {
                  registry.byId("radioTwo").set('checked', true);
                  this.wgs84Opt = 'dms';
                  break;
                }
                case 'dm': {
                  registry.byId("radioThree").set('checked', true);
                  this.wgs84Opt = 'dm';
                  break;
                }
                case 'ddm': {
                  registry.byId("radioFour").set('checked', true);
                  this.wgs84Opt = 'ddm';
                  break;
                }
              }
            }
          }
        }), lang.hitch(this, function(err) {
          console.error(err);
        }));
      },

      onWkidChange: function(newValue) {
        var label = "",
          newWkid = parseInt(newValue, 10);

        this.popup.disableButton(0);

        if (utils.isValidWkid(newWkid)) {
          label = utils.getSRLabel(newWkid);
          this.wkidLabel.innerHTML = label;
          if(this.unitnameTB.get('value') === ""){
            this.unitnameTB.set('value', label.split("_").join(" "));
          }
          if(this.unitXLabelTB.get('value') === ""){
            if(utils.isGeographicCS(newWkid)){
              this.unitXLabelTB.set('value', this.nls.geox);
            }else{
              this.unitXLabelTB.set('value', this.nls.projx);
            }
          }
          if(this.unitYLabelTB.get('value') === ""){
            if(utils.isGeographicCS(newWkid)){
              this.unitYLabelTB.set('value', this.nls.geoy);
            }else{
              this.unitYLabelTB.set('value', this.nls.projy);
            }
          }
          this.popup.enableButton(0);
          if(newWkid === 4326){
            domStyle.set(this.unitWkid4326Ops1, 'display', '');
            domStyle.set(this.unitWkid4326Ops2, 'display', '');
          }else{
            domStyle.set(this.unitWkid4326Ops1, 'display', 'none');
            domStyle.set(this.unitWkid4326Ops2, 'display', 'none');
          }
        } else if (newValue) {
          this.wkid.set('value', "");
          this.wkidLabel.innerHTML = this.nls.cName;
          domStyle.set(this.unitWkid4326Ops1, 'display', 'none');
          domStyle.set(this.unitWkid4326Ops2, 'display', 'none');
        }
        this.currentWkid = newWkid;
      }
    });
  });
