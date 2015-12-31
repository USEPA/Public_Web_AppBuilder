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
    'dojo/dom-style',
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
    domStyle,
    Evented,
    jsonUtils) {
    return declare([_WidgetBase, Evented], {

      'class': 'widgets-Identify-list',
      _itemCSS: 'identify-list-item',
      _itemSelectedCSS: 'identify-list-item selected',
      _itemAltCSS: 'identify-list-item alt',

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
        domAttr.set(div, 'title', item.zoom2msg);

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
        domAttr.set(removeDivImg, 'title', item.removeResultMsg);
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
        var attValArr, tHasColor, bIndex, eIndex, tColor, vHasColor, vColor;
        var label, attTitle, attVal;
        var arrayLength = attArr.length;
        for (var i = 0; i < arrayLength; i++) {
          attValArr = attArr[i].split(': ');
          attTitle = domConstruct.create('font');
          domAttr.set(attTitle, 'id', this.id.toLowerCase()+item.id);
          if(attValArr[0].toLowerCase().indexOf('<em>') > -1){
            domStyle.set(attTitle, 'font-style', 'italic');
          }
          if(attValArr[0].toLowerCase().indexOf('<strong>') > -1){
            domStyle.set(attTitle, 'font-weight', 'bold');
          }
          if(attValArr[0].toLowerCase().indexOf('<u>') > -1){
            domStyle.set(attTitle, 'text-decoration', 'underline');
          }
          tHasColor = (attValArr[0].toLowerCase().indexOf("<font color='") > -1)?true:false;
          if(tHasColor){
            bIndex = attValArr[0].toLowerCase().indexOf("<font color='") + 13;
            eIndex = attValArr[0].toLowerCase().indexOf("'>", bIndex);
            tColor = attValArr[0].substr(bIndex, eIndex - bIndex);
            domStyle.set(attTitle, 'color', tColor);
          }

          attTitle.textContent = attTitle.innerText = attValArr[0].replace(/<[\/]{0,1}(em|EM|strong|STRONG|font|FONT|u|U)[^><]*>/g, "");
          label = domConstruct.create('p');
          domAttr.set(label, 'id', this.id.toLowerCase()+item.id);
          domClass.add(label, 'label');
          attVal = domConstruct.create('font');

          if(attValArr[1].toLowerCase().indexOf('<em>') > -1){
            domStyle.set(attVal, 'font-style', 'italic');
          }
          if(attValArr[1].toLowerCase().indexOf('<strong>') > -1){
            domStyle.set(attVal, 'font-weight', 'bold');
          }
          if(attValArr[1].toLowerCase().indexOf('<u>') > -1){
            domStyle.set(attVal, 'text-decoration', 'underline');
          }
          vHasColor = (attValArr[1].toLowerCase().indexOf("<font color='") > -1)?true:false;
          if(vHasColor){
            bIndex = attValArr[1].toLowerCase().indexOf("<font color='") + 13;
            eIndex = attValArr[1].toLowerCase().indexOf("'>", bIndex);
            vColor = attValArr[1].substr(bIndex, eIndex - bIndex);
            domStyle.set(attVal, 'color', vColor);
          }

          if (attValArr[1] === 'null') {
            attVal.textContent = attVal.innerText = ": ";
          } else {
            attVal.textContent = attVal.innerText = ": " + attValArr[1].replace(/<[\/]{0,1}(em|EM|strong|STRONG|font|FONT|u|U)[^><]*>/g, "");
          }
          domConstruct.place(attTitle, label);
          domConstruct.place(attVal, label);
          domConstruct.place(label, div);
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
        if(item.links && item.links.length > 0){
          var linksDiv = domConstruct.create("div");
          domConstruct.place(linksDiv, div);
          domClass.add(linksDiv, 'linksdiv');
        }
        //console.info(item.links);
        array.forEach(item.links, function(link){
          if(link.popuptype === "text"){
            var linkText = domConstruct.toDom("<p><a href='" + link.link + "' target='_blank' title='" + link.alias + "'>" + link.alias + "</a></p>");
            domConstruct.place(linkText, linksDiv, 'before');
            domClass.add(linkText, 'labellink');
          }else{
            var linkImg = domConstruct.toDom("<a href='" + link.link + "' target='_blank' title='" + link.alias + "'><img src='" + link.icon + "' alt='" + link.alias + "' border='0' width='20px' height='20px' style='vertical-align: middle;'></a>");
            domConstruct.place(linkImg, linksDiv);
            domClass.add(linkImg, 'linkIcon');
          }
        });
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

        domClass.replace(id, this._itemSelectedCSS, ((item.alt) ? this._itemAltCSS:this._itemCSS));
        if (this._selectedNode) {
          domClass.replace(this._selectedNode, ((item.alt)? this._itemAltCSS:this._itemCSS), this._itemSelectedCSS);
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

        this._selectedNode = id;
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

        this._selectedNode = id;
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
