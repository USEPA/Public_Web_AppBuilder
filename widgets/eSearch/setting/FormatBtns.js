define(['dojo/_base/declare',
  'dijit/_WidgetBase',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/on',
  'dojo/Evented',
  'dojo/dom-class'
],
function(declare, _WidgetBase, lang, array, html, on, Evented, domClass) {
  return declare([_WidgetBase, Evented], {
    'class': 'format-buttons',
    nls: null,
    bold: null,
    italic: null,
    underline: null,

    postCreate: function(){
      this.boldBtnNode = html.create('div', {
        'class': (this.bold)?'icon-btn bold-btn selected':'icon-btn bold-btn',
        'title': this.nls.insertbold
      }, this.domNode);

      this.boldBtnNode.innerHTML = 'B';

      this.italicBtnNode = html.create('div', {
        'class': (this.italic)?'icon-btn italic-btn selected':'icon-btn italic-btn',
        'title': this.nls.insertitalic
      }, this.domNode);

      this.italicBtnNode.innerHTML = 'I';

      this.underBtnNode = html.create('div', {
        'class': (this.underline)?'icon-btn under-btn selected':'icon-btn under-btn',
        'title': this.nls.insertunderline
      }, this.domNode);

      this.underBtnNode.innerHTML = 'U';

      this.own(on(this.boldBtnNode, 'click', lang.hitch(this, this._onBoldClick)));
      this.own(on(this.italicBtnNode, 'click', lang.hitch(this, this._onItalicClick)));
      this.own(on(this.underBtnNode, 'click', lang.hitch(this, this._onUnderClick)));
    },

    _onBoldClick: function(evt){
      this.bold = !this.bold;
      domClass.toggle(this.boldBtnNode, 'selected');
      evt.stopPropagation();
      this.emit('onBold', this.bold);
    },

    _onItalicClick: function(evt){
      this.italic = !this.italic;
      domClass.toggle(this.italicBtnNode, 'selected');
      evt.stopPropagation();
      this.emit('onItalic', this.italic);
    },

    _onUnderClick: function(evt){
      this.underline = !this.underline;
      domClass.toggle(this.underBtnNode, 'selected');
      evt.stopPropagation();
      this.emit('onUnderline', this.underline);
    }

  });
});
