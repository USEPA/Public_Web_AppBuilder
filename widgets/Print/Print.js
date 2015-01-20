define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/form/Form',
  'dijit/form/Select',
  'dijit/form/ValidationTextBox',
  'dijit/form/NumberTextBox',
  'dijit/form/Button',
  'dijit/form/CheckBox',
  'dijit/ProgressBar',
  'dijit/form/DropDownButton',
  'dijit/TooltipDialog',
  'dijit/form/RadioButton',
  'esri/tasks/PrintTask',
  "esri/tasks/PrintParameters",
  "esri/tasks/PrintTemplate",
  "esri/request",
  'esri/IdentityManager',
  'dojo/store/Memory',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/dom-style',
  'dojo/dom-construct',
  'dojo/dom-class',
  'dojo/json',
  'jimu/portalUrlUtils',
  'dojo/text!./templates/Print.html',
  'dojo/text!./templates/PrintResult.html',
  'dojo/aspect',
  'jimu/dijit/LoadingShelter',
  'jimu/dijit/Message'
], function(
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  Form,
  Select,
  ValidationTextBox,
  NumberTextBox,
  Button,
  CheckBox,
  ProgressBar,
  DropDownButton,
  TooltipDialog,
  RadioButton,
  PrintTask,
  PrintParameters,
  PrintTemplate,
  esriRequest,
  IdentityManager,
  Memory,
  lang,
  array,
  domStyle,
  domConstruct,
  domClass,
  dojoJSON,
  portalUrlUtils,
  printTemplate,
  printResultTemplate,
  aspect,
  LoadingShelter,
  Message) {
  // Main print dijit
  var PrintDijit = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    widgetsInTemplate: true,
    templateString: printTemplate,
    map: null,
    count: 1,
    results: [],
    authorText: null,
    copyrightText: null,
    defaultTitle: null,
    defaultFormat: null,
    defaultLayout: null,
    baseClass: "gis_PrintDijit",
    pdfIcon: require.toUrl("./widgets/Print/images/pdf.png"),
    imageIcon: require.toUrl("./widgets/Print/images/image.png"),
    printTaskURL: null,
    printTask: null,
    async: false,
    postCreate: function() {
      this.inherited(arguments);
      var printParams = {
        async: this.async
      };
      var _handleAs = 'json';

      this.printTask = new PrintTask(this.printTaskURL, printParams);
      this.printparams = new PrintParameters();
      this.printparams.map = this.map;
      this.printparams.outSpatialReference = this.map.spatialReference;

      this.shelter = new LoadingShelter({
        hidden: true
      });
      this.shelter.placeAt(this.domNode);
      this.shelter.startup();
      this.shelter.show();

      this.titleNode.set('value', this.defaultTitle);
      this.authorNode.set('value', this.defaultAuthor);
      this.copyrightNode.set('value', this.defaultCopyright);

      var serviceUrl = portalUrlUtils.setHttpProtocol(this.printTaskURL);
      var portalNewPrintUrl = portalUrlUtils.getNewPrintUrl(this.appConfig.portalUrl);

      if (serviceUrl === portalNewPrintUrl ||
        /sharing\/tools\/newPrint$/.test(serviceUrl)) {
        _handleAs = 'text';
      }
      this._getPrintTaskInfo(_handleAs);

      if (this.printTask._getPrintDefinition) {
        aspect.after(
          this.printTask,
          '_getPrintDefinition',
          lang.hitch(this, 'printDefInspector'),
          false);
      }
      if (this.printTask._createOperationalLayers) {
        aspect.after(
          this.printTask,
          '_createOperationalLayers',
          lang.hitch(this, '_preventGraphicsLegend')
        );
      }
    },

    _getPrintTaskInfo: function(handle) {
      // portal own print url: portalname/arcgis/sharing/tools/newPrint
      esriRequest({
        url: this.printTaskURL,
        content: {
          f: "json"
        },
        callbackParamName: "callback",
        handleAs: handle || "json",
        timeout: 60000
      }).then(
        lang.hitch(this, '_handlePrintInfo'),
        lang.hitch(this, '_handleError')
      ).always(lang.hitch(this, function() {
        this.shelter.hide();
      }));
    },

    _preventGraphicsLegend: function(opLayers) {
      if (this.printTask.allLayerslegend) {
        var legendArray = this.printTask.allLayerslegend;
        var arr = [];
        for (var i = 0; i < legendArray.length; i++) {
          var layer = this.map.getLayer(legendArray[i].id);
          if (layer && layer.declaredClass && layer.declaredClass !== "esri.layers.GraphicsLayer") {
            arr.push(legendArray[i]);
          }
        }
        this.printTask.allLayerslegend = arr;
      }
      return opLayers;
    },

    printDefInspector: function(printDef) {
      //do what you want here then return the object.
      if (this.preserve.preserveScale === 'force') {
        printDef.mapOptions.scale = this.preserve.forcedScale;
      }
      return printDef;
    },

    _handleError: function(err) {
      console.log('print widget load error: ', err);
      new Message({
        message: err.message || err
      });
    },

    _handlePrintInfo: function(rData) {
      var data = null;
      try {
        if (typeof rData === 'string') {
          data = dojoJSON.parse(rData);
        } else {
          data = rData;
        }
        //{"error":{"code":499,"message":"Token Required","details":[]}}
        if (data.error && data.error.code) {
          this._getPrintTaskInfo('json');
          return;
        }
      } catch (err) {
        var serviceUrl = portalUrlUtils.setHttpProtocol(this.printTaskURL),
          portalNewPrintUrl = portalUrlUtils.getNewPrintUrl(this.appConfig.portalUrl);
        if (serviceUrl === portalNewPrintUrl ||
          /sharing\/tools\/newPrint$/.test(serviceUrl)) { // portal own print url
          domStyle.set(this.layoutDijit.domNode.parentNode.parentNode, 'display', 'none');
          domStyle.set(this.formatDijit.domNode.parentNode.parentNode, 'display', 'none');
          domStyle.set(this.advancedButtonDijit.domNode, 'display', 'none');
        } else {
          this._handleError(err);
        }
        return;
      }

      domStyle.set(this.layoutDijit.domNode.parentNode.parentNode, 'display', '');
      domStyle.set(this.formatDijit.domNode.parentNode.parentNode, 'display', '');
      domStyle.set(this.advancedButtonDijit.domNode, 'display', '');
      var Layout_Template = array.filter(data.parameters, function(param) {
        return param.name === "Layout_Template";
      });
      if (Layout_Template.length === 0) {
        console.log("print service parameters name for templates must be \"Layout_Template\"");
        return;
      }
      var layoutItems = array.map(Layout_Template[0].choiceList, function(item) {
        return {
          label: item,
          value: item
        };
      });
      layoutItems.sort(function(a, b) {
        return (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0);
      });
      this.layoutDijit.addOption(layoutItems);
      if (this.defaultLayout) {
        this.layoutDijit.set('value', this.defaultLayout);
      } else {
        this.layoutDijit.set('value', Layout_Template[0].defaultValue);
      }

      var Format = array.filter(data.parameters, function(param) {
        return param.name === "Format";
      });
      if (Format.length === 0) {
        console.log("print service parameters name for format must be \"Format\"");
        return;
      }
      var formatItems = array.map(Format[0].choiceList, function(item) {
        return {
          label: item,
          value: item
        };
      });
      formatItems.sort(function(a, b) {
        return (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0);
      });
      this.formatDijit.addOption(formatItems);
      if (this.defaultFormat) {
        this.formatDijit.set('value', this.defaultFormat);
      } else {
        this.formatDijit.set('value', Format[0].defaultValue);
      }
    },

    print: function() {
      if (this.printSettingsFormDijit.isValid()) {
        var form = this.printSettingsFormDijit.get('value');
        lang.mixin(form, this.layoutMetadataDijit.get('value'));
        this.preserve = this.preserveFormDijit.get('value');
        lang.mixin(form, this.preserve);
        this.layoutForm = this.layoutFormDijit.get('value');
        var mapQualityForm = this.mapQualityFormDijit.get('value');
        var mapOnlyForm = this.mapOnlyFormDijit.get('value');
        lang.mixin(mapOnlyForm, mapQualityForm);

        var template = new PrintTemplate();
        template.format = form.format;
        template.layout = form.layout;
        template.preserveScale = (form.preserveScale === 'true' || form.preserveScale === 'force');
        template.label = form.title;
        template.exportOptions = mapOnlyForm;
        template.layoutOptions = {
          authorText: form.author,
          copyrightText: form.copyright,
          legendLayers: (this.layoutForm.legend.length > 0 && this.layoutForm.legend[0]) ?
            null : [],
          titleText: form.title //,
            //scalebarUnit: this.layoutForm.scalebarUnit
        };
        this.printparams.template = template;
        this.printparams.extraParameters = { // come from source code of jsapi
          printFlag: true
        };
        var fileHandel = this.printTask.execute(this.printparams);

        var result = new printResultDijit({
          count: this.count.toString(),
          icon: (form.format === "PDF") ? this.pdfIcon : this.imageIcon,
          docName: form.title,
          title: form.format + ', ' + form.layout,
          fileHandle: fileHandel,
          nls: this.nls
        }).placeAt(this.printResultsNode, 'last');
        result.startup();
        domStyle.set(this.clearActionBarNode, 'display', 'block');
        this.count++;
      } else {
        this.printSettingsFormDijit.validate();
      }
    },

    clearResults: function() {
      domConstruct.empty(this.printResultsNode);
      domStyle.set(this.clearActionBarNode, 'display', 'none');
      this.count = 1;
    },

    updateAuthor: function(user) {
      user = user || '';
      if (user) {
        this.authorTB.set('value', user);
      }
    },

    getCurrentMapScale: function() {
      this.forceScaleNTB.set('value', this.map.getScale());
    }
  });

  // Print result dijit
  var printResultDijit = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    widgetsInTemplate: true,
    templateString: printResultTemplate,
    url: null,
    postCreate: function() {
      this.inherited(arguments);
      this.fileHandle.then(lang.hitch(this, '_onPrintComplete'), lang.hitch(this, '_onPrintError'));
    },
    _onPrintComplete: function(data) {
      if (data.url) {
        this.url = data.url;
        this.nameNode.innerHTML = '<span class="bold">' + this.docName + '</span>';
        domClass.add(this.resultNode, "printResultHover");
      } else {
        this._onPrintError(this.nls.printError);
      }
    },
    _onPrintError: function(err) {
      console.log(err);
      this.nameNode.innerHTML = '<span class="bold">' + this.nls.printError + '</span>';
      domClass.add(this.resultNode, "printResultError");
    },
    _openPrint: function() {
      if (this.url !== null) {
        window.open(this.url);
      }
    }
  });
  return PrintDijit;
});