/*global define*/
define(
  ['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/on',
    'dojo/dom-style',
    'dojo/dom-attr',
    'dojo/query',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/registry',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/Message',
    'dojo/text!./FieldFormatEdit.html',
    'dijit/form/NumberSpinner',
    'jimu/dijit/CheckBox',
    'dijit/form/FilteringSelect',
    'dijit/form/ValidationTextBox'
  ],
  function(
    declare,
    lang,
    array,
    html,
    on,
    domStyle,
    domAttr,
    query,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    registry,
    BaseWidgetSetting,
    Message,
    template
    ){
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-Identify-Field-Format-Edit',
      templateString: template,
      formatString: '',
      formatArray: null,
      returnfieldInfo: null,
      tr: null,

      postCreate: function(){
        this.inherited(arguments);
        this.dateFormat.set('disabled', true);
        this.percisionSpinner.set('disabled', true);
        this.percisionSymbol.set('disabled', true);
        this.thousandsSymbol.set('disabled', true);
        this.currencyCbx.set('status', false);
        this.currencySymboltxt.set('disabled', true);
        this.percisionCbx.onChange = lang.hitch(this, '_onPercisionCbxChange');
        this.currencyCbx.onChange = lang.hitch(this, '_onCurrencyCbxChange');
        this.useThousandsCbx.onChange = lang.hitch(this, '_onUseThousandsCbxChange');
        this.own(on(this.selectDateFormat, 'change', lang.hitch(this, '_onSelectDateFormatChange')));
        if (this.popup){
          this.popup.enableButton(0);
        }
      },

      setConfig: function(fieldInfo){
        console.info(fieldInfo);
        this.returnfieldInfo = fieldInfo;
        if(fieldInfo.isdate || this._isDateType(fieldInfo.type)){
          var numerics = query('.numeric', this.inputTable);
          array.forEach(numerics, function(tr) {
            domStyle.set(tr, 'display', 'none');
          });
          //need to search the selectDateFormat for a match to the dateformat if there is one else switch to custom
          if (fieldInfo.dateformat){
            this.formatString = fieldInfo.dateformat;
            var store = this.selectDateFormat.store;
            store.fetch({
              query: {name: '*'},
              onComplete: lang.hitch(this, function(items){
                if (array.some(items, function (item){ return item.value === fieldInfo.dateformat; })){
                  this.selectDateFormat.set('value', fieldInfo.dateformat);
                } else {
                  this.selectDateFormat.set('value', this.nls.custom);
                  this.dateFormat.set('value', fieldInfo.dateformat);
                }
              })
            });
          } else {
            this.selectDateFormat.set('value', 'd MMM yyyy');
            this.dateFormat.set('value', 'd MMM yyyy');
          }
          this.utcCbx.setValue(fieldInfo.useutc || false);
        }else if (fieldInfo.isnumber || this._isNumberType(fieldInfo.type)){
          var dates = query('.date', this.inputTable);
          array.forEach(dates, function(tr) {
            domStyle.set(tr, 'display', 'none');
          });
          this.currencyCbx.set('status', true);
          this.currencyCbx.set('disabled', false);
          if(fieldInfo.currencyformat){
            this.formatString = fieldInfo.currencyformat;
            this.formatArray = this.formatString.split('|');
            this.currencyCbx.setValue(true);
            this.currencySymboltxt.set('disabled', false);
            this.currencySymboltxt.set('value', this.formatArray[0]);
            if (this.formatArray[1]){
              this.percisionSpinner.set('disabled', false);
              this.percisionCbx.setValue(true);
              this.percisionSpinner.set('value', parseInt(this.formatArray[1]));
            }
            if (this.formatArray[3]){
              this.percisionSymbol.set('disabled', false);
              this.percisionSymbol.set('value', this.formatArray[3]);
            }
            if (this.formatArray[2]){
              this.useThousandsCbx.setValue(true);
              this.thousandsSymbol.set('disabled', false);
              this.thousandsSymbol.set('value', this.formatArray[2]);
            }
          }else if (fieldInfo.numberformat){
            this.formatString = fieldInfo.numberformat;
            this.formatArray = this.formatString.split('|');
            this.currencyCbx.set('disabled', true);
            this.currencySymboltxt.set('disabled', true);
            //this.percisionSpinner.set('value', parseInt(this.formatArray[0]));
            //this.percisionSymbol.set('value', this.formatArray[2]);
            //this.thousandsSymbol.set('value', this.formatArray[1]);
            if (this.formatArray[0] !== ''){
              this.percisionSpinner.set('disabled', false);
              this.percisionCbx.setValue(true);
              this.percisionSpinner.set('value', parseInt(this.formatArray[0]));
            }
            if (this.formatArray[1]){
              this.useThousandsCbx.setValue(true);
              this.thousandsSymbol.set('disabled', false);
              this.thousandsSymbol.set('value', this.formatArray[1]);
            }
            if (this.formatArray[2]){
              this.percisionSymbol.set('disabled', false);
              this.percisionSymbol.set('value', this.formatArray[2]);
            }
          }
        }
      },

      _isNumberType:function(type){
        var numberTypes = ['esriFieldTypeOID',
                           'esriFieldTypeSmallInteger',
                           'esriFieldTypeInteger',
                           'esriFieldTypeSingle',
                           'esriFieldTypeDouble'];
        return array.indexOf(numberTypes,type) >= 0;
      },

      _isDateType:function(type){
        var dateTypes = ['esriFieldTypeDate'];
        return array.indexOf(dateTypes,type) >= 0;
      },

      getConfig: function(){
        if(this.returnfieldInfo.isdate || this._isDateType(this.returnfieldInfo.type)){
          if(this.selectDateFormat.get('value') === this.nls.custom){
            this.returnfieldInfo.dateformat = this.dateFormat.get('value');
          }else{
            this.returnfieldInfo.dateformat = this.selectDateFormat.get('value');
          }
          if(this.utcCbx.getValue()){
            this.returnfieldInfo.useutc = true;
          }
        }else if (this.returnfieldInfo.isnumber || this._isNumberType(this.returnfieldInfo.type)){
          var currencyformat = '';
          var numberformat = '';
          if(this.currencyCbx.getValue()){
            currencyformat += this.currencySymboltxt.get('value') + '|';
            if(this.percisionCbx.getValue()){
              currencyformat += this.percisionSpinner.get('value').toString() + '|';
            }else{
              currencyformat += '|';
            }
            if(this.useThousandsCbx.getValue()){
              currencyformat += this.thousandsSymbol.get('value') + '|';
            }else{
              currencyformat += '|';
            }
            if(this.percisionCbx.getValue()){
              currencyformat += this.percisionSymbol.get('value');
            }
            this.returnfieldInfo.currencyformat = currencyformat;
          }else{
            if(this.percisionCbx.getValue()){
              numberformat += this.percisionSpinner.get('value').toString() + '|';
            }else{
              numberformat += '|';
            }
            if(this.useThousandsCbx.getValue()){
              numberformat += this.thousandsSymbol.get('value') + '|';
            }else{
              numberformat += '|';
            }
            if(this.percisionCbx.getValue()){
              numberformat += this.percisionSymbol.get('value');
            }
            this.returnfieldInfo.numberformat = numberformat;
          }
        }
        return this.returnfieldInfo;
      },

      _onPercisionCbxChange: function(){
        var pcbx = this.percisionCbx.getValue();
        this.percisionSpinner.set('disabled', !pcbx);
        this.percisionSymbol.set('disabled', !pcbx);
      },

      _onCurrencyCbxChange: function(){
        var ccbxv = this.currencyCbx.getValue();
        this.currencySymboltxt.set('disabled', !ccbxv);
      },

      _onUseThousandsCbxChange: function(){
        var utcbx = this.useThousandsCbx.getValue();
        this.thousandsSymbol.set('disabled', !utcbx);
      },

      _onSelectDateFormatChange: function(){
        if(this.selectDateFormat.get('value') === this.nls.custom){
          if(!this.returnfieldInfo.dateformat){
            this.dateFormat.set('value', this.nls.friendlyDatePattern);
          }
          this.dateFormat.set('disabled', false);
        } else {
          this.dateFormat.set('value', this.selectDateFormat.get('value'));
          if (!this.dateFormat.disabled){
            this.dateFormat.set('disabled', true);
          }
        }
      }
    });
  });
