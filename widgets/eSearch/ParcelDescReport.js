///////////////////////////////////////////////////////////////////////////
// Parcel Description Report Dijit
// By: Robert Scheitlin
///////////////////////////////////////////////////////////////////////////
/*jslint maxlen: 800 */
define(['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    'dojo/has',
    './MobilePopup',
    'dojo/text!./templates/ParcelDescReport.html',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/dom-attr',
    'dojo/_base/array',
    'esri/tasks/PrintTemplate',
    'esri/tasks/PrintParameters',
    'esri/tasks/PrintTask',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/renderers/SimpleRenderer',
    'esri/layers/GraphicsLayer',
    'esri/graphic',
    'esri/Color',
    'esri/geometry/Point',
    'jimu/dijit/LoadingShelter',
    'dojo/sniff'
  ],
  function(declare, lang, html, on, has, MobilePopup, trTemplate, dom, domConstruct, domClass, domStyle, domAttr, array,
            PrintTemplate, PrintParameters, PrintTask, SimpleFillSymbol,SimpleMarkerSymbol, SimpleLineSymbol, SimpleRenderer,
            GraphicsLayer, Graphic, Color, Point) {
    return declare(MobilePopup, {
      //summary:
      //  show the Parcel Description Report

      baseClass: 'jimu-popup jimu-message',
      declaredClass: 'parcel.dijit.parcel.description.report',
      json: null,
      map: null,
      layer: null,
      folderurl: null,
      autoHeight: false,
      maxWidth: 840,
      maxHeight: 800,
      gl:null,

      postMixInProperties: function() {
        this.content = trTemplate;
      },

      ReFormatParcelNum: function (pPNum) {
        return pPNum.substr(0, 2) + "-" + pPNum.substr(2, 2) + "-" + pPNum.substr(4, 2) + "-" +
          pPNum.substr(6, 1) + "-" + pPNum.substr(7, 3) + "-" + pPNum.substr(10, 3) + "." + pPNum.substr(13, 3);
      },

      _dataMixin: function(){
//        console.info(this.json);
        dom.byId('PPIN').innerHTML = "Pin Number:  " + this.json.features[0].attributes.PPIN;
        dom.byId('ParNum').innerHTML = "Parcel Number:  " + this.ReFormatParcelNum(this.json.features[0].attributes.PARCEL_NUMBER);
        dom.byId('Owner').innerHTML = "Owner:  " + this.json.features[0].attributes.NAME;

        var cDate = new Date();
        var row;
        this.gl = new GraphicsLayer();
        this.map.addLayer(this.gl);
        var sms = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 7, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 1), new Color([0,255,0,1]));
        var sms2 = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 7, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 1), new Color([255,0,0,1]));
        for (var i = 0; i < this.json.features[0].geometry.rings.length; i++){
          for (var p = 0; p < this.json.features[0].geometry.rings[i].length; p++){
            var LatLon = String(this.json.features[0].geometry.rings[i][p]);
            var LLArr = LatLon.split(",");
            this.gl.add(new Graphic(new Point(this.json.features[0].geometry.rings[i][p]), (p === 0 || p === this.json.features[0].geometry.rings[i].length - 1)?sms:sms2));
            var scaleIndx1 = LLArr[1].indexOf("."),
                scaleIndx2 = LLArr[0].indexOf("."),
                formattedLat = LLArr[1].substr(0, scaleIndx1 + 7),
                formattedLng = LLArr[0].substr(0, scaleIndx2 + 7);
            var col1 = (p === 0)?"Point of Beginning":String(p + 1);
            row = domConstruct.toDom('<tr><td>' + col1 + '</td><td>' + formattedLat + '</td><td>' + formattedLng + '</td></tr>');
            domConstruct.place(row, dom.byId('coordsTableBody'));
          }
        }

        var rend = this.layer.renderer;
        var pGraphic = this.layer.graphics[0];
        var graphicPolySym = rend.getSymbol(pGraphic);
        graphicPolySym.style = SimpleFillSymbol.STYLE_NULL;
        graphicPolySym.outline.width = 2;
        var simpRend = new SimpleRenderer(graphicPolySym);

        this.layer.setRenderer(simpRend);
        this.layer.refresh();
        this.map.infoWindow.hide();
        var oWid = this.map.width;
        var oHgt = this.map.height;
        var printTask = new PrintTask('http://gis.calhouncounty.org/arcgis3/rest/services/ExportWebMap/GPServer/Export_Web_Map');
        var template = new PrintTemplate();
        template.exportOptions = {
          width: 1542,
          height: (1542/oWid) * oHgt,
          dpi: 200
        };
        this.imgHeight = (1542/oWid) * oHgt;
        template.format = "jpg";
        template.layout = "MAP_ONLY";
        template.preserveScale = false;
        template.showAttribution = false;
        template.outScale = this.map.getScale();

        var params = new PrintParameters();
        params.map = this.map;
        params.template = template;
        printTask.execute(params, lang.hitch(this, this.printResult));

        var copyRight = domConstruct.toDom('<div style="width:740px;text-align:center;font-size: 9pt;">Copyright &copy; ' + String(cDate.getFullYear()) + '</div>');
        domConstruct.place(copyRight, dom.byId('main'), 'last');
        var spacer = domConstruct.toDom('<div style="height:20px;width:740px;"></div>');
        domConstruct.place(spacer, dom.byId('main'), 'last');
      },

      printResult: function(rsltURL){
        this.map.removeLayer(this.gl);
        var sfs = new SimpleFillSymbol({
          "color": [
            163,
            187,
            71,
            128
          ],
          "outline": {
            "color": [
              201,
              210,
              60,
              204
            ],
            "width": 2,
            "type": "esriSLS",
            "style": "esriSLSSolid"
          },
          "type": "esriSFS",
          "style": "esriSFSSolid"
        });
        var simpRend = new SimpleRenderer(sfs);
        this.layer.setRenderer(simpRend);
        this.layer.refresh();
        var mapImg = domConstruct.toDom('<img src="'+rsltURL.url+'" border="0" style="width:740px;height:"'+this.imgHeight+';"/>');
        domConstruct.place(mapImg, dom.byId('mapImgDiv'), 'replace');
        if(typeof has('android') === 'undefined'){
          domClass.replace(this.printBtnNode, 'myprint-btn', 'myprint-btn-loading');
          domAttr.set(this.printBtnNode, 'title', 'Print Tax Report...');
          this.own(on(this.printBtnNode, 'click', lang.hitch(this, this._printReport)));
        }
      },

      _createTitleNode: function(){
        if (this.titleLabel) {
          this.titleNode = html.create('div', {
            'class': 'title'
          }, this.domNode);
          this.handleNode = html.create('div', {
            'class': 'handle'
          }, this.titleNode);
          this.titleLabeNode = html.create('span', {
            'class': 'title-label jimu-float-leading',
            innerHTML: this.titleLabel || '&nbsp'
          }, this.titleNode);
          this.closeBtnNode = html.create('div', {
            'class': 'close-btn jimu-float-trailing',
            'title': 'Close Report'
          }, this.titleNode);
          this.own(on(this.closeBtnNode, 'click', lang.hitch(this, this.close)));
          if(typeof has('android') === 'undefined'){
            this.printBtnNode = html.create('div', {
              'class': 'myprint-btn-loading jimu-float-trailing',
              'title': 'Preparing Report...'
            }, this.titleNode);
          }
        }
      },

      _increaseZIndex: function() {
        html.setStyle(this.domNode, 'zIndex', 9999);
        html.setStyle(this.overlayNode, 'zIndex', 9998);
      },

      _printReport: function() {
        var DocumentContainer = document.getElementById('main');
        var printIframe = document.createElement("iframe");
        printIframe.name = "print_iframe";
        //domStyle.set(printIframe, 'zIndex', 9999);
        domStyle.set(printIframe, 'visibility', 'hidden');
        domStyle.set(printIframe, 'position', 'fixed');
        domStyle.set(printIframe, 'right', 0);
        domStyle.set(printIframe, 'bottom', 0);
        //detect is the browser supports the srcdoc attribute of iFrame
        if('srcdoc' in document.createElement('iframe')) {
          printIframe.onload = this._setPrint;
          printIframe.srcdoc = '<html><head><link rel="stylesheet"  type="text/css" href="' + this.folderurl + 'css/style.css"></link></head><body>'+DocumentContainer.innerHTML+'</body></html>';
          document.body.appendChild(printIframe);
        }else{
          document.body.appendChild(printIframe);
          var printIframeWindow = window.frames.print_iframe;
          var printDocument = printIframeWindow.document;
          printDocument.write('<html><head><link rel="stylesheet"  type="text/css" href="' + this.folderurl + 'css/style.css"></link></head></head><body>' + DocumentContainer.innerHTML + '</body></html>');
          printIframeWindow.focus();
          var pResult;
          pResult = printIframeWindow.document.execCommand('print', true, null);
          setTimeout(function(){
            printIframe.parentNode.removeChild(printIframe);
          }, 200);
        }
      },

      _setPrint: function() {
        this.contentWindow.__container__ = this;
        this.contentWindow.onbeforeunload = this._closePrint;
        this.contentWindow.onafterprint = this._closePrint;
        this.contentWindow.focus(); // Required for IE
        setTimeout(lang.hitch(this, function(){
          var pResult;
          try{
            pResult = this.contentWindow.document.execCommand('print', false, null);
          }
          catch(e){
            pResult = this.contentWindow.print();
          }
          if(!pResult){
            pResult = this.contentWindow.print();
          }
        }), 200);
      },

      _closePrint: function() {
        document.body.removeChild(this.__container__);
      }
    });
  });
