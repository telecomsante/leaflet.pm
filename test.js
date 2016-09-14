const map = L.map('map').setView([48.1192, -1.6435], 13);

map.on('pm:create', function(e) {
    alert('pm:create event fired. See console for details');
    console.log(e);
});

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.pm.addControls({
    drawPolyline: true,
    drawPolygon: true,
    deleteLayer: false,
});
