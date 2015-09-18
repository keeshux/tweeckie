/**
 * @constructor
 */
// helper connection class
function Connection() {
    this.localQ = null;
    this.remoteQ = null;

    // set on connect()
    this.mq = null;
}

Connection.prototype.connect = function(onConnect, onPublish) {
    var mqSettings = {
        pubUrl: settings.mq.pubUrl,
        subUrl: settings.mq.subUrl,
        sendRetry: settings.mq.sendRetry,
        pollTimeout: settings.mq.pollTimeout,
        pollDelay: settings.mq.pollDelay,
        pollRetry: settings.mq.pollRetry,
        debug: settings.mq.debug
    };
    this.mq = new PushMQ(mqSettings, onPublish);
    this.mq.subscribe(this.localQ);

    // optional
    onConnect && onConnect(this.localQ);
};

Connection.prototype.disconnect = function() {
    this.mq.close(this.localQ, true);
};

Connection.prototype.send = function(obj) {
    if (this.remoteQ) {
        this._rawSend(this.remoteQ, obj);
    }
};

/*Connection.prototype.sendGuests = function(obj) {
    if (this.guestsQ) {
        this._rawSend(this.guestsQ, obj);
    }
};*/

Connection.prototype.broadcast = function(obj) {
    this.send(obj);
    //this.sendGuests(obj);
};

// attach recipient to object and make it JSON
Connection.prototype._rawSend = function(dst, obj) {
    obj.recipient = this.localQ;

    var str = JSON.stringify(obj);
    this.mq.publish(dst, str);
};

