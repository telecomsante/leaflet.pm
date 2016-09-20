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
      this.options = options;

      if(!this.enabled()) {
        // if it was already enabled, disable first
        // we don't block enabling again because new options might be passed
        this.disable();
      }

      this._enabled = true;

      // init markers
      this._initMarkers();

      // if polygon gets removed from map, disable edit mode
      this._line.on('remove', (e) => {
        this.disable(e.target);
      });

      if(this.options.draggable) {
        this._initDraggableLayer();
      }
    },
  
    enabled: function() {
        return this._enabled;
    },
  
    disable: function(line = this._line) {
      if(!this.enabled()) {
        return false;
      }

      // prevent disabling if polygon is being dragged
      if(line.pm._dragging) {
        return false;
      }
      line.pm._enabled = false;
      line.pm._markerGroup.clearLayers();

      // clean up draggable
      line.off('mousedown');
      line.off('mouseup');

      // remove draggable class
      var el = line._path;
      L.DomUtil.removeClass(el, 'leaflet-pm-draggable');
    },
  
    _initMarkers: function() {
      let map = this._line._map;

      // cleanup old ones first
      if(this._markerGroup) {
        this._markerGroup.clearLayers();
      }

      // add markerGroup to map, markerGroup includes regular and middle markers
      this._markerGroup = new L.LayerGroup();
      map.addLayer(this._markerGroup);

      // create marker for each coordinate
      let coords = this._line._latlngs;

      // the marker array, it includes only the markers that're associated with the coordinates
      this._markers = coords.map(this._createMarker, this);

      // create small markers in the middle of the regular markers
      for(var k = 0; k < coords.length-1; k++) {

        var nextIndex = k+1;
        this._createMiddleMarker(
          this._markers[k], this._markers[nextIndex]
        );
      }
      
      if(this.options.snappable) {
        this._initSnappableMarkers();
      }
    },
  
    _createMarker: function(latlng, index) {
      let marker = new L.Marker(latlng, {
        draggable: true,
        icon: L.divIcon({className: 'marker-icon'})
      });

      marker._origLatLng = latlng;
      marker._index = index;

      marker.on('drag', this._onMarkerDrag, this);
      marker.on('dragend', this._onMarkerDragEnd, this);
      marker.on('contextmenu', this._removeMarker, this);

      this._markerGroup.addLayer(marker);

      return marker;
    },
  
    _createMiddleMarker: function(leftM, rightM) {
      let latlng = this._calcMiddleLatLng(leftM.getLatLng(), rightM.getLatLng());

      let middleMarker = this._createMarker(latlng);
      let icon = L.divIcon({className: 'marker-icon marker-icon-middle'})
      middleMarker.setIcon(icon);

      // save reference to this middle markers on the neighboor regular markers
      leftM._middleMarkerNext = middleMarker;
      rightM._middleMarkerPrev = middleMarker;

      middleMarker.on('click', () => {

        // TODO: move the next two lines inside _addMarker() as soon as
        // https://github.com/Leaflet/Leaflet/issues/4484
        // is fixed
        var icon = L.divIcon({className: 'marker-icon'});
        middleMarker.setIcon(icon);

        this._addMarker(middleMarker, leftM, rightM);
      });
      middleMarker.on('movestart', () => {

        // TODO: This is a workaround. Remove the moveend listener and callback as soon as this is fixed:
        // https://github.com/Leaflet/Leaflet/issues/4484
        middleMarker.on('moveend', function() {
          var icon = L.divIcon({className: 'marker-icon'});
          middleMarker.setIcon(icon);

          middleMarker.off('moveend');
        });

        this._addMarker(middleMarker, leftM, rightM);
      });
    },
  
    _addMarker: function(newM, leftM, rightM) {
      // first, make this middlemarker a regular marker
      newM.off('movestart');
      newM.off('click');

      // now, create the polygon coordinate point for that marker
      let latlng = newM.getLatLng();
      let coords = this._line._latlngs;
      let index = leftM._index + 1;

      coords.splice(index, 0, latlng);

      // associate polygon coordinate with marker coordinate
      newM._origLatLng = coords[index];

      // push into marker array & update the indexes for every marker
      this._markers.splice(index, 0, newM);
      this._markers.map((marker, i) => marker._index = i);

      // create the new middlemarkers
      this._createMiddleMarker(leftM, newM);
      this._createMiddleMarker(newM, rightM);

      // fire edit event
      this._fireEdit();

      if(this.options.snappable) {
        this._initSnappableMarkers();
      }
    },
  
    _removeMarker: function(e) {
      let marker = e.target;
      let coords = this._line._latlngs;
      let index = marker._index;

      // only continue if this is NOT a middle marker (those can't be deleted)
      if(index === undefined) {
        return;
      }

      // remove polygon coordinate from this marker
      coords.splice(index, 1);

      // if the poly has no coordinates left, remove the layer
      // else, redraw it
      if(coords.length < 1) {
        this._line.remove();
      } else {
        this._line.redraw();
      }

      // remove the marker and the middlemarkers next to it from the map
      if(marker._middleMarkerPrev) { 
        this._markerGroup.removeLayer(marker._middleMarkerPrev); 
      }
      if(marker._middleMarkerNext) { 
        this._markerGroup.removeLayer(marker._middleMarkerNext); 
      }
      this._markerGroup.removeLayer(marker);

      // find neighbor marker-indexes
      let leftMarkerIndex = index - 1 < 0 ? this._markers.length - 1 : index - 1;
      let rightMarkerIndex = index + 1 >= this._markers.length ? 0 : index + 1;

      // don't create middlemarkers if there is only one marker left
      if(rightMarkerIndex !== leftMarkerIndex) {
        let leftM = this._markers[leftMarkerIndex];
        let rightM = this._markers[rightMarkerIndex];
        this._createMiddleMarker(leftM, rightM);
      }

      // remove the marker from the markers array & update indexes
      this._markers.splice(index, 1);
      this._markers.map((marker, i) => marker._index = i);

      // fire edit event
      this._fireEdit();
    },
  
    _onMarkerDrag: function(e) {
      // dragged marker
      let marker = e.target;

      // the dragged markers neighbors
      let nextMarkerIndex = marker._index + 1 >= this._markers.length ? 0 : marker._index + 1;
      let prevMarkerIndex = marker._index - 1 < 0 ? this._markers.length - 1 : marker._index - 1;

      // update marker coordinates which will update polygon coordinates
      L.extend(marker._origLatLng, marker._latlng);
      this._line.redraw();

      // update middle markers on the left and right
      // be aware that "next" and "prev" might be interchanged, depending on the geojson array
      let markerLatLng = marker.getLatLng();
      let prevMarkerLatLng = this._markers[prevMarkerIndex].getLatLng();
      let nextMarkerLatLng = this._markers[nextMarkerIndex].getLatLng();

      if(marker._middleMarkerNext) {
        let middleMarkerNextLatLng = this._calcMiddleLatLng(markerLatLng, nextMarkerLatLng);
        marker._middleMarkerNext.setLatLng(middleMarkerNextLatLng);
      }
      
      if(marker._middleMarkerPrev) {
        let middleMarkerPrevLatLng = this._calcMiddleLatLng(markerLatLng, prevMarkerLatLng);
        marker._middleMarkerPrev.setLatLng(middleMarkerPrevLatLng);
      }

    },
  
    _onMarkerDragEnd: function(e) {
      this._fireEdit();
    },
  
    _fireEdit: function () {
      this._line.edited = true;
      this._line.fire('pm:edit');
    },
  
    _calcMiddleLatLng: function(latlng1, latlng2) {
      var map = this._line._map,
        p1 = map.project(latlng1),
        p2 = map.project(latlng2);

      var latlng = map.unproject(p1._add(p2)._divideBy(2));

      return latlng;
    },
});
