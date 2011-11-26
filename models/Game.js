function Game() {
	this.players = [];
	this.unique_id = 1;

	var that = this;

	this._init = function() {
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

	this.updateFromBroadcast = function(data) {
		that.players = []; // wipe
		$("#board").children().remove();
		$("#counters").children().remove();
		$.each(data.players, function(i, pl) {
			var player = new Player();
			player.id = i;
			player.counters = pl.counters;
			$.each(pl.containers, function(i, pi) {
				var container = null;
				if (i == "play") {
					Board.prototype = new Container();
					container = new Board();
				} else if (i == "hand") {
					Hand.prototype = new Container();
					container = new Hand();
				} else {
					Pile.prototype = new Container();
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
		$.each(that.players, function(i, player) {
			player.render(i);
		});
	};

	this.getCard = function(id) {
		var found = null;
		$.each(that.players, function(i, player) {
			var card = player.getCard(id);
			if (card != null) {
				found = card;
			}
		});
		return found;
	};

	this.toSerializable = function() {
		var obj = {players: {}};
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
