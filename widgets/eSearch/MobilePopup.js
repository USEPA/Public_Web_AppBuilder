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
/*jslint maxlen: 800, -W116 */
define(['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/_base/fx',
    'dojo/on',
    'dojo/sniff',
    'dojo/dom-style',
    'dojo/query',
    'dojo/dnd/move',
    'dijit/_WidgetBase'
  ],
  function(declare, lang, array, html, baseFx, on, has, domStyle,
    query, Move, _WidgetBase) {
    var history = 0;
    /* global jimuConfig */
    return declare(_WidgetBase, {
      //summary:
      //  show a popup window
      declaredClass: 'jimu.dijit.Popup',
      baseClass: 'jimu-popup',

      //titleLabel: String
      //  the popup window title. if this property is empty, no title display
      titleLabel: '',

      //content: DOM|Dijit|String
      content: null,

      //container: String|DOM
      //  this popup parent dom node
      container: null,

      //buttons: Object[]
      //  this is the object format
      /*=====
      //label: String
      label: '',
      //onClick: function
      onClick: null, if this function return false,
      the popup will not close, or the popup will close after button click.
      //key: dojo/keys
      key: optional, if key is set, the button will response to the key event
    =====*/
      buttons: [],

      //enabledButtons: DOM[]
      enabledButtons: [],
      //disabledButton: DOM[]
      disabledButtons: [],
      // parseKeyhanles: hashMap
      // pauseKeys: [],

      //onClose: function
      //  callback function when click the close button.
      //If this function return false, the popup will not close
      onClose: null,

      _fixedHeight: false,
      // the height of Popup depends on the height of content
      autoHeight: false,

      maxHeight: 800,
      maxWidth: 1024,

      constructor: function() {
        this.buttons = [];
        this.enabledButtons = [];
        this.disabledButtons = [];
        this.pauseKeyHandles = [];
        this.container = jimuConfig.layoutId;
      },

      startup: function() {
        this._dataMixin();
      },

      postCreate: function() {
        this._preProcessing();

        this.inherited(arguments);

        this.domNode.tabIndex = 1;
        // init dom node
        this._initDomNode();

        //position the popup
        this._positioning();

        html.place(this.domNode, this.container);

        html.setStyle(this.domNode, 'outline', 'none');

        this._moveToMiddle();
        // this._limitButtonsMaxWidth();

        if(has('event-orientationchange')){
          this.own(on(window, 'orientationchange', lang.hitch(this, function() {
            if (this._fixedHeight || this.autoHeight) {
              this._calculatePosition();

              this._moveToMiddle();
              return;
            }
            this._positioning();
          })));
        }

        this.own(on(window, 'resize', lang.hitch(this, function() {
          if (this._fixedHeight || this.autoHeight) {
            this._calculatePosition();

            this._moveToMiddle();
            return;
          }
          this._positioning();
        })));

        this.overlayNode = html.create('div', {
          'class': 'popup-overlay'
        }, this.container);

        this._increaseZIndex();
        this._dataMixin();

        baseFx.animateProperty({
          node: this.domNode,
          properties: {
            opacity: 1
          },
          duration: 200
        }).play();

        this.domNode.focus();
      },

      _preProcessing: function() {
        if (typeof this.height === 'number') {
          this._fixedHeight = true;
          this.autoHeight = false;
        }

        if (this.autoHeight) {
          this.maxHeight = 800;
        }
      },

      _createTitleNode: function() {
        this.titleNode = html.create('div', {
          'class': 'title'
        }, this.domNode);
        this.titleLabeNode = html.create('span', {
          'class': 'title-label jimu-float-leading',
          innerHTML: this.titleLabel || '&nbsp'
        }, this.titleNode);
        this.closeBtnNode = html.create('div', {
          'class': 'close-btn jimu-float-trailing'
        }, this.titleNode);
        this.own(on(this.closeBtnNode, 'click', lang.hitch(this, this.close)));
      },

      _initDomNode: function() {
        this._createTitleNode();

        this.contentContainerNode = html.create('div', {
          'class': 'content'
        }, this.domNode);

        if (this.content) {
          if (typeof this.content === 'string') {
            this.contentContainerNode.innerHTML = this.content;
          } else if (this.content.domNode) {
            this.content.placeAt(this.contentContainerNode);
            this.content.popup = this;
          } else if (this.content.nodeType === 1) {
            html.place(this.content, this.contentContainerNode);
          }
        }

        this.buttonContainer = html.create('div', {
          'class': 'button-container'
        }, this.domNode);

        if (this.buttons.length === 0) {
          html.setStyle(this.buttonContainer, 'display', 'none');
        }

        for (var i = this.buttons.length - 1; i > -1; i--) {
          this._createButton(this.buttons[i]);
          if (this.buttons[i].disable) {
            this.disableButton(i);
          }
        }
      },

      _limitButtonsMaxWidth: function() {
        var btnLength = this.enabledButtons.length;
        if (btnLength === 0) {
          return;
        }
        var btnContainerBox = html.getContentBox(this.buttonContainer);
        var btnMarginBox = html.getMarginExtents(this.enabledButtons[0]);
        var btnPbBox = html.getPadBorderExtents(this.enabledButtons[0]);
        var btnMaxWidth = 0;
        //it seems IE 8 ignores border-box when using min-height/width on the same element
        var _ie8hackWidth = has('ie') === 8 ? btnPbBox.l + btnPbBox.r : 0;
        btnMaxWidth = (btnContainerBox.w -
          (btnMarginBox.l + btnMarginBox.r + _ie8hackWidth) *
          btnLength) / btnLength;

        if (btnMaxWidth > 0) {
          array.forEach(this.enabledButtons, lang.hitch(this, function(btn) {
            html.setStyle(btn, 'maxWidth', btnMaxWidth + 'px');
          }));
          array.forEach(this.disabledButtons, lang.hitch(this, function(btn) {
            html.setStyle(btn, 'maxWidth', btnMaxWidth + 'px');
          }));
        }
      },

      _moveableNode: function(width, tolerance) {
        if (this.moveable) {
          this.moveable.destroy();
          this.moveable = null;
        }
        var containerBox = html.getMarginBox(this.container);
        containerBox.l = containerBox.l - width + tolerance;
        containerBox.w = containerBox.w + 2 * (width - tolerance);

        this.moveable = new Move.boxConstrainedMoveable(this.domNode, {
          box: containerBox,
          handle: this.handleNode,
          within: true
        });
        this.own(on(this.moveable, 'Moving', lang.hitch(this, this.onMoving)));
        this.own(on(this.moveable, 'MoveStop', lang.hitch(this, this.onMoveStop)));
      },

      _getHeaderBox: function() {
        var headerBox;
        if (query('#header').length === 0) {
          headerBox = {
            t: 0,
            l: 0,
            w: 0,
            h: 0
          };
        } else {
          headerBox = html.getMarginBox('header');
        }

        return headerBox;
      },

      _getFooterBox: function() {
        var footerBox;
        if (query('.footer', this.container).length === 0) {
          footerBox = {
            t: 0,
            l: 0,
            w: 0,
            h: 0
          };
        } else {
          footerBox = html.getMarginBox(query('.footer', this.container)[0]);
        }

        return footerBox;
      },

      _getScreenSize: function() {
        var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        return{
          width: width,
          height:height
        };
      },

      _calculatePosition: function() {
        var box = html.getContentBox(this.container);
        var headerBox = this._getHeaderBox(),
          footerBox = this._getFooterBox();
        var screen = this._getScreenSize();
        this._calculateHeight();
        var flexHeight = box.h - headerBox.h - footerBox.h - 40;
        var initHeight = 0;
        if (this._fixedHeight) {
          initHeight = this.height;
        } else if (this.autoHeight) {
          initHeight = flexHeight - 100 * 2; // tolerance
        } else {
          this.height = flexHeight > this.maxHeight ? this.maxHeight : flexHeight;
          initHeight = this.height;
        }

        var top = (flexHeight - initHeight) / 2 + headerBox.h + 20;
        top = top < headerBox.h ? headerBox.h : top;

        this.width = this.width || this.maxWidth;
        if (this.width > screen.width){
          this.width = screen.width;
        }
        if(this.width < screen.width && this.width < this.maxWidth){
          this.width = (screen.width > this.maxWidth)?this.maxWidth:screen.width;
        }
        var left = (box.w - this.width) / 2;

        html.setStyle(this.domNode, {
          left: left + 'px',
          top: top + 'px',
          width: this.width + 'px'
        });
      },

      _calculateHeight: function() {
        var screen = this._getScreenSize();
        if (!this.autoHeight) { // position: absolute
          if(this.height > screen.height){
            this.height = screen.height;
          }
          if(this.height < screen.height && this.height < this.maxHeight){
            this.height = (screen.height > this.maxHeight)?this.maxHeight:screen.height;
          }
          html.setStyle(this.domNode, 'height', this.height + 'px');
          html.addClass(this.contentContainerNode, 'content-absolute');
          html.addClass(this.buttonContainer, 'button-container-absolute');

          if (this.buttons.length === 0) {
            html.setStyle(this.contentContainerNode, {
              bottom: '15px'
            });
          }
        } else { // position: static
          html.setStyle(this.domNode, 'height', 'auto');
          html.addClass(this.contentContainerNode, 'content-static');

          if (this.buttons.length === 0) {
            html.setStyle(this.contentContainerNode, {
              marginBottom: '15px'
            });
          }
        }
        if(screen.height >= this.maxHeight || screen.width >= this.maxWidth){
          this._moveableNode(this.width, 100);
          domStyle.set(this.handleNode, 'cursor', 'move');
        }else{
          domStyle.set(this.handleNode, 'cursor', 'unset');
          if (this.moveable) {
            this.moveable.destroy();
            this.moveable = null;
          }
        }
      },

      _moveToMiddle: function() {
        if (this.autoHeight) {
          var selfBox = html.getMarginBox(this.domNode);
          var box = html.getContentBox(this.container);
          var headerBox = this._getHeaderBox(),
            footerBox = this._getFooterBox();

          var flexHeight = box.h - headerBox.h - footerBox.h - 40;
          var initHeight = 0;
          initHeight = selfBox.h || flexHeight - 100 * 2; // tolerance

          var top = (flexHeight - initHeight) / 2 + headerBox.h + 20;
          top = top < headerBox.h ? headerBox.h : top;

          var left = (box.w - this.width) / 2;

          html.setStyle(this.domNode, {
            left: left + 'px',
            top: top + 'px',
            width: this.width + 'px'
          });
        }
      },

      _positioning: function() {
        this._calculatePosition();
        this._calculateHeight();
      },

      _increaseZIndex: function() {
        html.setStyle(this.domNode, 'zIndex', history + 501);
        html.setStyle(this.overlayNode, 'zIndex', history + 500);
        history++;
      },

      onMoving: function(mover) {
        html.setStyle(mover.node, 'opacity', 0.9);
      },

      onMoveStop: function(mover) {
        html.setStyle(mover.node, 'opacity', 1);
      },

      close: function() {
        if (this.onClose && this.onClose() === false) {
          return;
        }

        var parent = this.domNode.parentNode;
        var cloneNode = lang.clone(this.domNode);
        html.setStyle(this.domNode, 'display', 'none');
        html.destroy(this.overlayNode);
        this.destroy();
        this.moveable.destroy();
        html.place(cloneNode, parent);

        baseFx.animateProperty({
          node: cloneNode,
          properties: {
            opacity: 0
          },
          duration: 200,
          onEnd: function() {
            html.destroy(cloneNode);
          }
        }).play();
      },

      addButton: function(btn) {
        this._createButton(btn);
      },

      _createButton: function(button) {
        var node = html.create('div', {
          'class': 'jimu-popup-btn jimu-float-trailing jimu-leading-margin1',
          'innerHTML': button.label
        }, this.buttonContainer);
        this.enabledButtons.unshift(node);

        var disableNode = html.create('div', {
          'class': 'jimu-popup-btn jimu-state-disabled jimu-float-trailing jimu-leading-margin1',
          'innerHTML': button.label,
          'style': {
            display: 'none'
          }
        }, this.buttonContainer);
        this.disabledButtons.unshift(disableNode);

        var eventName = 'click';

        if ('ontouchend' in node) {
          //fix a bug that can't bind click event in Mobile Safari
          eventName = 'touchend';
        }

        this.own(on(node, eventName, lang.hitch(this, function(evt) {
          //we don't close popup because that maybe the
          //listener function is async
          if (button.onClick) {
            button.onClick(evt);
          } else {
            this.close();
          }
        })));
        // var existKey = false;
        // if (typeof button.key === 'number') {
        //   for (var attr in keys) {
        //     if (keys[attr] === button.key) {
        //       existKey = true;
        //       break;
        //     }
        //   }
        // }
        // if (existKey) {
        //   this.own(on(this.domNode, 'keydown', lang.hitch(this, function(event) {
        //     var keyCode = event.keyCode !== undefined ? event.keyCode : event.which;
        //     if (keyCode === button.key && this.pauseKeys.indexOf(keyCode) === -1) {
        //       node.click();
        //     }
        //   })));
        // }
      },

      enableButton: function(idx) {
        // var btn = null;
        if (typeof idx === 'number') {
          html.setStyle(this.enabledButtons[idx], 'display', 'inline-block');
          html.setStyle(this.disabledButtons[idx], 'display', 'none');

          // btn = this.buttons[idx];
          // if (btn && btn.key && this.pauseKeys.indexOf(btn.key) > -1) {
          //   this.pauseKeys.splice(this.pauseKeys.indexOf(btn.key), 1);
          // }
        } else {
          array.forEach(this.enabledButtons[idx], lang.hitch(this, function(itm) {
            html.setStyle(itm, 'display', 'inline-block');
          }));
          array.forEach(this.disabledButtons[idx], lang.hitch(this, function(itm) {
            html.setStyle(itm, 'display', 'none');
          }));
          // this.pauseKeys.splice(0, this.pauseKeys.length);
        }
      },

      disableButton: function(idx) {
        // var btn = null;
        if (typeof idx === 'number') {
          html.setStyle(this.disabledButtons[idx], 'display', 'inline-block');
          html.setStyle(this.enabledButtons[idx], 'display', 'none');

          // btn = this.buttons[idx];
          // if (btn && btn.key && this.pauseKeys.indexOf(btn.key) === -1) {
          //   this.pauseKeys.push(btn.key);
          // }
        } else {
          array.forEach(this.disabledButtons, lang.hitch(this, function(itm) {
            html.setStyle(itm, 'display', 'inline-block');
          }));
          array.forEach(this.enabledButtons, lang.hitch(this, function(itm) {
            html.setStyle(itm, 'display', 'none');
          }));
          // array.forEach(this.buttons, lang.hitch(this, function(btn) {
          //   if (btn && btn.key && this.pauseKeys.indexOf(btn.key) === -1) {
          //     this.pauseKeys.push(btn.key);
          //   }
          // }));
        }
      }
    });
  });
