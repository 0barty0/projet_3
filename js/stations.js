var stationsMarkers = [];
var station;

class Booking {
    constructor(number, name) {
        this.number = number;
        this.name = name;
        this.time = Date.now();
    }
}

function stationStatus(number) {

    // API REST JCDecaux
    var reqUrl = "https://api.jcdecaux.com/vls/v1/stations/" + number + "?contract=lyon&apiKey=a077fde6a261a60b1653cd0462c51eb664a29501";
    var reqStation = new XMLHttpRequest();
    reqStation.open("get", reqUrl, true);
    reqStation.send();
    reqStation.onload = function () {
        station = JSON.parse(reqStation.response);

        // Update station informations

        var index = station.name.indexOf('-');
        station.name = station.name.slice(index + 1);
        $('#name_station').text(station.name);
        $('#address_station').text(station['address']);

        var status = (station.status === 'OPEN') ? 'ouvert' : 'fermé';
        $('#status').text('État : ' + status);

        var banking = (station.banking) ? 'oui' : 'non';
        $('#banking').text('Terminal de paiement : ' + banking);

        $('#bike_stands').text(station.bike_stands + ' places');
        $('#available_bikes').text(station.available_bikes + ' vélos disponibles');

        var lastUpdate = new Date(station.last_update);
        $('#last_update').text('Mise à jour à : ' + lastUpdate.getHours() + 'h' + lastUpdate.getMinutes() + 'min' + lastUpdate.getSeconds() + 's');

        $('#bookingBtn').css('visibility', 'visible');
    };
}

function bookingStatus() {
    $('#booking_panel p').text('1 vélo réservé à la station ' + sessionStorage.name + ' pour 20 min');
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
        stations.forEach(function (station) {
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
        });
    };

    // Change markers on zoom
    google.maps.event.addListener(map, 'zoom_changed', function () {
        var zoom = map.getZoom();
        stationsMarkers.forEach(function (marker) {
            marker.setVisible(zoom >= 14);
        });
    });

    // Booking button
    $('#bookingBtn').click(function () {
        var booking = new Booking(station.number, station.name);
        sessionStorage.name = booking.name;
        sessionStorage.time = booking.time;
        bookingStatus();
    });
};
