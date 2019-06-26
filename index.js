
lastImgPath = null;
hassToken = null;

function init() {
    // Create WebSocket connection to GPMDP
    const socket = new WebSocket('ws://' + getPreference('gpmdpAddress'));
    socket.addEventListener('message', function (event) {
        message = JSON.parse(event.data);

        switch (message.channel) {
            case 'track':
                calculate(message.payload.albumArt);
                break;
        };
    });

}


function calculate(imgpath) {
    if (!imgpath) {
        imgpath = lastImgPath;
    } else {
        lastImgPath = imgpath;
    }

    Vibrant.from(imgpath).getPalette((err, palette) => {
        if (err) {
            console.log(err);

        } else {
            userSwatch = getPreference('userSwatch');
            
            swatch = palette[userSwatch];

            sendColor(getPreference('entityId'), swatch.rgb);

            document.body.style.backgroundColor = swatch.getHex();

            // Update the swatch chooser to reflect this new palette
            document.getElementById('userSwatch').style.backgroundColor = palette[userSwatch].getHex();
            Array.from(document.getElementById('userSwatch').children).forEach(function (el) {
                el.style.backgroundColor = palette[el.value].getHex();
            });

        }

    });

    document.body.style.backgroundImage = 'url(' + imgpath + ')';

}

function sendColor(entityId, color) {
    red = color[0];
    green = color[1];
    blue = color[2];


    var corsprefix = "https://cors-anywhere.herokuapp.com/";
    var hassEndpoint = getPreference('hassAddress') + '/api/services/light/turn_on'


    if (hassToken == null) {
        hassToken = getPreference('hassToken');
    }

    url = corsprefix + hassEndpoint;

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            console.log(`Sent rgb color: (${red},${green},${blue}) `);
    }
    xmlHttp.open("POST", url, true);
    xmlHttp.setRequestHeader("authorization", "Bearer " + hassToken);
    xmlHttp.setRequestHeader("content-type", "application/json");
    xmlHttp.send(`
    {
        "entity_id": "${entityId}",
        "rgb_color": [${red},${green},${blue}]
      }
    `);
}

function requestAuthToken() {
    window.open(`${getPreference('hassAddress')}/auth/authorize?client_id=${encodeURIComponent(window.location.href)}&redirect_uri=${encodeURIComponent(window.location.href)}`)
}


function getCookie(name) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
}
function setCookie(name, value, days) {
    var d = new Date;
    d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
    document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
}

function setAuthToken(token) {
    if (!token) {
        token = prompt("Enter your auth token", "");
        if (!token) {
            return;
        }
    }

    setCookie('hassToken', token, 10 * 365);

    hassToken = token;

    calculate();

}

function savePreference(preference, value) {
    setCookie(preference, value, 10 * 365);
    calculate();
}

function getPreference(preference) {
    cookie = getCookie(preference);

    if (!cookie) {
        switch (preference) {
            case 'gpmdpAddress':
                return 'localhost:5672';
            case 'userSwatch':
                return 'Vibrant';
        }
    }

    return cookie;
}

window.onload = function() {
        // Load cookie stuff
        // TODO Get this to work
        Array.from(document.getElementById('userSwatch').children).forEach(function (el) {
            if (el.value == getPreference('userSwatch')){
                el.setAttribute('selected', 'selected');
            }
        });

        document.getElementById('hassAddress').value =getPreference('hassAddress');
        document.getElementById('gpmdpAddress').value =getPreference('gpmdpAddress');
        document.getElementById('entityId').value =getPreference('entityId');

}

init();