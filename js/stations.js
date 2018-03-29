var stationsMarkers = [];

function stationStatus(number) {
    alert(number);
}

window.onload = function () {
    var stations;
    // Recovery of the stations list
    var request = new XMLHttpRequest();
    request.open('get', 'data/Lyon.json', true);
    request.send();
    request.onload = function () {
        stations = JSON.parse(this.responseText);
        var bikeIcon = {
            url: 'data/bike.png',
            size: new google.maps.Size(25, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(12.5, 35)
        };
        // Add stations markers to the map
        for (var i = 0; i < stations.length; i++) {
            var station = stations[i];
            var latLng = new google.maps.LatLng(station['latitude'], station['longitude']);
            var marker = new google.maps.Marker({
                position: latLng,
                map: map,
                visible: false,
                icon: bikeIcon
            });
            google.maps.event.addListener(marker, 'click', function () {
                stationStatus(this.number);
            });
            marker.number = station['number'];
            stationsMarkers.push(marker);
        }
    };

    // Change markers on zoom
    google.maps.event.addListener(map, 'zoom_changed', function () {
        var zoom = map.getZoom();
        for (var i = 0; i < stationsMarkers.length; i++) {
            stationsMarkers[i].setVisible(zoom >= 14);
        }
    });

};
