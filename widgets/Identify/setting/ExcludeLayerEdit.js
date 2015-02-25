/*global define*/
define(
  ['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/on',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'dojo/text!./ExcludeLayerEdit.html',
  'jimu/dijit/ServiceURLInput',
  'dijit/form/ValidationTextBox'
  ],
  function(
    declare,
    lang,
    html,
    on,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    template,
    ServiceURLInput,
    ValidationTextBox) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'exclude-layer-edit',
      templateString: template,
      config:null,
      tr:null,
      popup: null,
      _url: '',
      _furl: '',

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        if(!this.config){
          this.popup.disableButton(0);
        }
        this._bindEvents();
        this._setConfig(this.config);
      },

      getConfig: function(){
        var indx = this._url.lastIndexOf('/');
        var fUrl;
        var fId = parseInt(this._url.substring(indx + 1, this._url.length));
        if(!isNaN(fId)){
          fUrl = this._url.substring(0, indx);
        }else{
          fUrl = this._url;
        }
        var config = {};
        if(lang.trim(this.layerName.get('value'))){
          config.name = lang.trim(this.layerName.get('value'));
        }
        if(fUrl){
          config.url = fUrl;
        }
        if(!isNaN(fId)){
          config.id = fId;
        }

        this.config = config;
//        console.info(this.config);
        return [this.config, this.tr];
      },

      _setConfig: function(config) {
        this.config = config;
        if (!this.config) {
          return;
        }
        if(this.config.url){
          if(this.config.url.substring(this.config.url.length,1) === '/'){
            this._furl = lang.trim(this.config.url);
            if(this.config.hasOwnProperty('id')){
              this._furl += this.config.id;
            }
          }else{
            this._furl = lang.trim(this.config.url);
            if(this.config.hasOwnProperty('id')){
              this._furl += '/' + this.config.id;
            }
          }
        }else{
          this.layerUrl.proceedValue = false;
          this._furl = '';
        }

        this._url = this._furl;
        this.layerUrl.set('value', this._url);
        if(this.config.name){
          this.layerName.set('value', lang.trim(this.config.name));
          this.layerName.proceedValue = true;
        }else{
          this.layerName.proceedValue = false;
        }
      },

      _bindEvents: function () {
        this.own(on(this.layerName, 'change', lang.hitch(this, this._checkProceed)));
        this.own(on(this.layerUrl, 'change', lang.hitch(this, this._checkProceed)));
      },

      _checkProceed: function() {
        this.layerName.proceedValue = false;
        this.layerUrl.proceedValue = false;
        if(this.layerName.get('value') !== ''){
          this.layerName.proceedValue = true;
        }
        if(this.layerUrl.get('value') !== ''){
          this.layerUrl.proceedValue = true;
          this._url = this.layerUrl.get('value');
        }
        var errormessage = '';
        var canProceed = false;
        html.setAttr(this.errorMessage, 'innerHTML', '');
        if (this.layerName.proceedValue) {
          canProceed = true;
        }
        if (this.layerUrl.proceedValue) {
          canProceed = true;
        }
        if (this.layerName.proceedValue && this.layerUrl.proceedValue) {
          canProceed = false;
          errormessage = this.nls.excludeerrormsg;
        }
        if (canProceed) {
          this.popup.enableButton(0);
        } else {
          this.popup.disableButton(0);
          if (errormessage) {
            html.setAttr(this.errorMessage, 'innerHTML', errormessage);
          }
        }
      }
    });
  });
