///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
/*global define */
define(['dojo/_base/declare',
    'dijit/_WidgetBase',
    'dojo/_base/lang',
    'dojox/gfx',
    'dojo/on',
    'dojo/dom-construct',
    'dojo/dom-attr',
    'dojo/_base/array',
    'dojo/dom',
    'dojo/dom-class',
    'dojo/Evented',
    'esri/symbols/jsonUtils'
  ],
  function(declare,
    _WidgetBase,
    lang,
    gfx,
    on,
    domConstruct,
    domAttr,
    array,
    dom,
    domClass,
    Evented,
    jsonUtils) {
    return declare([_WidgetBase, Evented], {

      'class': 'widgets-eLocate-list',
      _itemCSS: 'eLocate-list-item',
      _itemSelectedCSS: 'eLocate-list-item selected',
      _itemAltCSS: 'eLocate-list-item alt',
      zoom2msg: null,
      removeResultMsg: null,


      startup: function() {
        this.items = [];
        this.selectedIndex = -1;
        this._selectedNode = null;
        this._listContainer = domConstruct.create('div');
        domClass.add(this._listContainer, 'identify-list-container');
        this.own(on(this._listContainer, 'click', lang.hitch(this, this._onClick)));
        this.own(on(this._listContainer, 'mouseover', lang.hitch(this, this._onMouseOver)));
        this.own(on(this._listContainer, 'mouseout', lang.hitch(this, this._onMouseOut)));
        domConstruct.place(this._listContainer, this.domNode);
      },

      add: function(item) {
        if (arguments.length === 0) {
          return;
        }
        this.items.push(item);
        var div = domConstruct.create('div');
        domAttr.set(div, 'id', this.id.toLowerCase()+item.id);
        domAttr.set(div, 'title', this.zoom2msg);

        var iconDiv = domConstruct.create('div');
        domAttr.set(iconDiv, 'id', this.id.toLowerCase()+item.id);
        domClass.add(iconDiv, 'iconDiv');
        domConstruct.place(iconDiv, div);

        var removeDiv = domConstruct.create('div');
        domConstruct.place(removeDiv, div);
        domClass.add(removeDiv, 'removediv');
        domAttr.set(removeDiv, 'id', this.id.toLowerCase()+item.id);

        var removeDivImg = domConstruct.create('div');
        domClass.add(removeDivImg, 'removedivImg');
        domConstruct.place(removeDivImg, removeDiv);
        domAttr.set(removeDivImg, 'id', this.id.toLowerCase()+item.id);
        domAttr.set(removeDivImg, 'title', this.removeResultMsg);
        this.own(on(removeDivImg, 'click', lang.hitch(this, this._onRemove)));

        var rTitle = domConstruct.create('strong');
        domAttr.set(rTitle, 'id', this.id.toLowerCase()+item.id);
        domClass.add(rTitle, 'label');
        rTitle.textContent = rTitle.innerText = item.title;
        domConstruct.place(rTitle, div);
        if(item.alt){
          domClass.add(div, this._itemCSS);
        }else{
          domClass.add(div, this._itemAltCSS);
        }

        var attArr = item.rsltcontent.split('<br>');
        var attValArr;
        var label;
        var attTitle;
        var attStrong;
        var arrayLength = attArr.length;
        for (var i = 0; i < arrayLength; i++) {
          if(attArr[i].length > 0){
            attValArr = attArr[i].split('</em>: ');
            attTitle = domConstruct.create('em');
            domAttr.set(attTitle, 'id', this.id.toLowerCase()+item.id);
            if(attValArr[0].indexOf('<em><strong>')>-1){
              attStrong = domConstruct.create('strong');
              domAttr.set(attStrong, 'id', this.id.toLowerCase()+item.id);
              attStrong.textContent = attStrong.innerText = attValArr[0].replace('<em><strong>', '').replace('</strong>', '');
              domConstruct.place(attStrong, attTitle);
            }else{
              attTitle.textContent = attTitle.innerText = attValArr[0].replace('<em>', '');
            }
            //attTitle.textContent = attTitle.innerText = attValArr[0].replace('<em>', '');
            label = domConstruct.create('p');
            domAttr.set(label, 'id', this.id.toLowerCase()+item.id);
            domClass.add(label, 'label');

            if (attValArr[1] === 'null') {
              label.textContent = label.innerText = ": ";
            } else {
              label.textContent = label.innerText = ": " + attValArr[1];
            }

            domConstruct.place(label, div);
            domConstruct.place(attTitle, label, 'first');
          }else{
            label = domConstruct.create('p');
            label.textContent = label.innerText = " ";
            domConstruct.place(label, div);
          }
        }
        if(document.all && !document.addEventListener){
          //do nothing because it is IE8
          //And I can not produce swatches in IE8
        }else{
          var mySurface = gfx.createSurface(iconDiv, 40, 40);
          var descriptors = jsonUtils.getShapeDescriptors(item.sym);
          if(descriptors.defaultShape){
            var shape = mySurface.createShape(descriptors.defaultShape).setFill(descriptors.fill).setStroke(descriptors.stroke);
            shape.applyTransform({ dx: 20, dy: 20 });
          }
        }
        domConstruct.place(div, this._listContainer);
      },

      remove: function(index) {
        this.selectedIndex = -1;
        this._selectedNode = null;
        var item = this.items[index];
        domConstruct.destroy(this.id.toLowerCase() + item.id + '');
        this.items.splice(index, 1);
        if (this.items.length === 0) {
          this._init();
        }
      },

      _init: function() {
        this.selectedIndex = -1;
        this._selectedNode = null;
      },

      clear: function() {
        this.items.length = 0;
        this._listContainer.innerHTML = '';
        this._init();
      },

      _onClick: function(evt) {
        if (evt.target.id === '' && evt.target.parentNode.id === '') {
          return;
        }
        var id = evt.target.id.toLowerCase();
        if (!id) {
          id = evt.target.parentNode.id;
        }
        var item = this._getItemById(id);
        if (!item) {
          return;
        }

        domClass.replace(id, this._itemSelectedCSS, ((item.alt) ? this._itemAltCSS : this._itemCSS));
        if (this._selectedNode) {
          domClass.replace(this._selectedNode, ((item.alt) ? this._itemAltCSS : this._itemCSS), this._itemSelectedCSS);
        }
        this._selectedNode = id;
        this.emit('click', this.selectedIndex, item);
      },

      _onMouseOver: function(evt) {
        if (evt.target.id === '' && evt.target.parentNode.id === '') {
          return;
        }
        var id = evt.target.id.toLowerCase();
        if (!id) {
          id = evt.target.parentNode.id;
        }
        var item = this._getItemById(id);
        if (!item) {
          return;
        }
        this.emit('mouseover', this.selectedIndex, item);
      },

      _onMouseOut: function(evt) {
        if (evt.target.id === '' && evt.target.parentNode.id === '') {
          return;
        }
        var id = evt.target.id.toLowerCase();
        if (!id) {
          id = evt.target.parentNode.id;
        }
        var item = this._getItemById(id);
        if (!item) {
          return;
        }
        this.emit('mouseout', this.selectedIndex, item);
      },

      _onRemove: function(evt) {
        evt.stopPropagation();

        var id = evt.target.id.toLowerCase();
        if (!id) {
          id = evt.target.parentNode.id;
        }
        var item = this._getItemById(id);
        if (!item) {
          return;
        }
        this._selectedNode = id;
        this.emit('remove', this.selectedIndex, item);
      },

      _getItemById: function(id) {
        id = id.replace(this.id.toLowerCase(),'');
        var len = this.items.length;
        var item;
        for (var i = 0; i < len; i++) {
          item = this.items[i];
          if (item.id === id) {
            this.selectedIndex = i;
            return item;
          }
        }
        return null;
      }
    });
  });
