define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'esri/tasks/PrintTask',
  "esri/tasks/PrintParameters",
  "esri/tasks/PrintTemplate",
  "esri/request",
  'esri/lang',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/dom-style',
  'dojo/dom-construct',
  'dojo/dom-class',
  'dojo/promise/all',
  'dojo/Deferred',
  'jimu/portalUrlUtils',
  'dojo/text!./templates/Print.html',
  'dojo/text!./templates/PrintResult.html',
  'dojo/aspect',
  'dojo/query',
  'jimu/LayerInfos/LayerInfos',
  'jimu/dijit/LoadingShelter',
  'jimu/dijit/Message',
  'jimu/utils',
  'dijit/form/ValidationTextBox',
  'dijit/form/Form',
  'dijit/form/Select',
  'dijit/form/NumberTextBox',
  'dijit/form/Button',
  'dijit/form/CheckBox',
  'dijit/ProgressBar',
  'dijit/form/DropDownButton',
  'dijit/TooltipDialog',
  'dijit/form/RadioButton',
  'esri/IdentityManager',
  'dojo/store/Memory'
], function(
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  PrintTask,
  PrintParameters,
  PrintTemplate,
  esriRequest,
  esriLang,
  lang,
  array,
  html,
  domStyle,
  domConstruct,
  domClass,
  all,
  Deferred,
  portalUrlUtils,
  printTemplate,
  printResultTemplate,
  aspect,
  query,
  LayerInfos,
  LoadingShelter,
  Message,
  utils,
  ValidationTextBox) {
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
      // var _handleAs = 'json';

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

      this.titleNode.set('value', utils.sanitizeHTML(this.defaultTitle));
      this.authorNode.set('value', utils.sanitizeHTML(this.defaultAuthor));
      this.copyrightNode.set('value', utils.sanitizeHTML(this.defaultCopyright));

      var serviceUrl = portalUrlUtils.setHttpProtocol(this.printTaskURL);
      var portalNewPrintUrl = portalUrlUtils.getNewPrintUrl(this.appConfig.portalUrl);
      this._isNewPrintUrl = serviceUrl === portalNewPrintUrl ||
        /sharing\/tools\/newPrint$/.test(serviceUrl);
      var scaleRadio = query('input', this.printWidgetMapScale.domNode)[0];
      var extentRadio = query('input', this.printWidgetMapExtent.domNode)[0];
      utils.combineRadioCheckBoxWithLabel(scaleRadio, this.printWidgetMapScaleLabel);
      utils.combineRadioCheckBoxWithLabel(extentRadio, this.printWidgetMapExtentLabel);

      LayerInfos.getInstance(this.map, this.map.itemInfo)
        .then(lang.hitch(this, function(layerInfosObj) {
          this.layerInfosObj = layerInfosObj;
          return all([this._getPrintTaskInfo(), this._getLayerTemplatesInfo()])
            .then(lang.hitch(this, function(results) {
              var taksInfo = results[0],
                templatesInfo = results[1];
              if (templatesInfo && !templatesInfo.error) {
                var parameters = templatesInfo && templatesInfo.results;
                if (parameters && parameters.length > 0) {
                  array.some(parameters, lang.hitch(this, function(p) {
                    return p && p.paramName === 'Output_JSON' ?
                      this.templateInfos = p.value : false;
                  }));
                  if (this.templateInfos && this.templateInfos.length > 0) {
                    this.templateNames = array.map(this.templateInfos, function(ti) {
                      return ti.layoutTemplate;
                    });
                  }
                }
              } else {
                console.warn('Get Layout Templates Info Error',
                  templatesInfo && templatesInfo.error);
              }
              if (!esriLang.isDefined(taksInfo) || (taksInfo && taksInfo.error)) {
                this._handleError(taksInfo.error);
              } else {
                this._handlePrintInfo(taksInfo);
              }
            }));
        })).always(lang.hitch(this, function() {
          this.shelter.hide();
        }));

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
          lang.hitch(this, '_excludeInvalidLegend')
        );
      }
    },

    _getPrintTaskInfo: function() {
      // portal own print url: portalname/arcgis/sharing/tools/newPrint
      var def = new Deferred();
      if (this._isNewPrintUrl) { // portal own print url
        def.resolve({
          isGPPrint: false
        });
      } else {
        esriRequest({
          url: this.printTaskURL,
          content: {
            f: "json"
          },
          callbackParamName: "callback",
          handleAs: "json",
          timeout: 60000
        }).then(lang.hitch(this, function(data) {
            def.resolve({
              isGPPrint: true,
              data: data
            });
          }), lang.hitch(this, function(err) {
            def.resolve({
              error: err
            });
          })
        );
      }

      return def;
    },

    _getLayerTemplatesInfo: function() {
      var def = new Deferred();
      var parts = this.printTaskURL.split('/');
      var pos = parts.indexOf('GPServer');
      if (pos > -1) {
        var url = null;
        if (/Utilities\/PrintingTools\/GPServer/.test(this.printTaskURL)) {
          url = parts.slice(0, pos + 1).join('/') + '/' +
            encodeURIComponent('Get Layout Templates Info Task') + '/execute';
        } else {
          url = parts.slice(0, pos + 1).join('/') + '/' +
            encodeURIComponent('Get Layout Templates Info') + '/execute';
        }
        esriRequest({
          url: url,
          content: {
            f: "json"
          },
          callbackParamName: "callback",
          handleAs: "json",
          timeout: 60000
        }).then(lang.hitch(this, function(info) {
          def.resolve(info);
        }), lang.hitch(this, function(err) {
          def.resolve({
            error: err
          });
        }));
      } else {
        def.resolve(null);
      }

      return def;
    },

    _excludeInvalidLegend: function(opLayers) {
      function getSubLayerIds(legendLayer) {
        return array.filter(legendLayer.subLayerIds, lang.hitch(this, function(subLayerId) {
          var subLayerInfo = this.layerInfosObj.getLayerInfoById(legendLayer.id + '_' + subLayerId);
          return subLayerInfo && subLayerInfo.getShowLegendOfWebmap();
        }));
      }

      if (this.printTask.allLayerslegend) {
        var legendArray = this.printTask.allLayerslegend;
        var arr = [];
        for (var i = 0; i < legendArray.length; i++) {
          var legendLayer = legendArray[i];
          var layer = this.map.getLayer(legendLayer.id);
          var layerInfo = this.layerInfosObj.getLayerInfoById(legendLayer.id);
          var validLayerType = layer && layer.declaredClass &&
            layer.declaredClass !== "esri.layers.GraphicsLayer";
          var validRenderer = !layer.renderer ||
            (layer.renderer && !layer.renderer.hasVisualVariables());
          var showLegendInMap = layerInfo && layerInfo.getShowLegendOfWebmap();
          if (validLayerType && validRenderer && showLegendInMap) {
            if (legendLayer.subLayerIds) {
              legendLayer.subLayerIds = lang.hitch(this, getSubLayerIds, legendLayer)();
            }

            arr.push(legendLayer);
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

    onLayoutChange: function(newValue) {
      var pos = this.templateNames && this.templateNames.indexOf(newValue);
      if (pos > -1) {
        html.empty(this.customTextElementsTable);
        var templateInfo = this.templateInfos[pos];
        var customTextElements = templateInfo && templateInfo.layoutOptions &&
          templateInfo.layoutOptions.customTextElements;
        if (customTextElements && customTextElements.length > 0) {
          array.forEach(customTextElements, lang.hitch(this, function(cte) {
            for (var p in cte) {
              var row = this.customTextElementsTable.insertRow(-1);
              var cell0 = row.insertCell(-1);
              cell0.appendChild(html.toDom(p + ': '));
              var cell1 = row.insertCell(-1);
              cell1.appendChild((new ValidationTextBox({
                name: p,
                trim: true,
                required: false,
                value: cte[p],
                style: 'width:100%'
              })).domNode);
            }
          }));
        }
      }
    },

    _handlePrintInfo: function(rData) {
      if (!rData.isGPPrint) {
        domStyle.set(this.layoutDijit.domNode.parentNode.parentNode, 'display', 'none');
        domStyle.set(this.formatDijit.domNode.parentNode.parentNode, 'display', 'none');
        domStyle.set(this.advancedButtonDijit.domNode, 'display', 'none');
      } else {
        var data = rData.data;
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

        var elementsObj = this.customTextElementsDijit.get('value');
        var cteArray = [];
        for (var p in elementsObj) {
          var cte = {};
          cte[p] = elementsObj[p];
          cteArray.push(cte);
        }

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
          titleText: form.title,
          customTextElements: cteArray
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
      if (user && this.authorTB) {
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
        html.setStyle(this.progressBar.domNode, 'display', 'none');
        html.setStyle(this.successNode, 'display', 'inline-block');
        domClass.add(this.resultNode, "printResultHover");
      } else {
        this._onPrintError(this.nls.printError);
      }
    },
    _onPrintError: function(err) {
      console.log(err);
      html.setStyle(this.progressBar.domNode, 'display', 'none');
      html.setStyle(this.errNode, 'display', 'block');
      domClass.add(this.resultNode, "printResultError");

      html.setAttr(this.domNode, 'title', err.details || err.message || "");
    },
    _openPrint: function() {
      if (this.url !== null) {
        window.open(this.url);
      }
    }
  });
  return PrintDijit;
});