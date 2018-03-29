// Google map initialisation
var map;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 45.764221,
            lng: 4.834432
        },
        zoom: 12
    });
}
