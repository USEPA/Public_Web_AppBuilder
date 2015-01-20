define(['jimu/BaseWidget'], function(BaseWidget){
  function PureAMDWidget(params){
    this.constructor(params);
  }
  var map, baseStartup;

  PureAMDWidget.prototype = BaseWidget.prototype;
  PureAMDWidget.prototype.templateString =
  '<div>This is a pure amd widget.<input type="button" value="Get Map Id" id="amd-mapid"></div>';
  baseStartup = PureAMDWidget.prototype.startup;
  PureAMDWidget.prototype.startup = function(){
    console.log('PureAMDWidget startup');
    baseStartup.call(this);
    map = this.map;
    var elem = document.getElementById('amd-mapid');
    if (elem.addEventListener){  // W3C DOM
      elem.addEventListener('click', getMapId);
    } else if (elem.attachEvent) { // IE DOM
      elem.attachEvent("onclick", getMapId);
    }
  };

  function getMapId(){
    alert(map.id);
  }

  PureAMDWidget.hasStyle = false;
  PureAMDWidget.hasUIFile = false;
  PureAMDWidget.hasLocale = false;
  PureAMDWidget.hasConfig = false;
  return PureAMDWidget;
});


