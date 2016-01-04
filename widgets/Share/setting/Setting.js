///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB Share Widget
///////////////////////////////////////////////////////////////////////////
/*global define, setTimeout*/
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/Deferred',
    'dojo/on',
    'dojo/sniff',
    'dojo/query',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/CheckBox',
    'dijit/form/ValidationTextBox'
  ],
  function(
    declare,
    lang,
    html,
    Deferred,
    on,
    has,
    dojoQuery,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting
    ) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'widget-share-setting',

      postCreate: function() {
      },

      startup: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        //hack the 'Learn more about this widget link'
        setTimeout(function(){
          var helpLink = dojoQuery('.help-link');
          helpLink[0].href = 'http://gis.calhouncounty.org/WAB/V1.3/widgets/share/help/share_Help.htm';
          html.setStyle(helpLink[0],'display','block');
        },500);

        this.config = config;

        if (config.bitlyLogin) {
          this.bitlyLogin.set('value', config.bitlyLogin);
        }
        if (config.bitlyKey) {
          this.bitlyAPIKey.set('value', config.bitlyKey);
        }
        if (config.title) {
          this.linkTitle.set('value', config.title);
        }
        if (config.image) {
          this.linkImageURL.set('value', config.image);
        }
        if (config.summary) {
          this.linkSummary.set('value', config.summary);
        }
        if (config.hashtags) {
          this.linkHashTags.set('value', config.hashtags);
        }
        if (config.useExtent) {
          this.useMapExtent.setValue(config.useExtent);
        }
      },

      getConfig: function() {
        this.config.bitlyLogin = this.bitlyLogin.get('value');
        this.config.bitlyKey = this.bitlyAPIKey.get('value');
        this.config.title = this.linkTitle.get('value');
        this.config.image = this.linkImageURL.get('value');
        this.config.summary = this.linkSummary.get('value');
        this.config.hashtags = this.linkHashTags.get('value');
        this.config.useExtent = this.useMapExtent.getValue();
        return this.config;
      }
    });
  });
