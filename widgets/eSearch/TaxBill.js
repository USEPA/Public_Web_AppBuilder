///////////////////////////////////////////////////////////////////////////
// Tax Bill Dijit
// By: Robert Scheitlin
///////////////////////////////////////////////////////////////////////////
/*jslint maxlen: 800, -W116 */
define(['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    'dojo/has',
    './MobilePopup',
    'dojo/text!./templates/TaxBill.html',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/_base/array',
    './ViewStack',
    'dojo/sniff'
  ],
  function(declare, lang, html, on, has, MobilePopup, tbTemplate, dom, domConstruct, domStyle, array, ViewStack) {
    return declare(MobilePopup, {
      //summary:
      //  show the Tax Bill

      baseClass: 'jimu-popup jimu-message',
      declaredClass: 'parcel.dijit.tax.report',

      //type: String
      //  the popup messge type, can be: message/question/error
      type: 'message',

      //type:String
      message: '',

      autoHeight: false,

      DelqNoticeNum: null,
      FinalNoticeNum: null,
      folderurl: null,
      maxWidth: 800,
      maxHeight: 800,

      postMixInProperties: function() {
        this.content = tbTemplate;
      },

      _dataMixin: function(){
        this.viewStack = new ViewStack(null, dom.byId('viewStackDiv'));
//        console.info(this.json);
        var prow, hrow;
        array.forEach(this.json.bills, lang.hitch(this, function(bill, index){
//          console.info(bill);
          var domEle, taxBillCard;
          var bClr = parseInt(bill.NoticeNum,10);
          var idx = index + 1;
          var oddclass;
          if(idx % 2 == 0){
            oddclass = ' class="odd"';
          }else{
            oddclass = '';
          }
          var lineonestr = String(bill.Year) + "   P-" + String(this.json.PPIN);
          var alineonestr = lineonestr + "   A-" + String(this.json.Account);
          taxBillCard = domConstruct.toDom('<div style="width:528px;height:428px;border:1px solid black;margin: 0px auto;position:relative;"></div>');
          domEle = domConstruct.toDom('<span style="top:101px;left:30px;font-size:9pt;position:absolute;width:290px;"><b>'+ alineonestr +'</b></span>');
          if(has('ie') === 8){
            domStyle.set(domEle,'white-space', 'nowrap');
          } else {
            domStyle.set(domEle,'white-space', 'pre');
          }
          domConstruct.place(domEle, taxBillCard);
          domEle = domConstruct.toDom('<span style="top:10px;left:10px;font-size:11pt;position:absolute;"><b>KAREN ROPER, REVENUE COMMISSIONER</b></span>');
          domConstruct.place(domEle, taxBillCard);
          domEle = domConstruct.toDom('<span style="top:30px;left:10px;font-size:9pt;position:absolute;">1702 NOBLE ST STE 104</span>');
          domConstruct.place(domEle, taxBillCard);
          domEle = domConstruct.toDom('<span style="top:46px;left:10px;font-size:9pt;position:absolute;">ANNISTON, AL 36201</span>');
          domConstruct.place(domEle, taxBillCard);
          domEle = domConstruct.toDom('<span style="top:35px;left:175px;font-size:9pt;position:absolute;"><b>Pay Online at wwww.calhouncounty.org</b></span>');
          domConstruct.place(domEle, taxBillCard);
          domEle = domConstruct.toDom('<span style="top:410px;left:30px;font-size:7pt;position:absolute;"><b>SEND STAMPED SELF ADDRESSED ENVELOPE FOR RECIEPT</b></span>');
          domConstruct.place(domEle, taxBillCard);
          if(String(bill.PrintFee) !== '$0.00'){
            domEle = domConstruct.toDom('<span style="top:68px;left:10px;font-size:9pt;position:absolute;width:508px;text-align:center;">Advertising Fees Added Weekly</span>');
            domConstruct.place(domEle, taxBillCard);
          }

          var EscapeYear;
          if (bClr < this.DelqNoticeNum){
            domStyle.set(taxBillCard, 'backgroundColor', '#ffffff');
            if (String(bill.EscYear) !== "0"){
              EscapeYear = "Escape Bill for " + String(bill.EscYear);
            }
          }else if (bClr === this.DelqNoticeNum && bClr < this.FinalNoticeNum){
            domStyle.set(taxBillCard, 'backgroundColor', "#FFF782");
            if (String(bill.EscYear) !== "0"){
              EscapeYear = "DELINQUENT TAX NOTICE - Escape Bill for " + String(bill.EscYear);
            }else{
              EscapeYear = "DELINQUENT TAX NOTICE";
            }
          }else if (bClr >= this.DelqNoticeNum){
            domStyle.set(taxBillCard, 'backgroundColor', "#FAC5FA");
            if (String(bill.EscYear) !== "0"){
              EscapeYear = "PAST DUE NOTICE - Escape Bill for " + String(bill.EscYear);
            }else{
              EscapeYear = "PAST DUE NOTICE";
            }
          }
          if(EscapeYear){
            domEle = domConstruct.toDom('<span style="top:52px;left:10px;width:508px;font-size:11pt;position:absolute;text-align:center;"><b>' + EscapeYear + '</b></span>');
            domConstruct.place(domEle, taxBillCard);
            domEle = domConstruct.toDom('<span style="top:83px;left:10px;width:508px;font-size:9pt;position:absolute;text-align:center;">Please Call 256-241-2840 for current amount due</span>');
            domConstruct.place(domEle, taxBillCard);
          }
          domEle = domConstruct.toDom('<span style="top:205px;left:332px;font-size:8pt;position:absolute;text-align:left;width:240px;"><b>' + lineonestr + '</b></span>');
          if(has('ie') === 8){
            domStyle.set(domEle,'white-space', 'nowrap');
          } else {
            domStyle.set(domEle,'white-space', 'pre');
          }
          domConstruct.place(domEle, taxBillCard);
          domEle = domConstruct.toDom('<span style="top:224px;left:332px;width:188px;font-size:8pt;position:absolute;text-align:left;">' + String(bill.OName) + "\n" + String(bill.Addr).replace(/<br\s*\/>/g, "\n") + "\n" + String(bill.CSZ) + '</span>');
          domConstruct.place(domEle, taxBillCard);

//Start constructing table here
          var domtable = domConstruct.toDom('<table class="billTableCls" style="top:120px;left:7px;position:absolute;"><col width="86"><col width="46"><col width="188"><tbody></tbody></table>');
          var domTR = domConstruct.toDom('<tr><td bgcolor="#BFBABA" style="height:40px;text-align: center;"><b>PARCEL:</b></td><td style="height:40px;font-size:8pt;" colspan=2 class="noborder">'+this.json.ParNum+'</td></tr>');
          domConstruct.place(domTR, domtable);
          var fAddress = String(this.json.Address);
          //strip 0 addresses from being used
          if(fAddress.indexOf("0 ") === 0){
            fAddress = fAddress.substr(2,fAddress.length);
          }
          domTR = domConstruct.toDom('<tr><td bgcolor="#BFBABA" style="height:40px;text-align: center;"><b>PROP:</b></td><td style="height:40px;font-size:8pt;" colspan=2 class="noborder">'+fAddress+'</td></tr>');
          domConstruct.place(domTR, domtable);
          domTR = domConstruct.toDom('<tr><td style="height:112px;text-align: left;font-size:8pt;vertical-align: top;" colspan=3>' + this.json.LegalDesc + '</td></tr>');
          domConstruct.place(domTR, domtable);
          domTR = domConstruct.toDom('<tr><td bgcolor="#BFBABA" style="height:18px;text-align: center;font-size: 7pt;" colspan=2><b>STORMWATER USER FEE</b></td><td style="text-align: center;height:18px;font-size:8pt;">' + bill.StormWaterFee + '</td></tr>');
          domConstruct.place(domTR, domtable);
          domTR = domConstruct.toDom('<tr><td bgcolor="#BFBABA" style="height:18px;text-align:center;font-size:6pt;" colspan=3><b>For Stormwater user fee questions, call the City of Anniston at (256) 231-7718</b></td></tr>');
          domConstruct.place(domTR, domtable);
          var domStr = '';
          if(String(bill.PartialPayment) === "Y"){
            domEle = domConstruct.toDom('<span style="top:302px;left:332px;width:188px;position:absolute;text-align:left;font-size:8pt;line-height: 18px;white-space:pre-wrap;">*Partial payment(s)\n  have been made.\n  Total tax due may differ.\n  Please call office for\n  current ammount due.</span>');
            domConstruct.place(domEle, taxBillCard);
            if(bill.History.CurrentTaxAmount && (bill.History.CurrentTaxAmount > bill.TaxDue)){
              domStr += "* " + bill.History.CurrentTaxAmount;
            }else{
              domStr += "* " + bill.TaxDue;
            }
          }else{
            if(bill.History.CurrentTaxAmount && (bill.History.CurrentTaxAmount > bill.TaxDue)){
              domStr += bill.History.CurrentTaxAmount;
            }else{
              domStr += bill.TaxDue;
            }
          }
          domTR = domConstruct.toDom('<tr><td bgcolor="#BFBABA" style="height:18px;text-align: center;font-size: 7pt;" colspan=2><b>TOTAL TAX DUE</b></td><td style="text-align: center;height:18px;font-size:8pt;">' + domStr + '</td></tr>');
          domConstruct.place(domTR, domtable);
          domConstruct.place(domtable, taxBillCard);

          this.viewStack.viewType = 'dom';
          this.viewStack.addView(taxBillCard);

          prow = domConstruct.toDom('<tr'+oddclass+'><td>' + bill.TaxPaid + '</td><td>' + bill.Payor + '</td><td>' + bill.CollDate + '</td></tr>');
          domConstruct.place(prow, dom.byId('paymentTableBody'));
          var oAmnt = (this.json.bills.length > 1) ? "Bill " + idx + " - Original Amount": "Original Amount";
          hrow = domConstruct.toDom('<tr'+oddclass+'><td>' + oAmnt + '</td><td>' + bill.History.OriginalTaxDue + '</td></tr>');
          domConstruct.place(hrow, dom.byId('historyTableBody'));
          if(bill.History.FirstNoticeAmount){
            var dAmnt = (this.json.bills.length > 1) ? "Bill " + idx + " - Deliquent Amount": "Deliquent Amount";
            hrow = domConstruct.toDom('<tr'+oddclass+'><td>' + dAmnt + '</td><td>' + bill.History.FirstNoticeAmount + '</td></tr>');
            domConstruct.place(hrow, dom.byId('historyTableBody'));
          }
          if(bill.History.CurrentTaxAmount){
            var cAmnt = (this.json.bills.length > 1) ? "Bill " + idx + " - Current/Last Amount": "Current/Last Amount";
            hrow = domConstruct.toDom('<tr'+oddclass+'><td>' + cAmnt + '</td><td>' + bill.History.CurrentTaxAmount + '</td></tr>');
            domConstruct.place(hrow, dom.byId('historyTableBody'));
          }
          if(this.json.bills.length > 1){
            domStyle.set(dom.byId('buttonsDiv'), 'display', 'block');
            domEle = domConstruct.toDom('<div class="search-btn" style="padding:4px 8px;margin: 0 4px;display: inline-block;" id="bill'+index+'">View Bill '+idx+'</div>');
            on(domEle, 'click', lang.hitch(this, this.switchBill));
            domConstruct.place(domEle, dom.byId('buttonsDiv'));
          }
        }));
        this.viewStack.switchView(0);
      },

      switchBill: function(evt){
        var billid = parseInt(evt.target.id.replace('bill',''),10);
        this.viewStack.switchView(billid);
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
          if(typeof has('android') === 'undefined'){
            this.printBtnNode = html.create('div', {
              'class': 'myprint-btn jimu-float-trailing',
              'title': 'Print Bill(s)'
            }, this.titleNode);
            this.own(on(this.printBtnNode, 'click', lang.hitch(this, this._printBills)));
          }
        }
      },

      _increaseZIndex: function() {
        html.setStyle(this.domNode, 'zIndex', 9999);
        html.setStyle(this.overlayNode, 'zIndex', 9998);
      },

      _printBills: function() {
        var DocumentContainer = document.getElementById('main');
        var printIframe = document.createElement("iframe");
        printIframe.name = "print_iframe";
        domStyle.set(printIframe, 'visibility', 'hidden');
        //domStyle.set(printIframe, 'zindex', '9999');
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
        this.contentWindow.print();
      },

      _closePrint: function() {
        document.body.removeChild(this.__container__);
      }
    });
  });
