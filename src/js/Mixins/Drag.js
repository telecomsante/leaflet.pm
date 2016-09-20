var DragMixin = {
    _initDraggableLayer: function() {
        // temporary coord variable for delta calculation
        this._tempDragCoord;

        let PMObj = this._poly || this._line;
      
        // add CSS class
        var el = PMObj._path;
        L.DomUtil.addClass(el, 'leaflet-pm-draggable');


        var onMouseUp = (e) => {

            // re-enable map drag
            PMObj._map.dragging.enable();

            // clear up mousemove event
            PMObj._map.off('mousemove');

            // clear up mouseup event
            PMObj.off('mouseup');

            // show markers again
            this._initMarkers();

            // timeout to prevent click event after drag :-/
            // TODO: do it better as soon as leaflet has a way to do it better :-)
            window.setTimeout(() => {
                // set state
                this._dragging = false;
                L.DomUtil.removeClass(el, 'leaflet-pm-dragging');

                // fire pm:dragend event
                PMObj.fire('pm:dragend');

                // fire edit
                this._fireEdit();
            }, 10);

        };


        var onMouseMove = (e) => {

            if(!this._dragging) {

                // set state
                this._dragging = true;
                L.DomUtil.addClass(el, 'leaflet-pm-dragging');

                // bring it to front to prevent drag interception
                PMObj.bringToFront();

                // disbale map drag
                PMObj._map.dragging.disable();

                // hide markers
                this._markerGroup.clearLayers();

                // fire pm:dragstart event
                PMObj.fire('pm:dragstart');


            }

            this._onLayerDrag(e);

        };

        PMObj.on('mousedown', (e) => {

            // save for delta calculation
            this._tempDragCoord = e.latlng;

            PMObj.on('mouseup', onMouseUp);

            // listen to mousemove on map (instead of polygon),
            // otherwise fast mouse movements stop the drag
            PMObj._map.on('mousemove', onMouseMove);

        });
    },
    dragging: function() {
        return this._dragging;
    },

    _onLayerDrag: function(e) {
        let PMObj = this._poly || this._line;
        // latLng of mouse event
        let latlng = e.latlng;

        // delta coords (how far was dragged)
        let deltaLatLng = {
            lat: latlng.lat - this._tempDragCoord.lat,
            lng: latlng.lng - this._tempDragCoord.lng
        };

        // create the new coordinates array
        let coords = PMObj._latlngs[0];
        let newLatLngs = coords.map((currentLatLng) => {
            return {
                lat: currentLatLng.lat + deltaLatLng.lat,
                lng: currentLatLng.lng + deltaLatLng.lng
            }
        });

        // set new coordinates and redraw
        PMObj.setLatLngs(newLatLngs).redraw();

        // save current latlng for next delta calculation
        this._tempDragCoord = latlng;

        // fire pm:dragstart event
        PMObj.fire('pm:drag');
    },
};
