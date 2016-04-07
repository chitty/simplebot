var fs = require('fs');
var CONFIG = require('./config.js');

setInterval(check_time, CONFIG.FREQUENCY);

var readObj = {};

try {
    readObj = JSON.parse(fs.readFileSync(CONFIG.PATH, { encoding: CONFIG.ENCODING }));  
} catch (e) {
    console.log("There was an error reading config file: ", e);
    process.exit();
}


function check_time(){
    var date = new Date();
    var current_hour = date.getHours();
    var current_minute = date.getMinutes();
    if (current_hour === CONFIG.TIME.HOUR && current_minute === CONFIG.TIME.MINUTE) {
        get_channels(readObj);
    }
    console.log(current_hour+":"+current_minute);
}

var request = require('request');

function get_channels() {
    post_data = readObj;
    request.post(
        "https://slack.com/api/channels.list",
        {  form: post_data },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                filter_channels(body);
            }
        }
    );
}

function filter_channels(body) {
    try {
        parsedBody = JSON.parse(body);

        if (parsedBody.ok) {
            channels = parsedBody.channels;

            for (var i=0; i<channels.length; i++) {
                console.log(channels[i]["name"]);
                if (channels[i]["name"] == CONFIG.CHANNEL) {
                    send_message(channels[i]["id"]);
                    break;
                }
            }

        } else {
            console.log(parsedBody.error);
            console.log(parsedBody);
            process.exit();
        }

    } catch (e) {
        console.log("There was an error parsing channels info: ", e);
        process.exit();
    }
}

function send_message(channel) {
    console.log("Sending message to "+channel);

    var post_data = readObj;
    post_data.text = CONFIG.MESSAGE;    
    post_data.channel = channel;

    request.post(
        "https://slack.com/api/chat.postMessage",
        {  form: post_data },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("Message delivered!");
            }
        }
    );
}