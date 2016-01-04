define(['dojo/_base/declare',
  'jimu/BaseWidget'
],
function(declare, BaseWidget) {
  var clazz = declare([BaseWidget], {
    templateString: '<div>This is a very simple widget. ' +
    '<input type="button" value="Get Map Id" data-dojo-attach-event="click:_getMapId">.</div>',

    _getMapId: function(){
      alert(this.map.id);
    }
  });
  return clazz;
});