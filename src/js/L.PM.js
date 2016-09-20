/**
*
* A Leaflet Plugin For Editing Geometry Layers in Leaflet 1.0
* by Sumit Kumar (@TweetsOfSumit)
* Github Repo: https://github.com/codeofsumit/leaflet.pm
*/

L.PM = L.PM || {
    initialize: function() {

        var initLayerGroup = function() {
            this.pm = new L.PM.Edit.LayerGroup(this);
        };
        L.LayerGroup.addInitHook(initLayerGroup);


        var initPolygon = function() {
            this.pm = new L.PM.Edit.Poly(this);
        };
        L.Polygon.addInitHook(initPolygon);

        var initLine = function() {
          this.pm = new L.PM.Edit.Line(this);
        };
        L.Polyline.addInitHook(initLine);

        var initMap = function() {
            this.pm = new L.PM.Map(this);
        };
        L.Map.addInitHook(initMap);

    }
};

// initialize leaflet.pm
L.PM.initialize();
