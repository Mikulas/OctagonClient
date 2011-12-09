function Game() {
	this.players = [];
	this.unique_id = 1;
	this.play = null;
	this.logData = [];

	var that = this;
	this.logList = null;

	this._init = function() {
		Board.prototype = new Container("play");
		this.play = new Board();
	};

	this.addPlayer = function() {
		var p = new Player;
		that.players.push(p);
		p.id = that.players.length - 1;
		return p;
	};

	this.getUniqueId = function() {
		return this.unique_id++;
	};

	this.log = function(text) {
		that.logData.push(text);
		that.logList.append($("<li></li>").text(text));
	};

	this.updateFromBroadcast = function(data) {
		that.players = []; // wipe

		if (!$.isEmptyObject(data.players))
			$("#help").add("#connect").stop().fadeOut(0).hide();
		
		$("header :not(.donotremove)").add("#containers").add("[data-type=play]").children().remove();

		that.unique_id = data.unique_id;
		that.logData = data.logData;
		Board.prototype = new Container("play");
		that.play = new Board();
		$.each(data.play.c, function(i, ca) {
			var card = new Card();
			card.update(ca);
			that.play.add(card);
		});

		$.each(data.players, function(i, pl) {
			var player = new Player();
			player.id = i;
			player.counters = pl.counters;
			player.name = pl.name;
			player.client_id = pl.cid;
			$.each(pl.containers, function(i, pi) {
				var container = null;
				if (i == "hand") {
					Hand.prototype = new Container(i);
					container = new Hand();
					container.client_id = pi.cid;
				} else {
					Pile.prototype = new Container(i);
					container = new Pile();
				}

				$.each(pi.c, function(i, ca) {
					var card = new Card();
					card.update(ca);
					container.add(card);
				});
				player.containers[i] = container;
			});
			that.players.push(player);
		});
		that.render();
	};

	this.render = function() {
		that.renderLog();

		var $entity = that.play.render();
		if (!$("[data-type=play]").size()) {
			$("body").append($entity);
		}

		$.each(that.players, function(i, player) {
			player.render();
		});

		var player = game.getPlayer(window.client_id);
		if (player != null)
			that.openTab(player.id);
	};

	this.renderLog = function() {
		that.logList.children().remove();
		$.each(that.logData, function(i, t) {
			that.logList.append($("<li></li>").text(t));
		});
	};

	this.openTab = function(player_id) {
		$("header .name.active").removeClass("active");
		$("header [data-player-id=" + player_id + "] .name").addClass("active");
		$("#containers .set").addClass("hidden");
		$("#containers .set[data-player-id=" + player_id + "]").removeClass("hidden");
	};

	this.getCard = function(id) {
		var found = null;
		found = that.play.getCard(id);
		if (found)
			return found;

		$.each(that.players, function(i, player) {
			var card = player.getCard(id);
			if (card != null) {
				found = card;
			}
		});
		return found;
	};

	this.getPlayer = function(client_id) {
		var res = null;
		$.each(that.players, function(i, player) {
			if (player.client_id == client_id)
				res = player;
		});
		return res;
	};

	this.toSerializable = function() {
		var obj = {
			unique_id: that.unique_id,
			play: that.play.toSerializable(),
			players: {},
			logData: that.logData
		};
		$.each(that.players, function(i, player) {
			obj.players[i] = player.toSerializable();
		});
		return obj;
	};

	this.toJSON = function() {
		return JSON.stringify(that.toSerializable());
	};

	this.broadcast = function() {
		var packed = '{"method": "broadcast", "game": ' + game.toJSON() + '}';
		packed = packed.replace(/false/g, "0");
		packed = packed.replace(/null/g, "0");
		$.each(optimizations, function(i, v) {
			var regex = new RegExp(v, "g");
			packed = packed.replace(regex, i);
		});
		if (packed.length > 16384) {
			console.log(packed.length);
			return false;
		}
		send(packed);
	};

	this._init();
}
