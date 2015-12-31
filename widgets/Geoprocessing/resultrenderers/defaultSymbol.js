define([
  'dojo/json',
  'dojo/text!./symbol.json',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/jsonUtils',
  'esri/Color'
  ], function(JSON, symbolStr, SimpleLineSymbol, SimpleFillSymbol, symbolUtils, Color){
  var jsonObj = JSON.parse(symbolStr), mo = {};

  mo.pointSymbol = symbolUtils.fromJson(jsonObj.pointSymbol);

  mo.lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
      new Color([0, 69, 117]), 2);

  mo.polygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
      new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([110, 110, 110]), 1),
      new Color([0, 100, 255, 0.6]));

  return mo;
});