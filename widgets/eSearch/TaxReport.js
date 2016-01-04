///////////////////////////////////////////////////////////////////////////
// Tax Report Dijit
// By: Robert Scheitlin
///////////////////////////////////////////////////////////////////////////
/*jslint maxlen: 800 */
define(['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    'dojo/has',
    './MobilePopup',
    'dojo/text!./templates/TaxReport.html',
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
    'esri/renderers/SimpleRenderer',
    'jimu/dijit/LoadingShelter',
    'dojo/sniff'
  ],
  function(declare, lang, html, on, has, MobilePopup, trTemplate, dom, domConstruct, domClass, domStyle, domAttr, array,
            PrintTemplate, PrintParameters, PrintTask, SimpleFillSymbol, SimpleRenderer) {
    return declare(MobilePopup, {
      //summary:
      //  show the Tax Report

      baseClass: 'jimu-popup jimu-message',
      declaredClass: 'parcel.dijit.tax.report',
      json: null,
      map: null,
      layer: null,
      folderurl: null,
      autoHeight: false,
      maxWidth: 840,
      maxHeight: 800,

      postMixInProperties: function() {
        this.content = trTemplate;
      },

      _dataMixin: function(){
//        console.info(this.json);
        dom.byId('PPIN').innerHTML = this.json.PPIN;
        dom.byId('ParNum').innerHTML = this.json.ParNum;
        dom.byId('TaxYear').innerHTML = this.json.TaxYear;
        dom.byId('Owner').innerHTML = this.json.Owner;
        dom.byId('PropAdd').innerHTML = this.json.PropAdd1;
        dom.byId('mAddress').innerHTML = this.json.MailAdd1;
        dom.byId('mAddress2').innerHTML = this.json.MailAdd2;
        dom.byId('cuval').innerHTML = this.json.UseVal;
        dom.byId('taprval').innerHTML = this.json.UseVal;
        dom.byId('impval').innerHTML = this.json.ImprVal;
        dom.byId('assesval').innerHTML = this.json.AssesVal;
        dom.byId('landval').innerHTML = this.json.LandVal;
        dom.byId('exempt').innerHTML = this.json.ExmtCode;
        dom.byId('ltaxdue').innerHTML = this.json.TaxDue;
        dom.byId('ltaxpaid').innerHTML = this.json.TaxPaid;
        dom.byId('lotdim').innerHTML = this.json.LotDim;
        dom.byId('calcacres').innerHTML = this.json.CalcAc;
        dom.byId('taxdist').innerHTML = this.json.TaxDist;
        dom.byId('legaldesc').innerHTML = this.json.LegalDesc;
        dom.byId('subname').innerHTML = this.json.SubName;
        dom.byId('deedbp').innerHTML = this.json.BookPage;
        var cDate = new Date();
        var lTaxDue = (cDate.getMonth() < 9) ? String(cDate.getFullYear() - 1) + " Taxes Due:  " : String(cDate.getFullYear()) + " Taxes Due:  ";
        var lTaxPaid = (cDate.getMonth() < 9) ? String(cDate.getFullYear() - 1) + " Taxes Paid:  " : String(cDate.getFullYear()) + " Taxes Paid:  ";
        dom.byId('ltaxdue1').innerHTML = lTaxDue;
        dom.byId('ltaxpaid1').innerHTML = lTaxPaid;
        var row, imp;
        array.forEach(this.json.Sales, lang.hitch(this, function(sale){
          row = domConstruct.toDom('<tr><td>' + sale.sDate + '</td><td>' + sale.Price + '</td><td>' + sale.Grantee + '</td><td>' + sale.deedBook + '</td><td>' + sale.deedPage + '</td></tr>');
          domConstruct.place(row, dom.byId('salesTableBody'));
        }));
        array.forEach(this.json.pImprovements, lang.hitch(this, function(improvements, index){
          var idx = index += 1;
          imp = domConstruct.toDom('<div style="height:10px;width:740px;"></div><div style="width:720px;text-align:left;padding-left:10px;"><b>Improvement ' + idx + '</b></div><hr style="width:740px" />');
          var imp2 = domConstruct.toDom('<div style="height:20px;width:720px;text-align:left;padding-bottom:5px;padding-left:20px;position: relative;"><div style="position:absolute;text-align:left;"><span>Class:  </span><span>'+improvements.structDesc+'</span></div><div style="left:500px;width:200px;position:absolute;text-align:left;"><span>Total Adjusted Area:  </span><span>'+improvements.adjArea+'</span></div></div>');
          var imp3 = domConstruct.toDom('<div style="height:20px;width:720px;text-align:left;padding-bottom:5px;padding-left:20px;position: relative;"><div style="position:absolute;text-align:left;"><span>Value:  </span><span>'+improvements.finalValue+'</span></div><div style="left:200px;width:200px;position:absolute;text-align:left;"><span>Stories:  </span><span>'+improvements.stories+'</span></div></div>');
          var imp4 = domConstruct.toDom('<div style="height:20px;width:720px;text-align:left;padding-bottom:5px;padding-left:20px;position: relative;"><div style="position:absolute;text-align:left;"><span>Year Erected:  </span><span>'+improvements.yearBuilt+'</span></div><div style="left:200px;width:170px;position:absolute;text-align:left;"><span>Actual Age:  </span><span>'+improvements.actualAge+'</span></div><div style="left:370px;width:180px;position:absolute;text-align:left;"><span>Year Remodeled:  </span><span>'+improvements.remodelYear+'</span></div><div style="left:550px;width:150px;position:absolute;text-align:left;"><span>Total Rooms:  </span><span>'+improvements.roomCount+'</span></div></div>');
          domConstruct.place(imp2, imp);
          domConstruct.place(imp3, imp);
          domConstruct.place(imp4, imp);
          if(improvements.roofInfo){
            var imp5 = domConstruct.toDom('<div style="height:10px;width:740px;"></div><div style="width:720px;text-align:left;padding-left:20px;"><b>Construction Details:</b></div><hr style="width:740px" />');
            var imp6 = domConstruct.toDom('<div style="width:720px;text-align:left;padding-bottom:5px;padding-left:30px;"><span>Roof:  </span><span>'+improvements.roofInfo+'</span></div>');
            var imp7 = domConstruct.toDom('<div style="width:720px;text-align:left;padding-bottom:5px;padding-left:30px;"><span>Exterior Walls:  </span><span>'+improvements.exteriorInfo+'</span></div>');
            var imp8 = domConstruct.toDom('<div style="width:720px;text-align:left;padding-bottom:5px;padding-left:30px;"><span>Interior Walls:  </span><span>'+improvements.interiorInfo+'</span></div>');
            var imp9 = domConstruct.toDom('<div style="width:720px;text-align:left;padding-bottom:5px;padding-left:30px;"><span>Flooring:  </span><span>'+improvements.floorInfo+'</span></div>');
            var imp10 = domConstruct.toDom('<div style="width:720px;text-align:left;padding-bottom:5px;padding-left:30px;"><span>Heat and Air:  </span><span>'+improvements.hvacInfo+'</span></div>');
            var imp11 = domConstruct.toDom('<div style="width:720px;text-align:left;padding-bottom:5px;padding-left:30px;"><span>Extras:  </span><span>'+improvements.extraInfo+'</span></div>');
            domConstruct.place(imp5, imp);
            domConstruct.place(imp6, imp);
            domConstruct.place(imp7, imp);
            domConstruct.place(imp8, imp);
            domConstruct.place(imp9, imp);
            domConstruct.place(imp10, imp);
            domConstruct.place(imp11, imp);
            if(improvements.appenInfo && improvements.appenInfo[0] && improvements.appenInfo[0].appenInfos.length > 0){
              var imp12 = domConstruct.toDom('<div style="height:10px;width:740px;"></div><div style="width:720px;text-align:left;padding-left:30px;"><b>Additional Construction Details:</b></div><hr style="width:740px" />');
              var imp13 = domConstruct.toDom('<div style="height:20px;width:720px;text-align:left;padding-bottom:5px;padding-left:40px;position: relative;"><div style="position:absolute;text-align:left;"><span>Description:</span></div><div style="left:520px;width:200px;position:absolute;text-align:left;"><span>Total Area:</span></div></div>');
              var imp14;
              domConstruct.place(imp12, imp);
              domConstruct.place(imp13, imp);
              array.forEach(improvements.appenInfo[0].appenInfos, lang.hitch(this, function(appenInfos){
                imp14 = domConstruct.toDom('<div style="height:20px;width:720px;text-align:left;padding-bottom:5px;padding-left:40px;position: relative;"><div style="position:absolute;text-align:left;"><span>'+appenInfos.fullDesc+'</span></div><div style="left:520px;width:200px;position:absolute;text-align:left;"><span>'+appenInfos.grossArea+'</span></div></div>');
                domConstruct.place(imp14, imp);
              }));
            }
          }
          domConstruct.place(imp, dom.byId('main'), 'last');
        }));
        var spacer = domConstruct.toDom('<div style="height:10px;width:740px;"></div>');
        domConstruct.place(spacer, dom.byId('main'), 'last');
        var rend = this.layer.renderer;
        var pGraphic = this.layer.graphics[0];
        var graphicPolySym = rend.getSymbol(pGraphic);
        graphicPolySym.style = SimpleFillSymbol.STYLE_NULL;
        graphicPolySym.outline.width = 4;
        var simpRend = new SimpleRenderer(graphicPolySym);
        this.layer.setRenderer(simpRend);
        this.layer.refresh();
        this.map.infoWindow.hide();
        var oWid = this.map.width;
        var oHgt = this.map.height;
        var printTask = new PrintTask('http://gis.calhouncounty.org/arcgis3/rest/services/ExportWebMap/GPServer/Export_Web_Map');
        var template = new PrintTemplate();
        this.imgHeight = (740/oWid) * oHgt;
        template.exportOptions = {
          width: 1542,
          height: (1542/oWid) * oHgt,
          dpi: 200
        };
        template.format = "jpg";
        template.layout = "MAP_ONLY";
        template.preserveScale = false;
        template.showAttribution = false;

        var params = new PrintParameters();
        params.map = this.map;
        params.template = template;
        printTask.execute(params, lang.hitch(this, this.printResult));

        var map = domConstruct.toDom('<div id="mapImgDiv" style="height:400px;width:740px;border:solid 1px black;background-color:lightgray;"><div style="width:100%;height:100%;position:relative;"><div class="loading-container"><img src="widgets/eSearch/images/downloading.gif"/><p>Retrieving Print Quality Map Image...</p></div></div></div>');
        domConstruct.place(map, dom.byId('main'), 'last');
        spacer = domConstruct.toDom('<div style="height:20px;width:740px;"></div>');
        domConstruct.place(spacer, dom.byId('main'), 'last');
        var copyRight = domConstruct.toDom('<div style="width:740px;text-align:center;font-size: 10pt;"><b>Calhoun County Disclaimer</b></div>');
        domConstruct.place(copyRight, dom.byId('main'), 'last');
        copyRight = domConstruct.toDom('<div style="width:740px;text-align:center;font-size: 10pt;">Information is for tax purposes only and not to be used for conveyance.</div>');
        domConstruct.place(copyRight, dom.byId('main'), 'last');
        copyRight = domConstruct.toDom('<div style="width:740px;text-align:center;font-size: 9pt;">Copyright &copy; ' + String(cDate.getFullYear()) + '</div>');
        domConstruct.place(copyRight, dom.byId('main'), 'last');
        spacer = domConstruct.toDom('<div style="height:20px;width:740px;"></div>');
        domConstruct.place(spacer, dom.byId('main'), 'last');
      },

      printResult: function(rsltURL){
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
        var mapImg = domConstruct.toDom('<img src="'+rsltURL.url+'" border="0" style="width:740px;height:'+this.imgHeight+'px;"/>');
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
