L.PM.Draw.Line = L.PM.Draw.extend({

    initialize: function(map) {
        this._map = map;
        this._shape = 'Line';
        this.registerButton();
        this.toolbarButtonName = 'drawLine';
    },
    enable: function(options) {
        // enable draw mode

        this._enabled = true;

        // create a new layergroup
        this._layerGroup = new L.LayerGroup();
        this._layerGroup.addTo(this._map);

        // this is the polyLine that'll make up the polygon
        this._polyline = L.polyline([], {color: 'red'});
        this._layerGroup.addLayer(this._polyline);

        // this is the hintline from the mouse cursor to the last marker
        this._hintline = L.polyline([], {
            color: 'red',
            dashArray: [5, 5]
        });
        this._layerGroup.addLayer(this._hintline);


        // change map cursor
        this._map._container.style.cursor = 'crosshair';

        // create a polygon-point on click
        this._map.on('click', this._createLinePoint, this);

        // sync the hintline on mousemove
        this._map.on('mousemove', this._syncHintLine, this);

        // fire drawstart event
        this._map.fire('pm:drawstart', {shape: this._shape});

        // toggle the draw button of the Toolbar in case drawing mode got enabled without the button
        this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, true);
    },
    disable: function() {
        // disable draw mode

        // cancel, if drawing mode isn't even enabled
        if(!this._enabled) {
            return;
        }

        this._enabled = false;

        // reset cursor
        this._map._container.style.cursor = 'default';

        // unbind listeners
        this._map.off('click', this._createLinePoint);
        this._map.off('mousemove', this._syncHintLine);

        // remove layer
        this._map.removeLayer(this._layerGroup);

        // fire drawend event
        this._map.fire('pm:drawend', {shape: this._shape});

        // toggle the draw button of the Toolbar in case drawing mode got disabled without the button
        this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, false);
    },
    enabled: function() {
        return this._enabled;
    },
    toggle: function(options) {
        if(this.enabled()) {
            this.disable();
        } else {
            this.enable(options);
        }
    },
    registerButton: function(map) {
        var drawLineButton = {
            'className': 'icon-line',
            'onClick': function() {

            },
            'afterClick': function(e) {
                self.toggle();
            },
            'doToggle': true,
            'toggleStatus': false
        };
    },
    _syncHintLine: function(e) {

        var linePoints = this._polyline.getLatLngs();

        if(linePoints.length > 0) {
            var lastLinePoint = linePoints[linePoints.length - 1];
            this._hintline.setLatLngs([lastLinePoint, e.latlng]);
        }

    },
    _createLinePoint: function(e) {

        // is this the first point?
        var last = this._polyline.getLatLngs().length === 0 ? false : true;

        this._polyline.addLatLng(e.latlng);
        this._createMarker(e.latlng, last);


        this._hintline.setLatLngs([e.latlng, e.latlng]);

    },
    _createMarker: function(latlng, last) {

        var marker = new L.Marker(latlng, {
            draggable: false,
            icon: L.divIcon({className: 'marker-icon'})
        });

        this._layerGroup.addLayer(marker);

        if(last) {
            marker.on('click', this._finishLine, this);
        }

        return marker;

    },
    _finishLine: function() {

        var coords = this._polyline.getLatLngs();
        var lineLayer = L.polyline(coords).addTo(this._map);

        this.disable();

        this._map.fire('pm:create', {
            shape: this._shape,
            layer: lineLayer
        });
    },
});
