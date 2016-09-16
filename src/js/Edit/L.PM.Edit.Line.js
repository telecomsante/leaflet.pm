L.PM.Edit.Line = L.PM.Edit.extend({
    initialize: function(line) {
        this._line = line;
        this._enabled = false;
    },
    toggleEdit: function(options) {
        if(!this.enabled()) {
            this.enable(options);
        } else {
            this.disable();
        }
    },
    enable: function(options = {}) {
    },
    enabled: function() {
        return this._enabled;
    },
    disable: function(line = this._line) {
    },
    _initMarkers: function() {
    },
    createMarker: function(latlng, index) {
    },
    _createMiddleMarker: function(leftM, rightM) {
    },
    _addMarker: function(newM, leftM, rightM) {
    },
    _removeMarker: function(e) {
    },
    _onMarkerDrag: function(e) {
    },
    _onMarkerDragEnd: function(e) {
    },
    _fireEdit: function () {
    },
    _calcMiddleLatLng: function(latlng1, latlng2) {
    },
});
