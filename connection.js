var Connection = function() {
	var that = this;
	
	that.host = "ws://thrones.eu:4723";
	that.socket = new WebSocket(this.host);
	that.socket.onopen = function(msg) {
		console.info("connected to server");
		/*
		setInterval(function() {
			send("{\"method\": \"keep-alive\"}");
		}, 30 * 1000);
		*/
		that.send({
			method: "connect",
			instance: "b",
			password: "b"
		});
	};

	that.socket.onmessage = function(e) {
		console.log("received", e.data);
	};

	that.socket.onclose = function(msg) {
		console.info("connection to server closed");
	};

	that.socket.onerror = function(error) {
		console.error("Socket Error: ", error);
	};

	that.send = function(data) {
		// TODO dynamic;
		client_id = "1323193943817-9565945";
		client_view = 1;

		data.client_id = client_id + "-" + client_view;
		data.time = "" + new Date().getTime();
		console.log("sending", JSON.stringify(data));
		that.socket.send(JSON.stringify(data));
	};
}
