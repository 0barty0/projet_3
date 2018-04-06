class Booking {
    constructor(number, name) {
        this.number = number;
        this.name = name;
        this.time = Date.now();
    }
}

class Canvas {
    constructor() {
        this.context = document.getElementById('canvas').getContext('2d');
        this.clickX = new Array();
        this.clickY = new Array();
        this.clickDrag = new Array();
        this.paint = false;
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        // Event listeners
        var canvas = this;
        $('#canvas').mousedown(function (e) {
            var mouseX = e.pageX - this.offsetLeft;
            var mouseY = e.pageY - this.offsetTop;
            canvas.paint = true;
            canvas.addClick(mouseX, mouseY);
            canvas.redraw();
        });

        $('#canvas').mousemove(function (e) {
            if (canvas.paint) {
                canvas.addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
                canvas.redraw();
            }
        });

        $('#canvas').mouseup(function (e) {
            canvas.paint = false;
        });

        $('#canvas').mouseleave(function (e) {
            canvas.paint = false;
        });
    }
    addClick(x, y, dragging) {
        this.clickX.push(x);
        this.clickY.push(y);
        this.clickDrag.push(dragging);
    }
    redraw() {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.context.stokeStyle = "#df4b26";
        this.context.lineJoin = "round";
        this.context.lineWidth = 5;

        for (var i = 0; i < this.clickX.length; i++) {
            this.context.beginPath();

            if (this.clickDrag[i] && i) {
                this.context.moveTo(this.clickX[i - 1], this.clickY[i - 1]);
            } else {
                this.context.moveTo(this.clickX[i] - 1, this.clickY[i] - 1);
            }
            this.context.lineTo(this.clickX[i], this.clickY[i]);
            this.context.closePath();
            this.context.stroke();
        }
    }
}

var stationsMarkers = [],
    station, intervalID, counter;



function stationStatus(number) {

    // API REST JCDecaux
    var reqUrl = "https://api.jcdecaux.com/vls/v1/stations/" + number + "?contract=lyon&apiKey=a077fde6a261a60b1653cd0462c51eb664a29501";
    var reqStation = new XMLHttpRequest();
    reqStation.open("get", reqUrl, true);
    reqStation.send();
    reqStation.onload = function () {
        station = JSON.parse(reqStation.response);

        $('#canvas_container').css('display', 'none');

        // Update station informations
        $('#info_station').css('display', 'block');

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
    };
}

function bookingStatus() {
    var minutes = Math.floor(sessionStorage.counter / 60);
    var seconds = sessionStorage.counter - minutes * 60;

    $('#booking_panel p').html('1 vélo réservé à la station ' + sessionStorage.name + ' pour ');
    $('#booking_panel p').append('<span id="counter">' +
        minutes + ' min ' + seconds + ' s</span>');
}

function updateStatus() {
    sessionStorage.counter--;
    var minutes = Math.floor(sessionStorage.counter / 60);
    var seconds = sessionStorage.counter - minutes * 60;
    $('#counter').text(minutes + ' min ' + seconds + ' s');
    if (sessionStorage.counter <= 0) {
        clearInterval(intervalID);
        $('#booking_panel p').html('Votre réservation à la station ' + sessionStorage.name + ' a expirée.');
        setTimeout(function () {
            $('#booking_panel p').html('');
        }, 4000);
    }
}

window.onload = function () {
    // Recovery of the last booking
    if (sessionStorage.length > 0) {
        sessionStorage.counter = 1200 - Math.floor((Date.now() - sessionStorage.time) / 1000);
        if (sessionStorage.counter > 0) {
            bookingStatus();
            intervalID = setInterval("updateStatus();", 1000);
        }
    }

    var stations;
    // Recovery of the stations list
    var request = new XMLHttpRequest();
    request.open('get', 'data/Lyon.json', true);
    request.send();
    request.onload = function () {
        stations = JSON.parse(this.responseText);
        var bikeIcon = {
            url: 'data/bike.png',
            size: new google.maps.Size(40, 52),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 52)
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

        // Add markers clusterer
        var clusterStyles = [
            {
                url: 'data/bike.png',
                height: 52,
                width: 40,
                anchor: [27, 0],
                textSize: 12
            }
        ]

        var mcOptions = {
            gridSize: 80,
            styles: clusterStyles,
            maxZoom: 14
        }

        var markerCluster = new MarkerClusterer(map, stationsMarkers, mcOptions);

    };

    // Change markers on zoom
    google.maps.event.addListener(map, 'zoom_changed', function () {
        var zoom = map.getZoom();
        stationsMarkers.forEach(function (marker) {
            marker.setVisible(zoom >= 14);
        });
    });

    // Booking button
    $('#booking_btn').click(function () {
        $('#canvas_container').slideDown(400);
        var canvas = new Canvas();
    });

    // Confirm button
    $('#confirm_btn').click(function () {
        var booking = new Booking(station.number, station.name);
        sessionStorage.name = booking.name;
        sessionStorage.time = booking.time;
        sessionStorage.counter = 1200;
        bookingStatus();
        clearInterval(intervalID);
        intervalID = setInterval("updateStatus();", 1000);
        $('#canvas_container').slideUp(400);
    });
};
