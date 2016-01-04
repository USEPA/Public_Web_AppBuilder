define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/Deferred',
  'dojo/dom-geometry',
  'dojo/dom-style',
  'esri/request',
  'jimu/BaseWidget',
  'jimu/dijit/Message',
  'jimu/portalUtils',
  './PrintPlus',
  './_WidgetOpacityMixin/Mixin',  //lcs - Widget Opacity
  './_WidgetMetadataMixin/Mixin'  //lcs - Widget Metadata
], function(
  declare, 
  lang, 
  Deferred,
  domGeom, 
  domStyle, 
  esriRequest,
  BaseWidget, 
  Message,
  portalUtils,
  Print, 
  _WidgetOpacityMixin,  //lcs - Widget Opacity
  _WidgetMetadataMixin  //lcs - Widget Metadata
) {
    return declare([BaseWidget, _WidgetOpacityMixin, _WidgetMetadataMixin], {  //lcs - Widget Opacity, Metadata
      baseClass: 'jimu-widget-printplus',
      name: 'Print Plus',
      className: 'esri.widgets.Print',
      _portalPrintTaskURL: null,
      
      postCreate: function() {
        this._WidgetOpacityMixinPath = 'widgets/PrintPlus/_WidgetOpacityMixin';
        this._WidgetMetadataMixinPath = 'widgets/PrintPlus/_WidgetMetadataMixin';
        this.inherited(arguments);
      },
      
      startup: function() {
        this.inherited(arguments);
        this._initPrinter();
        domStyle.set(this.domNode.parentNode, {
          paddingLeft: '10px',
          paddingRight: '10px'
        });
      },
      
      _initPrinter: function() {
        this._getPrintTaskURL(this.appConfig.portalUrl).then(lang.hitch(this, function() {
          if (this.config && this.config.serviceURL) {
            this.config.serviceURL = this.config.serviceURL;
          } else if (this._portalPrintTaskURL) {
            this.config.serviceURL = this._portalPrintTaskURL;
          }

          var asyncDef = this.isAsync(this.config.serviceURL);
          asyncDef.then(lang.hitch(this, function(async) {
            this.print = new Print({
              map: this.map,
              appConfig: this.appConfig,
              printTaskURL: this.config.serviceURL,
              defaultAuthor: this.config.defaultAuthor,
              defaultCopyright: this.config.defaultCopyright,
              defaultTitle: this.config.defaultTitle,
              defaultFormat: this.config.defaultFormat,
              defaultLayout: this.config.defaultLayout,
              defaultDpi: this.config.defaultDpi || 96,
              noTitleBlockPrefix: this.config.noTitleBlockPrefix,
              layoutParams: this.config.layoutParams,
              relativeScale: this.config.relativeScale,
              relativeScaleFactor: this.config.relativeScaleFactor,
              scalePrecision: this.config.scalePrecision,
              mapScales: this.config.mapScales,
              outWkid: this.config.outWkid,
              showLayout: this.config.showLayout,
              showOpacitySlider: this.config.showOpacitySlider,
              domIdPrefix: this.id,
              reason: this.reason,
              nls: this.nls,
              async: async
            });
            this.print.placeAt(this.printPlusNode);
            // this.print.startup();  // This is not necessary, and causes the startup function to execute twice.
          }), lang.hitch(this, function(err) {
            new Message({
              message: err.message
            });
          }));
        }), lang.hitch(this, function(err) {
          new Message({
            message: err
          });
          console.error(err);
        }));
      },

      _getPrintTaskURL: function(portalUrl) {
        var printDef = new Deferred();
        var def = portalUtils.getPortalSelfInfo(portalUrl);
        def.then(lang.hitch(this, function(response) {
          this._portalPrintTaskURL = response.helperServices.printTask.url;
          if (this._portalPrintTaskURL) {
            printDef.resolve('success');
          }
        }), lang.hitch(this, function(err) {
          new Message({
            message: this.nls.portalConnectionError
          });
          printDef.reject('error');
          console.error(err);
        }));

        return printDef;
      },

      isAsync: function(serviceURL) {
        var def = new Deferred();
        esriRequest({
          url: serviceURL,
          content: {
            f: "json"
          },
          handleAs: "json",
          callbackParamName: 'callback',
          load: lang.hitch(this, function(response) {
            if (response.executionType === "esriExecutionTypeAsynchronous") {
              def.resolve(true);
            } else {
              def.resolve(false);
            }
          }),
          error: lang.hitch(this, function(err) {
            def.reject(err);
          })
        }/*, {
          useProxy: true
        }*/);

        return def;
      },

      onSignIn: function(user) {
        user = user || {};
        if (this.print && user.userId) {
          this.print.updateAuthor(user.userId);
        }
      },
      
      onOpen: function() {
        this.inherited(arguments);
        if (this.print) {
          this.print._onOpen();
        }
      },
      
      onClose: function() {
        this.inherited(arguments);
        this.print._onClose();
      },
      
      resize: function() {
        this.inherited(arguments);
        // If the widget is docked, its panel will have the same width as the innerWidth of the browser window.
        // Delay for a brief time to allow the panel to attain its full size.
        if (this.print) {
          setTimeout(lang.hitch(this, function() {
            var isDocked = this._isWidgetDocked();
            this.print._resize(isDocked);
          }), 100);
        }
      },

      _isWidgetDocked: function() {
        var node = this.getParent().domNode;
        var computedStyle = domStyle.getComputedStyle(node);
        var output = domGeom.getMarginBox(node, computedStyle);
        return Math.abs(window.innerWidth - output.w) <= 1;
      }
      
    });
  });
  
