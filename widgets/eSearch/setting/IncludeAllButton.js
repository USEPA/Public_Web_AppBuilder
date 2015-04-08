///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define*/
/*jslint nomen: true, sloppy: true*/
define(['dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/on',
  'dojo/i18n!./nls/strings'
  ],
  function (declare, _WidgetBase, _TemplatedMixin, lang, html, on, mainNls) {
    return declare([_WidgetBase, _TemplatedMixin], {
      baseClass: 'widgets-Search-setting-include-all-button',
      templateString: '<div><span nowrap style="white-space:nowrap;">${nls.includeall}' +
        '</span><div class="include-arrow"></div></div>',
      postMixInProperties: function () {
        this.nls = mainNls;
      },

      postCreate: function () {
        this.inherited(arguments);
        this.own(on(this.domNode, 'click', lang.hitch(this, function () {
          this.onClick();
        })));
      },

      enable: function () {
        html.addClass(this.domNode, 'enable');
      },

      disable: function () {
        html.removeClass(this.domNode, 'enable');
      },

      onClick: function () {}

    });
  });
