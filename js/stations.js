class Booking {
    constructor(number, name) {
        this.number = number;
        this.name = name;
        this.time = Date.now();
    }
    status() {
        let counter = 1200 - Math.floor((Date.now() - this.time) / 1000);

        if (counter > 0) {
            let minutes = Math.floor(counter / 60),
                seconds = counter - minutes * 60,
                pContainer = $('<div></div>').attr('id', 'booking' + this.number).addClass('booking'),
                pElmt = $('<p></p>'),
                spanElmt = $('<span></span>').attr('id', 'counter'),
                cancelBtn = $('<button>Annuler</button>').addClass('btn').attr('id', 'cancel_btn');

            pElmt.html('1 vélo réservé à la station ' + this.name + ' pour &shy;');
            spanElmt.text(minutes + ' min ' + seconds + ' s');

            let booking = this;
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
        let number = this.number,
            counter = 1200 - Math.floor((Date.now() - this.time) / 1000),
            minutes = Math.floor(counter / 60),
            seconds = counter - minutes * 60;
        $('#counter').text(minutes + ' min ' + seconds + ' s');

        if (counter <= 0) {
            clearInterval(intervalID);
            $('#cancel_btn').remove();
            $('#booking' + number + ' p').text('Votre réservation à la station ' + this.name + ' a expirée.');
            sessionStorage.removeItem('booking');
            setTimeout(function () {
                $('#booking' + number).fadeOut(400, function () {
                    this.remove();
                });
            }, 4000);
        }
    }
    cancel() {
        clearInterval(intervalID);
        let number = this.number;
        $('#cancel_btn').remove();
        $('#booking' + number + ' p').text('Votre réservation à la station ' + this.name + ' est annulée.');

        setTimeout(function () {
            $('#booking' + number).fadeOut(400, function () {
                this.remove();
            });
        }, 4000);

        sessionStorage.removeItem('booking');

    }
    setSessionStorage() {
        sessionStorage.booking = JSON.stringify({
            'number': this.number,
            'name': this.name,
            'time': this.time
        });
    }
    getSessionStorage() {
        let booking = JSON.parse(sessionStorage.booking);
        this.number = booking.number;
        this.name = booking.name;
        this.time = booking.time;
    }
}

class Canvas {
    constructor() {
        this.context = document.getElementById('canvas').getContext('2d');
        this.offSet = $('#canvas').offset();
        this.clickX = new Array();
        this.clickY = new Array();
        this.clickDrag = new Array();
        this.paint = false;
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        // Event listeners
        var canvas = this;
        $('#canvas').mousedown(function (e) {
            let mouseX = e.pageX - canvas.offSet.left,
                mouseY = e.pageY - canvas.offSet.top;
            canvas.paint = true;
            canvas.addClick(mouseX, mouseY);
            canvas.redraw();
        });

        $('#canvas').mousemove(function (e) {
            if (canvas.paint) {
                let mouseX = e.pageX - canvas.offSet.left,
                    mouseY = e.pageY - canvas.offSet.top;
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

        for (let i = 0; i < this.clickX.length; i++) {
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

var slide = 1,
    slidesLeft = [],
    slidesRight = [2, 3, 4, 5],
    stationsMarkers = [],
    station, intervalID, booking;

function updateNav() {
    switch (slide) {
        case 1:
            $('#previous_control').css('visibility', 'hidden');
            break;
        case 5:
            $('#next_control').css('visibility', 'hidden');
            break;
        default:
            $('#previous_control').css('visibility', 'visible');
            $('#next_control').css('visibility', 'visible');
    }
}

function updateSlides() {
    slidesLeft.forEach(function (nbSlide, index) {
        $('#slide' + nbSlide).removeClass();
        $('#slide' + nbSlide).addClass('left' + (index + 1));
    });

    slidesRight.forEach(function (nbSlide, index) {
        $('#slide' + nbSlide).removeClass();
        $('#slide' + nbSlide).addClass('right' + (index + 1));
    });

    $('#slide' + slide).removeClass();
}

function stationStatus(number) {

    // API REST JCDecaux
    let reqUrl = "https://api.jcdecaux.com/vls/v1/stations/" + number + "?contract=lyon&apiKey=a077fde6a261a60b1653cd0462c51eb664a29501",
        reqStation = new XMLHttpRequest();
    reqStation.open("get", reqUrl, true);
    reqStation.send();
    reqStation.onload = function () {
        station = JSON.parse(reqStation.response);

        $('#canvas_container').css('display', 'none');

        // Update station informations
        if (window.innerWidth < 767) {

            $('#info_station').fadeIn(400);
        }

        $('#info_station').animate({
            opacity: 1
        });

        let index = station.name.indexOf('-');
        station.name = station.name.slice(index + 1);
        $('#name_station').text(station.name);
        $('#address_station').text(station['address']);

        let status = (station.status === 'OPEN') ? 'ouvert' : 'fermé';
        $('#status').text('État : ' + status);

        let banking = (station.banking) ? 'oui' : 'non';
        $('#banking').text('Terminal de paiement : ' + banking);

        $('#bike_stands').text(station.bike_stands + ' places');
        $('#available_bikes').text(station.available_bikes + ' vélos disponibles');

        let lastUpdate = new Date(station.last_update);
        $('#last_update').text('Mise à jour à : ' + lastUpdate.getHours() + 'h' + lastUpdate.getMinutes() + 'min' + lastUpdate.getSeconds() + 's');

        if (station.status === 'OPEN' && station.available_bikes > 0) {
            $('#booking_btn').css('display', 'block');
        } else {
            $('#booking_btn').css('display', 'none');
        }
    };
}

function toggleBounce(marker) {
    for (let i = 0; i < stationsMarkers.length; i++) {
        stationsMarkers[i].setAnimation(null);
    }
    marker.setAnimation(google.maps.Animation.BOUNCE);
}

window.onload = function () {
    // Recovery of the last booking
    if (sessionStorage.getItem('booking')) {
        booking = new Booking();
        booking.getSessionStorage();
        booking.status();
    }

    // Slider
    $('#next_control').click(function () {
        slidesLeft.unshift(slide);
        slide = slidesRight.shift();
        updateSlides();
        updateNav();
    });

    $('#previous_control').click(function () {
        slidesRight.unshift(slide);
        slide = slidesLeft.shift();
        updateSlides();
        updateNav();
    });

    // Recovery of the stations list
    let stations,
        request = new XMLHttpRequest();
    request.open('get', 'data/Lyon.json', true);
    request.send();
    request.onload = function () {
        stations = JSON.parse(this.responseText);
        let bikeIcon = {
            url: 'data/bike.png',
            size: new google.maps.Size(40, 52),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 52)
        };
        // Add stations markers to the map
        stations.forEach(function (station) {
            let latLng = new google.maps.LatLng(station['latitude'], station['longitude']),
                marker = new google.maps.Marker({
                    position: latLng,
                    map: map,
                    visible: false,
                    icon: bikeIcon
                });

            // On click display the station status
            google.maps.event.addListener(marker, 'click', function () {
                stationStatus(this.number);
                toggleBounce(this);
            });
            marker.number = station['number'];
            stationsMarkers.push(marker);
        });

        // Add markers clusterer
        let clusterStyles = [
                {
                    url: 'data/bike.png',
                    height: 52,
                    width: 40,
                    anchor: [27, 0],
                    textSize: 12
            }
        ],
            mcOptions = {
                gridSize: 80,
                styles: clusterStyles,
                maxZoom: 14
            },
            markerCluster = new MarkerClusterer(map, stationsMarkers, mcOptions);
    };

    // Change markers on zoom
    google.maps.event.addListener(map, 'zoom_changed', function () {
        let zoom = map.getZoom();
        stationsMarkers.forEach(function (marker) {
            marker.setVisible(zoom >= 14);
        });
    });

    // Booking button
    $('#booking_btn').click(function () {
        $('#fade').fadeIn(400);
        $('#canvas_container').fadeIn(400);
        let canvas = new Canvas();
    });

    // Confirm button
    $('#confirm_btn').click(function () {
        $('#fade').fadeOut(400);
        $('#canvas_container').fadeOut(400);

        clearInterval(intervalID);
        $('#booking_panel').html('');

        booking = new Booking(station.number, station.name);
        booking.setSessionStorage();
        booking.status();
        $('#canvas_container').slideUp(400);
    });

    $('#close_canvas').click(function () {
        $('#fade').fadeOut(400);
        $('#canvas_container').fadeOut(400);
    });
    $('#fade').click(function () {
        $('#fade').fadeOut(400);
        $('#canvas_container').fadeOut(400);
    });
};
