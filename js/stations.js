class Booking {
    constructor(number, name) {
        this.number = number;
        this.name = name;
        this.time = Date.now();
    }
    status() {
        var counter = 1200 - Math.floor((Date.now() - this.time) / 1000);

        if (counter > 0) {
            var minutes = Math.floor(counter / 60);
            var seconds = counter - minutes * 60;

            var pContainer = $('<div></div>').attr('id', 'booking' + this.number).addClass('booking');
            var pElmt = $('<p></p>');
            var spanElmt = $('<span></span>').attr('id', 'counter');
            var cancelBtn = $('<button>Annuler</button>').addClass('btn').attr('id', 'cancel_btn');

            pElmt.html('1 vélo réservé à la station ' + this.name + '<br/> pour ');
            spanElmt.text(minutes + ' min ' + seconds + ' s');

            var booking = this;
            cancelBtn.click(function () {
                booking.cancel();
            });

            pElmt.append(spanElmt);
            pContainer.append(pElmt);
            pContainer.append(cancelBtn);
            $('#booking_panel').append(pContainer);

            intervalID = setInterval(function () {
                booking.update();
            }, 1000);
        }
    }
    update() {
        var number = this.number;
        var counter = 1200 - Math.floor((Date.now() - this.time) / 1000);
        var minutes = Math.floor(counter / 60);
        var seconds = counter - minutes * 60;
        $('#counter').text(minutes + ' min ' + seconds + ' s');

        if (counter <= 0) {
            clearInterval(intervalID);
            $('#cancel_btn').remove();
            $('#booking' + number + ' p').text('Votre réservation à la station ' + this.name + ' a expirée.');
            sessionStorage.removeItem('booking');
            setTimeout(function () {
                $('#booking' + number).remove();
            }, 4000);
        }
    }
    cancel() {
        clearInterval(intervalID);
        var number = this.number;
        $('#cancel_btn').remove();
        $('#booking' + number + ' p').text('Votre réservation à la station ' + this.name + ' est annulée.');

        setTimeout(function () {
            $('#booking' + number).remove();
        }, 4000);

        sessionStorage.removeItem('booking');

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
            var mouseX = e.pageX - this.parentNode.offsetLeft - this.offsetLeft - pageXOffset;
            var mouseY = e.pageY - this.parentNode.offsetTop - this.offsetTop - pageYOffset;

            canvas.paint = true;
            canvas.addClick(mouseX, mouseY);
            canvas.redraw();
        });

        $('#canvas').mousemove(function (e) {
            if (canvas.paint) {
                var mouseX = e.pageX - this.parentNode.offsetLeft - this.offsetLeft - pageXOffset;
                var mouseY = e.pageY - this.parentNode.offsetTop - this.offsetTop - pageYOffset;
                canvas.addClick(mouseX, mouseY, true);
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
    station, intervalID, counter, booking;



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
        $('#info_station').animate({
            opacity: 1
        });

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

window.onload = function () {
    // Recovery of the last booking
    if (sessionStorage.length > 0) {
        var storedBooking = JSON.parse(sessionStorage.booking);
        booking = new Booking(storedBooking.number, storedBooking.name);
        booking.time = storedBooking.time;
        booking.status();
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
        $('#fade').fadeIn(400);
        $('#canvas_container').fadeIn(400);
        var canvas = new Canvas();
    });

    // Confirm button
    $('#confirm_btn').click(function () {
        $('#fade').fadeOut(400);
        $('#canvas_container').fadeOut(400);

        clearInterval(intervalID);
        $('#booking_panel').html('');

        booking = new Booking(station.number, station.name);
        sessionStorage.booking = JSON.stringify(booking);
        booking.status();
        $('#canvas_container').slideUp(400);
    });
};
