var Connection = function() {
	var that = this;

	that.game = null;
	that.host = "ws://thrones.eu:4723";
	that.socket = new WebSocket(this.host);
	that.socket.onopen = function(msg) {
		console.log("socket opened");
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
		var data = JSON.parse(e.data);

		var method = "on" + data.method.replace(/(^|_)(.)/g, function(match, s, dot) {
			return dot.toUpperCase();
		});

		delete data.method;
		delete data.client_id;
		delete data.time;

		that[method](data);
	};

	that.socket.onclose = function(msg) {
		console.log("socket closed");
	};

	that.socket.onerror = function(error) {
		console.error("Socket Error: ", error);
	};

	that.onConnectResponse = function(data) {
		console.log("connected to server");
	};

	that.onAnnounceJoin = function(data) {
		console.log("player has joined the game, total players: " + data.count);
	};

	that.onAnnounceLeave = function(data) {
		console.log("player has left the game, total players: " + data.count);	
	};

	that.onInvoke = function(data) {
		var object = null;
		if (data.type === "card") {
			object = that.game.getCard(data.id);

		} else if (data.type === "player") {
			object = that.game.players[data.id];

		} else {
			throw Error("invoke on " + data.type + " not implemented");
		}

		// replace textual pointer with actual pointers
		var args = data.args;
		for (var i in args) {
			if (typeof args[i] === "object" && args[i].hasOwnProperty("pointer")) {
				if (args[i].type === "container")
					args[i] = that.game.getContainer(args[i].id);
				else
					throw Error("not implemented");
			}
		}

		console.log("invoking method ", data.call, "on", object, "with", args);

		object[data.call].apply(object, args);
		console.log(object.renderer, data.call);
		if (data.render === true)
			object.renderer[data.call].apply(object.renderer, args);

		console.log("invoke", data);
	};

	that.onUpdate = function(data) {
		var object = null;
		if (data.type === "container") {
			object = that.game.getContainer(data.id);

		} else {
			throw Error("update on " + data.type + " not implemented");
		}

		object[data.property] = data.value;
		if (data.render === true)
			object.renderer.render();

		console.log("update", data);
	};
 
 	that.onLog = function(data) {
 		that.game.log(data.message, true);
 	};

	that.send = function(data) {
		// TODO dynamic;
		client_id = "1323193943817-9565945";
		client_view = 2;

		data.client_id = client_id + "-" + client_view;
		data.time = "" + new Date().getTime();
		console.log("sending", JSON.stringify(data));
		that.socket.send(JSON.stringify(data));
	};
}
