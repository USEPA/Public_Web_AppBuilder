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

define([
  'dojo/_base/declare',
  'dojo/_base/fx',
  'dojo/_base/lang',
  'dojo/aspect',
  'dojo/dom-attr',
  'dojo/dom-construct', 
  'dojo/dom-style',
  'dojo/json',
  'dojo/on',
  'dojo/query',
  'dijit/popup',
  'dijit/registry',
  'dijit/TooltipDialog',
  'dojo/text!./Mixin.html',
  'dojo/text!./config.json',
  'xstyle/css!./css/style.css'
], function(
  declare,
  fx,
  lang,
  aspect,
  domAttr,
  domConstruct,
  domStyle,
  JSON,
  on, 
  query,
  popup,
  registry,
  TooltipDialog,
  _womTemplate,
  _womConfig
) {
  var clazz = declare([], {
    _womConfig: JSON.parse(_womConfig),
    _womTemplateString: _womTemplate,
    _womHandlers: [],
    
    postCreate: function() {
      this.inherited(arguments);
      
      aspect.after(this, 'startup', lang.hitch(this, '_womStartup'));
      
      aspect.after(this, 'destroy', lang.hitch(this, '_womDestroy'));
      
       // Set these variables in using this priority: host widget config; _WidgetOpacityMixin config; default value
      this._womOpacityOver = this.config.widgetOpacityOver || this._womConfig.widgetOpacityOver || 1.0;
      this._womOpacityOut = this.config.widgetOpacityOut || this._womConfig.widgetOpacityOut || 0.9;
        
      var nlsPath = this.folderUrl.split('/').slice(0, -3).join('/') + '/' + this._WidgetOpacityMixinPath + '/nls/strings.js';
      
      require(['dojo/i18n!' + nlsPath], lang.hitch(this, function(nls) {
        this._womNls = nls;
        
        // Give the template tags unique IDs for each widget that uses this module.
        this._womTemplateString = lang.replace(this._womTemplateString, {
          _womParentWidget: {
            id: this.id.toString()
          },
          _womNls: {
            max: this._womNls.max,
            min: this._womNls.min,
            widgetOpacity: this._womNls.widgetOpacity
          }
        });
      }));
    },
    
    _womStartup: function() {
      // We can skip this function if any of the following are true:
      //    1. "showOpacitySlider": false in this widget's config.json file.
      //    2. The widget is not in a panel.
      if (this.config.showOpacitySlider === false || !this.inPanel) { 
        return; 
      }
      
      // Get the widget panel and content node
      this._womWidgetPanel = registry.byId(this.id + '_panel');
      if (this._womWidgetPanel) {
        on(this._womWidgetPanel, 'close', lang.hitch(this, '_womClose'));
        var contentNode = query('.jimu-widget-frame', this._womWidgetPanel.domNode);
        if (contentNode.length > 0) {
          this._womWidgetContentNode = contentNode[0];
          if (this._womWidgetPanel.state === 'opened') {
            // This is for preload widgets.
            this._womInitialize();
          } else {
            // This is for widget pool widgets.
            on.once(this._womWidgetPanel, 'open', lang.hitch(this, function() {
              this._womInitialize();
            }));
          }
        }
      }
    },
    
    _womDestroy: function() {
      // If the widget is destroyed, destroy the _womTooltipDialog.
      if (this._womTooltipDialog) {
        this._womTooltipDialog.destroyRecursive();
      }
    },
    
    _womClose: function() {
      // Close the tooltip dialog when the widget panel is closed.
      if (this._womTooltipDialog) {
        domStyle.set(this._womTooltipDialog.domNode, 'opacity', 0.0);
        popup.close(this._womTooltipDialog);
      }
    },
    
    _womInitialize: function() {
      var titleBar = query('div.title', this._womWidgetPanel.domNode);
      if (titleBar.length > 0) {
        this.widgetOpacityBtn = domConstruct.place(
          '<div class="opacity-btn jimu-vcenter jimu-float-trailing" style="margin-top: 0px;"></div>', 
          titleBar[0],
          'last'
        );
        on(this._womWidgetContentNode, 'mouseenter, mouseleave', lang.hitch(this, '_womSetWidgetOpacity'));
        
        // Give things time to initialize
        setTimeout(lang.hitch(this, function() {
          this._womTooltipDialog = new TooltipDialog({
            id: 'womTooltipDialog/' + this.id,
            style: 'width: 250px; outline: none;',
            content: this._womTemplateString,
            onMouseEnter: lang.hitch(this, function() {
              // If the tooltip dialog is fading out, stop the animation.
              if (this.fade) {
                this.fade.stop();
              }
              // Prevent widgets that auto close from closing if the mouse is over the tooltip dialog.
              on.emit(this._womWidgetContentNode, 'mouseenter', {
                bubbles: true,
                cancelable: true
              });
            }),
            // When the mouse leaves the tooltip dialog, start the animation to fade it out after 2 seconds.
            onMouseLeave: lang.hitch(this, function() {
              this._womFadeOut(this._womTooltipDialog.domNode, 2000);
            })
          });
        
          // Give the slider up to 1000 milliseconds to initialize.
          this._womInitializeSlider(10);
          
          // Open the tooltip dialog when the mouse clicks on the opacity button.
          on(this.widgetOpacityBtn, 'click', lang.hitch(this, function(evt) {
            evt.stopImmediatePropagation();  //This keeps the widget from minimizing when the opacity button is clicked.
            if (this._womWidgetPanel.folded === false || this._womWidgetPanel.containerNode.clientHeight > 0) {
              if (this._womOpen) {
                this._womFadeOut(this._womTooltipDialog.domNode, 0);
              } else {
                popup.open({
                  parent: this, 
                  popup: this._womTooltipDialog,
                  around: this.widgetOpacityBtn,
                  orient: ['below', 'below-alt', 'above', 'above-alt'],
                  onCancel: lang.hitch(this, function() {
                    domStyle.set(this._womTooltipDialog.domNode, 'opacity', 0.0);
                    popup.close(this._womTooltipDialog);
                  })
                });
                
                fx.fadeIn({
                  node: this._womTooltipDialog.domNode,
                  duration: 350
                }).play();
                
                this._womOpen = true;
              }
            }
          }));
          
          // This is for when the widget is folded or unfolded.
          if (this._womWidgetPanel.foldableNode) {
            aspect.after(this._womWidgetPanel, 'onFoldStateChanged', lang.hitch(this, '_womOnFoldStateChanged'));
          }
        }), 500);
      }
    },
    
    _womInitializeSlider: function(count) {
      this._womSlider = registry.byId('opacitySlider/' + this.id);
      if (this._womSlider) {
        // Set the opacity button tooltip
        domAttr.set(this.widgetOpacityBtn, 'title', this._womNls.sliderTooltip);
        
        // Set the opacity of the widget's content node when the slider value changes.
        this._womSlider.set('value', this._womOpacityOut || 1.0);
        this._womSlider.on('change', lang.hitch(this, '_womSliderChange'));
      } else if (count > 0) {
        setTimeout(lang.hitch(this, '_womInitializeSlider', count - 1), 100);
      } 
    },

    _womSliderChange: function(value) {
      this._womOpacityOut = value;
      this._womSetWidgetOpacity();
    },

    _womSetWidgetOpacity: function(evt) {
      var opacity;
      var hover = evt && evt.type === 'mouseenter';
      if (this._womWidgetContentNode) {
        if (this._womIsDocked) {
          opacity = this._womOpacityOut;
        } else if (hover) {
          opacity = this._womOpacityOver;
        } else {
          opacity = this._womOpacityOut;
        }
        domStyle.set(this._womWidgetContentNode, 'opacity', opacity);
      }
    },
    
    _womOnFoldStateChanged: function() {
      if (this._womWidgetPanel.folded) {
        domStyle.set(this._womTooltipDialog.domNode, 'opacity', 0.0);
        popup.close(this._womTooltipDialog);
        this._womOpen = false;
      }
    },
    
    _womFadeOut: function(node, delay) {
      var fadeArgs = {
        node: node,
        duration: 700,
        onEnd: lang.hitch(this, function() {
          popup.close(this._womTooltipDialog);
          this._womOpen = false;
        })
      };
      this.fade = fx.fadeOut(fadeArgs);
      this.fade.play(delay, true);
    }

  });

  return clazz;
});
