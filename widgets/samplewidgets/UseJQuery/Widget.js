define(['require',
  'jimu/BaseWidget',
  'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js'],
function(require, BaseWidget, $){
  var map, baseFunctions = {};
  //first, you should create a constructor function
  function UseJQueryWidget(params){
    this.constructor(params);
  }

  //inherit from the BaseWidget
  UseJQueryWidget.prototype = BaseWidget.prototype;
  //here, we should load template file sync. or you can use a amd
  //text plugin to load the template file
  $.ajax(require.toUrl('./Widget.html'), {async: false}).done(function(data){
    UseJQueryWidget.prototype.templateString = data;
  });

  baseFunctions.startup = UseJQueryWidget.prototype.startup;
  baseFunctions.postCreate = UseJQueryWidget.prototype.postCreate;

  UseJQueryWidget.prototype.startup = function(){
    console.log('UseJQueryWidget startup');
    baseFunctions.startup.call(this);

    map = this.map;
    $('.jimu-widget-use-jquery .map-id').click(getMapId);
    $('.jimu-widget-use-jquery .my-title').text('title added by jquery.');
  };

  function getMapId(){
    alert(map.id);
  }

  UseJQueryWidget.hasStyle = false;
  UseJQueryWidget.hasUIFile = false;
  UseJQueryWidget.hasLocale = false;
  UseJQueryWidget.hasConfig = false;
  return UseJQueryWidget;
});


