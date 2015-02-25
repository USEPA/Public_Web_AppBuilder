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

      'class': 'widgets-Search-list',
      _itemCSS: "search-list-item",
      _itemSelectedCSS: "search-list-item selected",
      _itemAltCSS: "search-list-item alt",

      startup: function() {
        this.items = [];
        this.selectedIndex = -1;
        this._selectedNode = null;
        this._listContainer = domConstruct.create("div");
        domClass.add(this._listContainer, "search-list-container");
        this.own(on(this._listContainer, "click", lang.hitch(this, this._onClick)));
        domConstruct.place(this._listContainer, this.domNode);
      },

      add: function(item) {
        if (arguments.length === 0) {
          return;
        }
        this.items.push(item);
        var div = domConstruct.create("div");
        domAttr.set(div, "id", this.id.toLowerCase()+item.id);

        var iconDiv = domConstruct.create("div");
        domAttr.set(iconDiv, "id", this.id.toLowerCase()+item.id);
        domClass.add(iconDiv, "iconDiv");
        domConstruct.place(iconDiv, div);
        var rTitle = domConstruct.create("strong");
        domAttr.set(rTitle, "id", this.id.toLowerCase()+item.id);
        domClass.add(rTitle, "label");
        rTitle.textContent = item.title;
        domConstruct.place(rTitle, div);
        if(item.alt){
          domClass.add(div, this._itemCSS);
        }else{
          domClass.add(div, this._itemAltCSS);
        }

        var attArr = item.content.split('<br>');
        var attValArr;
        var label;
        var attTitle;
        var arrayLength = attArr.length;
        for (var i = 0; i < arrayLength; i++) {
          attValArr = attArr[i].split(': ');
          attTitle = domConstruct.create("em");
          domAttr.set(attTitle, "id", this.id.toLowerCase()+item.id);
          attTitle.textContent = attValArr[0];
          label = domConstruct.create("p");
          domAttr.set(label, "id", this.id.toLowerCase()+item.id);
          domClass.add(label, "label");

          if (attValArr[1] == "null") {
            label.textContent = ": ";
          } else {
            label.textContent = ": " + attValArr[1];
          }

          domConstruct.place(label, div);
          domConstruct.place(attTitle, label, "first");
        }
        var mySurface = gfx.createSurface(iconDiv, 40, 40);
        var descriptors = jsonUtils.getShapeDescriptors(item.sym);
        if(descriptors.defaultShape){
          var shape = mySurface.createShape(descriptors.defaultShape).setFill(descriptors.fill).setStroke(descriptors.stroke);
          shape.applyTransform({ dx: 20, dy: 20 });
        }
        if(item.links && item.links.length > 0){
          var linksDiv = domConstruct.create("div");
          domConstruct.place(linksDiv, div);
          domClass.add(linksDiv, 'linksdiv');
        }
        //console.info(item.links);
        array.forEach(item.links, function(link){
          var linkImg = domConstruct.toDom("<a href='" + link.link + "' target='_blank' title='" + link.alias + "'><img src='" + link.icon + "' alt='" + link.alias + "' border='0' width='20px' height='20px'></a>");
          domConstruct.place(linkImg, linksDiv);
          domClass.add(linkImg, 'linkIcon');
        });
        domConstruct.place(div, this._listContainer);
      },

      remove: function(index) {
        var item = this.items[index];
        domConstruct.destroy(this.id.toLowerCase() + item.id + "");
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
        this._listContainer.innerHTML = "";
        this._init();
      },

      _onClick: function(evt) {
        if (evt.target.id === "" && evt.target.parentNode.id === "") {
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

      _getItemById: function(id) {
        id = id.replace(this.id.toLowerCase(),"");
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
