var utils = {};

utils.randomString = function(haystack, len) {
    var str = new Array(len);
    for (var i = 0; i < len; ++i) {
        var ri = Math.floor(Math.random() * haystack.length);
        str[i] = haystack.charAt(ri);
    }
    return str.join('');
}

utils.reverseString = function(s) {
    return s.split('').reverse().join('');
}

utils.arrayCount = function(v, o, equals) {
    var cnt = 0;
    for (var i = 0; i < v.length; ++i) {
        if (equals(v[i], o)) {
            ++cnt;
        }
    }
    return cnt;
}

utils.shallowEquals = function(o1, o2) {
    for (var prop in o1) {
        if (o1[prop] !== o2[prop]) {
            return false;
        }
    }
    return true;
}

// f(0) = 1, f(1) = 0
utils.invert = function(n) {
    return (n + 1) & 1;
}

// t = time in seconds
utils.readableTime = function(t) {
    var offSeconds = t % 3600;
    var hours = (t - offSeconds) / 3600;
    var seconds = offSeconds % 60;
    var minutes = (offSeconds - seconds) / 60;
    if (hours < 10) {
        hours = '0' + hours;
    }
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    return [hours, minutes, seconds].join(':');
}

