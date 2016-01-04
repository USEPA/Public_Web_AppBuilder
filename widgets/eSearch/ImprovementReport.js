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
    'dojo/text!./templates/ImprovementReport.html',
    'dojo/dom',
    'dojo/query',
    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/_base/array',
    'dojo/cookie',
    'dojo/sniff'
  ],
  function(declare, lang, html, on, has, MobilePopup, iTemplate, dom, query, domConstruct, domClass, array, cookie) {
    return declare(MobilePopup, {
      //summary:
      //  show the Improvement Report

      baseClass: 'jimu-popup jimu-message',
      declaredClass: 'parcel.dijit.tax.report',

      json: null,
      autoHeight: false,
      parentThis: null,
      maxWidth: 840,
      maxHeight: 800,

      postMixInProperties: function() {
        this.content = iTemplate;
      },

      _dataMixin: function(){
//        console.info(this.json);
        dom.byId('pParNum').innerHTML = this.json.pParNum;
        dom.byId('pName').innerHTML = this.json.pName;
        dom.byId('pPPIN').innerHTML = this.json.pPPIN;
        var imp;
        array.forEach(this.json.pImprovements, lang.hitch(this, function(improvements, index){
          var idx = index += 1;
          imp = domConstruct.toDom('<div style="height:10px;width:740px;"></div><div style="width:720px;text-align:left;padding-left:10px;"><b>Improvement ' + idx + '</b></div><hr style="width:740px" />');
          var imp2 = domConstruct.toDom('<div style="height:20px;width:720px;text-align:left;padding-bottom:5px;padding-left:20px;"><div style="position:absolute;text-align:left;"><span>Class:  </span><span>'+improvements.structDesc+'</span></div><div style="left:500px;width:200px;position:absolute;text-align:left;"><span>Total Adjusted Area:  </span><span>'+improvements.adjArea+'</span></div></div>');
          var imp3 = domConstruct.toDom('<div style="height:20px;width:720px;text-align:left;padding-bottom:5px;padding-left:20px;"><div style="position:absolute;text-align:left;"><span>Value:  </span><span>'+improvements.finalValue+'</span></div><div style="left:200px;width:200px;position:absolute;text-align:left;"><span>Stories:  </span><span>'+improvements.stories+'</span></div></div>');
          var imp4 = domConstruct.toDom('<div style="height:20px;width:720px;text-align:left;padding-bottom:5px;padding-left:20px;"><div style="position:absolute;text-align:left;"><span>Year Erected:  </span><span>'+improvements.yearBuilt+'</span></div><div style="left:200px;width:170px;position:absolute;text-align:left;"><span>Actual Age:  </span><span>'+improvements.actualAge+'</span></div><div style="left:370px;width:180px;position:absolute;text-align:left;"><span>Year Remodeled:  </span><span>'+improvements.remodelYear+'</span></div><div style="left:550px;width:150px;position:absolute;text-align:left;"><span>Total Rooms:  </span><span>'+improvements.roomCount+'</span></div></div>');
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
        var spacer, line, photo, apex, photoBtnDiv;
        if (!this.json.pImprovements.length) {
          spacer = domConstruct.toDom('<div style="height:12px;width:740px;"></div>');
          domConstruct.place(spacer, dom.byId('main'), 'last');
          line = domConstruct.toDom('<div style="width:720px;text-align:center;padding-bottom:5px;"><span><b>No Improvements</b></span></div>');
          domConstruct.place(line, dom.byId('main'), 'last');
          spacer = domConstruct.toDom('<div style="height:12px;width:740px;"></div>');
          domConstruct.place(spacer, dom.byId('main'), 'last');
        }
        if ( this.json.pImpImages[0].photos.length > 0) {
          spacer = domConstruct.toDom('<div style="height:12px;width:740px;"></div>');
          domConstruct.place(spacer, dom.byId('main'), 'last');
          line = domConstruct.toDom('<div style="width:720px;text-align:center;padding-bottom:5px;"><span><b>Photos</b></span></div>');
          domConstruct.place(line, dom.byId('main'), 'last');
        }
        var domEle;
        array.forEach(this.json.pImpImages[0].photos, lang.hitch(this, function(impImages){
//          console.info(impImages);
          photo = domConstruct.toDom('<img src="'+impImages.photoSrc+'" style="height: 480px; width:640px;margin-left:40px;"/>');
          domConstruct.place(photo, dom.byId('main'), 'last');
          spacer = domConstruct.toDom('<div style="height:6px;width:740px;"></div>');
          domConstruct.place(spacer, dom.byId('main'), 'last');
          photoBtnDiv = domConstruct.toDom('<div style="text-align: center;width:700px;"></div>');
          if(typeof has('android') === 'undefined'){
            domEle = domConstruct.toDom('<div class="search-btn" style="padding:0 8px;margin: 0 4px;display: inline-block;line-height: 39px;" data-imgsrc="' + impImages.photoSrc + '">Print Image...</div>');
            on(domEle, 'click', lang.hitch(this, this._printImage));
            domConstruct.place(domEle, photoBtnDiv);
          }
          domEle = domConstruct.toDom('<div class="search-btn" style="padding:0 8px;margin: 0 4px;display: inline-block;line-height: 39px;" data-imgsrc="' + impImages.photoSrc + '"><div class="myprint-btn-loading-hidden"></div>Save Image...</div>');
          on(domEle, 'click', lang.hitch(this, this._SaveImage));
          domConstruct.place(domEle, photoBtnDiv);
          domConstruct.place(photoBtnDiv, dom.byId('main'), 'last');
          spacer = domConstruct.toDom('<div style="height:6px;width:740px;"></div>');
          domConstruct.place(spacer, dom.byId('main'), 'last');
        }));
        array.forEach(this.json.pImpImages[0].apexs, lang.hitch(this, function(impApexes){
//          console.info(impApexes);
          apex = domConstruct.toDom('<img src="'+impApexes.apexSrc+'" style="height: 480px; width:640px;margin-left:40px;" />');
          domConstruct.place(apex, dom.byId('main'), 'last');
          spacer = domConstruct.toDom('<div style="height:6px;width:740px;"></div>');
          domConstruct.place(spacer, dom.byId('main'), 'last');
          spacer = domConstruct.toDom('<div style="height:6px;width:740px;"></div>');
          domConstruct.place(spacer, dom.byId('main'), 'last');
          photoBtnDiv = domConstruct.toDom('<div style="text-align: center;width:700px;"></div>');
          if(typeof has('android') === 'undefined'){
            domEle = domConstruct.toDom('<div class="search-btn" style="padding:0 8px;margin: 0 4px;display: inline-block;line-height: 39px;" data-imgsrc="' + impApexes.apexSrc + '">Print APEX...</div>');
            on(domEle, 'click', lang.hitch(this, this._printImage));
            domConstruct.place(domEle, photoBtnDiv);
          }
          domEle = domConstruct.toDom('<div class="search-btn" style="padding:0 8px;margin: 0 4px;display: inline-block;line-height: 39px;" data-imgsrc="' + impApexes.apexSrc + '"><div class="myprint-btn-loading-hidden"></div>Save APEX...</div>');
          on(domEle, 'click', lang.hitch(this, this._SaveImage));
          domConstruct.place(domEle, photoBtnDiv);
          domConstruct.place(photoBtnDiv, dom.byId('main'), 'last');
          spacer = domConstruct.toDom('<div style="height:6px;width:740px;"></div>');
          domConstruct.place(spacer, dom.byId('main'), 'last');
        }));

        spacer = domConstruct.toDom('<div style="height:20px;width:740px;"></div>');
        domConstruct.place(spacer, dom.byId('main'), 'last');
        var copyRight = domConstruct.toDom('<div style="width:740px;text-align:center;font-size: 10pt;"><b>Calhoun County Disclaimer</b></div>');
        domConstruct.place(copyRight, dom.byId('main'), 'last');
        copyRight = domConstruct.toDom('<div style="width:740px;text-align:center;font-size: 10pt;">Information deemed reliable but not guaranteed.</div>');
        domConstruct.place(copyRight, dom.byId('main'), 'last');
        var cDate = new Date();
        copyRight = domConstruct.toDom('<div style="width:740px;text-align:center;font-size: 9pt;">Copyright © '+String(cDate.getFullYear())+'</div>');
        domConstruct.place(copyRight, dom.byId('main'), 'last');
        spacer = domConstruct.toDom('<div style="height:20px;width:740px;"></div>');
        domConstruct.place(spacer, dom.byId('main'), 'last');
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
            'class': 'close-btn jimu-float-trailing'
          }, this.titleNode);
          this.own(on(this.closeBtnNode, 'click', lang.hitch(this, this.close)));
        }
      },

      _SaveImage: function(evt){
        cookie("fileDownload", null, {expire: -1});
        var saveBtnDom = query('.myprint-btn-loading-hidden', evt.target)[0];
        domClass.replace(saveBtnDom, 'myprint-btn-loading-show', 'myprint-btn-loading-hidden');
        var fName;
        if(typeof evt.currentTarget.dataset === 'undefined'){
          fName = evt.currentTarget.getAttribute("data-imgsrc");
        }else{
          fName = evt.target.dataset.imgsrc;
        }
        var lIndx = fName.lastIndexOf('/');
        var filename = fName.substr(fName.lastIndexOf('/')+1,(fName.length - lIndx - 5));
        var oHiddFrame = document.createElement("iframe");
        oHiddFrame.style.visibility = "hidden";
        oHiddFrame.style.position = "fixed";
        oHiddFrame.style.right = "0";
        oHiddFrame.style.bottom = "0";
        oHiddFrame.src = 'http://gis.calhouncounty.org/img/img.ashx?download=' + fName +'&filename=' + filename;
        document.body.appendChild(oHiddFrame);
        setTimeout(checkForCookie, 500);
        function checkForCookie(){
          var cookieValue = cookie('fileDownload');
          if(cookieValue){
            document.body.removeChild(oHiddFrame);
            var saveBtnDom = query('.myprint-btn-loading-show')[0];
            domClass.replace(saveBtnDom, 'myprint-btn-loading-hidden', 'myprint-btn-loading-show');
          } else {
            setTimeout(checkForCookie, 200);
          }
        }
      },

      _increaseZIndex: function() {
        html.setStyle(this.domNode, 'zIndex', 9999);
        html.setStyle(this.overlayNode, 'zIndex', 9998);
      },

      _printImage: function(evt) {
        var fName;
        if(typeof evt.currentTarget.dataset === 'undefined'){
          fName = evt.currentTarget.getAttribute("data-imgsrc");
        }else{
          fName = evt.target.dataset.imgsrc;
        }
        var printIframe = document.createElement('iframe');
        printIframe.name = "print_iframe";
        printIframe.style.visibility = "hidden";
        printIframe.style.position = "fixed";
        printIframe.style.right = "0";
        printIframe.style.bottom = "0";
        document.body.appendChild(printIframe);
        var printIframeWindow = window.frames.print_iframe;
        var printDocument = printIframeWindow.document;
        printDocument.write("<html><body></body></html>");
        printDocument.body.innerHTML = '<img src="'+fName+'" style="height: 480px; width:640px;" />';
        var pResult;
        try{
          pResult = printIframeWindow.document.execCommand('print', false, null);
        }
        catch(e){
          pResult = printIframeWindow.print();
        }
        if(!pResult){
          pResult = printIframeWindow.print();
        }
        printIframe.parentNode.removeChild(printIframe);
      }
    });
  });
