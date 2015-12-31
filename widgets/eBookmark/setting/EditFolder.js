define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    'dojo/_base/html',
    "dojo/on",
    "dijit/_WidgetsInTemplateMixin",
    "jimu/BaseWidgetSetting",
    "dojo/text!./EditFolder.html"
  ],
  function(
    declare,
    lang,
    html,
    on,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    template
    ){
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: "eBookmark-Edit-Folder",
      templateString: template,
      editfolder:null,

      postCreate: function(){
        this.inherited(arguments);
        this.own(on(this.name, 'Change', lang.hitch(this, '_onNameChange')));
      },

      setConfig: function(bookmark){
        this.editfolder = bookmark;
        if (bookmark.name){
          this.name.set('value', bookmark.name);
        }
        this.expandedCbx.setValue(bookmark.expanded);
      },

      getConfig: function(){
        var bookmark = {
          name: this.name.get("value"),
          items: this.editfolder.items,
          expanded: this.expandedCbx.getValue(),
          useradded: true
        };
        return bookmark;
      },

      _onNameChange: function(){
        this._checkRequiredField();
      },

      _checkRequiredField: function(){
        if (!this.name.get('value')){
          if (this.popup){
            this.popup.disableButton(0);
          }
        }else{
          if (this.popup){
            this.popup.enableButton(0);
          }
        }
      }
    });
  });
