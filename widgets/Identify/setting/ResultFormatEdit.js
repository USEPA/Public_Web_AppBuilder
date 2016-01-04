/*global define*/
define(
  ['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/on',
    'dojo/_base/Color',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/Message',
    'dojo/text!./ResultFormatEdit.html',
    'jimu/dijit/ColorPicker',
    './FormatBtns',
    'dojo/dom-attr',
    'dojo/dom-style'
  ],
  function(
    declare,
    lang,
    array,
    html,
    on,
    Color,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Message,
    template,
    ColorPicker,
    FormatBtns,
    domAttr,
    domStyle
    ) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'result-format-edit',
      templateString: template,
      config: null,
      nls: null,
      _format: null,

      postCreate: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      startup: function() {
        this.inherited(arguments);
      },

      _initFormatButtons: function() {
        var args = {
          nls: this.nls,
          bold: this._format.attTitlesymbol.bold,
          italic: this._format.attTitlesymbol.italic,
          underline: this._format.attTitlesymbol.underline
        };
        this.fbuttons = new FormatBtns(args);
        this.fbuttons.placeAt(this.formatButtonsTD);
        on(this.fbuttons, 'onBold', lang.hitch(this, function(isBold){
          this._format.attTitlesymbol.bold = isBold;
          if(isBold){
            domStyle.set(this.titleText, 'font-weight', 'bold');
          }else{
            domStyle.set(this.titleText, 'font-weight', 'normal');
          }
        }));
        on(this.fbuttons, 'onItalic', lang.hitch(this, function(isItalic){
          this._format.attTitlesymbol.italic = isItalic;
          if(isItalic){
            domStyle.set(this.titleText, 'font-style', 'italic');
          }else{
            domStyle.set(this.titleText, 'font-style', 'normal');
          }
        }));
        on(this.fbuttons, 'onUnderline', lang.hitch(this, function(isUnderline){
          this._format.attTitlesymbol.underline = isUnderline;
          if(isUnderline){
            domStyle.set(this.titleText, 'text-decoration', 'underline');
          }else{
            domStyle.set(this.titleText, 'text-decoration', 'none');
          }
        }));
        var args2 = {
          nls: this.nls,
          bold: this._format.attValuesymbol.bold,
          italic: this._format.attValuesymbol.italic,
          underline: this._format.attValuesymbol.underline
        };
        this.fbuttons2 = new FormatBtns(args2);
        this.fbuttons2.placeAt(this.formatButtonsTD2);
        on(this.fbuttons2, 'onBold', lang.hitch(this, function(isBold){
          this._format.attValuesymbol.bold = isBold;
          if(isBold){
            domStyle.set(this.valueText, 'font-weight', 'bold');
          }else{
            domStyle.set(this.valueText, 'font-weight', 'normal');
          }
        }));
        on(this.fbuttons2, 'onItalic', lang.hitch(this, function(isItalic){
          this._format.attValuesymbol.italic = isItalic;
          if(isItalic){
            domStyle.set(this.valueText, 'font-style', 'italic');
          }else{
            domStyle.set(this.valueText, 'font-style', 'normal');
          }
        }));
        on(this.fbuttons2, 'onUnderline', lang.hitch(this, function(isUnderline){
          this._format.attValuesymbol.underline = isUnderline;
          if(isUnderline){
            domStyle.set(this.valueText, 'text-decoration', 'underline');
          }else{
            domStyle.set(this.valueText, 'text-decoration', 'none');
          }
        }));
      },

      setConfig:function(config){
        this.config = config;
        if(!this.config){
          return;
        }
        if(!this.config.resultFormat){
          this._format = {
            "attTitlesymbol": {
              "bold": false,
              "italic": true,
              "underline": false,
              "color": [
                0,
                0,
                0,
                255
              ]
            },
            "attValuesymbol": {
              "bold": false,
              "italic": false,
              "underline": false,
              "color": [
                0,
                0,
                0,
                255
              ]
            }
          };
        }else{
          this._format = this.config.resultFormat;
        }
        this._initFormatButtons();
        if(this._format.attTitlesymbol.bold){
          domStyle.set(this.titleText, 'font-weight', 'bold');
        }
        if(this._format.attTitlesymbol.italic){
          domStyle.set(this.titleText, 'font-style', 'italic');
        }
        if(this._format.attTitlesymbol.underline){
          domStyle.set(this.titleText, 'text-decoration', 'underline');
        }
        if(this._format.attValuesymbol.bold){
          domStyle.set(this.valueText, 'font-weight', 'bold');
        }
        if(this._format.attValuesymbol.italic){
          domStyle.set(this.valueText, 'font-style', 'italic');
        }
        if(this._format.attValuesymbol.underline){
          domStyle.set(this.valueText, 'text-decoration', 'underline');
        }
        this.titleColor.setColor(new Color(this._format.attTitlesymbol.color || [0,0,0]));
        this.valueColor.setColor(new Color(this._format.attValuesymbol.color || [0,0,0]));
        domAttr.set(this.titleText, 'color', this.titleColor.getColor().toHex());
        domAttr.set(this.valueText, 'color', this.valueColor.getColor().toHex());
        this.titleColor.onChange = lang.hitch(this, this._titleColorChange);
        this.valueColor.onChange = lang.hitch(this, this._valueColorChange);
      },

      _titleColorChange: function(newColor) {
        this._format.attTitlesymbol.color = newColor.toRgba();
        domAttr.set(this.titleText, 'color', newColor.toHex());
      },

      _valueColorChange: function(newColor) {
        this._format.attValuesymbol.color = newColor.toRgba();
        domAttr.set(this.valueText, 'color', newColor.toHex());
      },

      getConfig: function() {
        var config = {
          format: this._format
        };

        this.config = config;
        return this.config;
      }
    });
  });
