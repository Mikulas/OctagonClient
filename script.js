var socket = null;

function Game() {
	this.container = null;
	this.players = [];
	this.unique_id = 1;
	
	var that = this;
	
	this._init = function() {
		that.container = $("#board");
	};
	
	this.addPlayer = function() {
		var p = new Player;
		that.players.push(p);
		return p;
	};

	this.getUniqueId = function() {
		return this.unique_id++;
	};

	this.updateFromBroadcast = function(data) {
		that.players = []; // wipe
		$.each(data.players, function(i, pl) {
			var player = new Player;
			player.name = pl.name;
			player.counters = pl.counters;
			player.piles = {};
			$.each(pl.piles, function(i, pi) {
				var pile = new Pile;
				pile.cards = [];
				$.each(pi.cards, function(i, ca) {
					var card = new Card;
					card.update(ca);
					pile.cards.push(card);
				});
				player.piles[i] = pile;
			});
			that.players.push(player);
		});
		that.render();
	};

	this.render = function() {
		$.each(that.players, function(i, player) {
			$.each(player.piles.play.cards, function(i, card) {
				card.render();
			});
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
		var obj = {players: []};
		$.each(that.players, function(i, player) {
			obj.players.push(player.toSerializable());
		});
		return obj;
	};

	this.toJSON = function() {
		return JSON.stringify(that.toSerializable());
	};

	this._init();
}

function Player() {
	this.name = null;
	this.counters = [];
	this.piles = {};

	var that = this;

	this._init = function() {
		this.piles.deck = new Pile;
		this.piles.plot = new Pile;
		this.piles.discard = new Pile;
		this.piles.death = new Pile;
		this.piles.play = new Pile;
		this.counters = {power: 0, gold: 0};
	};

	this.getCard = function(id) {
		var found = null;
		$.each(that.piles, function(i, pile) {
			var card = pile.getCard(id);
			if (card != null) {
				found = card;
			}
		});
		return found;
	};

	this.toSerializable = function() {
		var obj = {
			name: that.name,
			counters: that.counters,
			piles: {}
		};
		$.each(that.piles, function(i, pile) {
			console.log(i);
			obj.piles[i] = pile.toSerializable();
		});
		return obj;
	};

	this._init();
}

function Pile() {
	this.cards = [];

	var that = this;

	this.getCard = function(id) {
		var found = null;
		$.each(that.cards, function(i, card) {
			if (card.id == id) {
				found = card;
			}
		});
		return found;
	};

	this.toSerializable = function() {
		var obj = {cards: []};
		$.each(that.cards, function(i, card) {
			obj.cards.push(card.toSerializable());
		});
		return obj;
	};
}

function Card() {
	this.container = null;
	this.card_id = null;
	this.id = null;
	this.position = {x: null, y: null};
	this.kneeling = false;
	
	var that = this;
	
	this._init = function() {
		
	};

	this.focus = function() {
		$(".focus").removeClass("focus");
		that.container.addClass("focus");
	};
	
	this.stand = function() {
		if (that.kneeling) {
			that.container.removeClass("kneeling").addClass("standing");
			that.kneeling = false;
			that.broadcast();
		}
	};
	
	this.kneel = function() {
		if (!that.kneeling) {
			that.container.removeClass("standing").addClass("kneeling");
			that.kneeling = true;
			that.broadcast();
		}
	};
	
	this.toggleKneeling = function() {
		if (that.kneeling) {
			that.stand();
		} else {
			that.kneel();
		}
	};

	this.getImageSrc = function() {
		return "http://192.168.100.77/OctgnWeb/images/" + this.card_id + ".jpg";
	};

	this.render = function() {
		console.info("render card #" + that.id);
		that.container = $(".card#" + that.id);
		if (!that.container.size()) {
			that.container = $("<div/>").attr("id", that.id).addClass("card");
			that.container.click(function(e) {
				that.onClick(e);
			});
			that.container.dblclick(function(e) {
				that.onDoubleClick(e);
			});
			that.container.draggable({
				start: function() {
					$(this).stop(true);
				},
				stop: function(event, ui) {
					that.position = ui.position;
					that.broadcast();
				}
			});
			that.container.append($("<img/>").attr("src", that.getImageSrc()));
			that.container.css({
				left: 0,
				top: 0
			});
			$("#board").append(that.container);
		}

		if (that.kneeling && !that.container.hasClass("kneeling")) {
			that.container.removeClass("standing").addClass("kneeling");
		} else if (!that.kneeling && that.container.hasClass("kneeling")) {
			that.container.removeClass("kneeling").addClass("standing");
		}

		if (that.position.left != null && that.position.top != null) {
			that.container.stop(true).animate({
				left: that.position.left,
				top: that.position.top
			}, 600);
		}
	};

	this.update = function(data) {
		that.id = data.id;
		that.card_id = data.card_id;
		that.position = data.position;
		that.kneeling = data.kneeling;
	};
	
	this.onClick = function(e) {
		//this.focus();
	};

	this.onDoubleClick = function(e) {
		that.toggleKneeling();
	};

	this.broadcast = function(e) {
		socket.send(JSON.stringify({method: "update_card", card: that.toSerializable()}));
	};

	this.toSerializable = function() {
		return {
			position: that.position,
			card_id: that.card_id,
			id: that.id,
			kneeling: that.kneeling
		};
	};
	
	this._init();
}

$(function() {
	// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		// Great success! All the File APIs are supported.
	} else {
		alert('The File APIs are not fully supported. Please update your browser to the latest version.');
	}

	var game = new Game; // defaults to empty if no broadcast is received upon connecting

	var host = "ws://192.168.100.77:4723";
	var ignore_next_broadcast = false;
	try {
		socket = new WebSocket(host);
		socket.onopen = function(msg) {
			console.info("connected to server");
		};
		socket.onmessage = function(e) {
			var data = JSON.parse(e.data);
			// console.info(data);
			if (data.method == "announce_join") {
				// dump whole game for new client
				console.info("CLIENT JOINED (" + data.count + ")");
				socket.send(JSON.stringify({method: "broadcast", game: game}));

			} else if (data.method == "announce_leave") {
				console.info("CLIENT LEFT (" + data.count + ")");

			} else if (data.method == "broadcast") {
				console.info("broadcast received: ", data.game);
				game.updateFromBroadcast(JSON.parse(data.game));

			} else if (data.method == "update_card") {
				console.info("card update received: ", data.card);
				var card = game.getCard(data.card.id);
				card.update(data.card);
				card.render();
			}

		};
		/*
		 $('#output').val($('#output').val() + "\n" + e.data);
		 */
		socket.onclose = function(msg) {
			console.info("connection closed");
		};
		socket.onerror = function(error) {
			console.error(error);
		};

	} catch(ex) {
		console.error(ex);
	}

	/*
	$("#run").click(function() {
		$("#c").toggleClass("kneeling").toggleClass("standing");
	});
	*/

	function handleFileSelect(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		var files = evt.dataTransfer.files; // FileList object.
		if (files.length > 1) {
			alert("Please pick only one deck.");
			return false;
		}
		var file = files[0];

		var reader = new FileReader();
		reader.onload = (function(theFile) {
			return function(res) {
				var content = atob(res.target.result.substr(12)); // remove header `data:base64,` and decode base64
				parseO8DXml(content);
			};
		})(file);
		reader.readAsDataURL(file);
	}

	function handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
	}

	function parseO8DXml(xmlString) {
		var player = game.addPlayer();
		$(xmlString).children().each(function(i, sec) {
			console.log($(sec), $(sec).attr("name"));
			$(sec).children().each(function(i, ca) {
				for (var qty = 0; qty < $(ca).attr('qty'); ++qty) {
					var card = new Card;
					card.id = game.getUniqueId();
					card.card_id = $(ca).attr("id");
					if ($.inArray($(sec).attr("name"), ["House", "Agenda"]) != -1) {
						// put card directly to table
						player.piles.play.cards.push(card);
					} else if ($.inArray($(sec).attr("name"), ["Plots"]) != -1) {
						// put card to unrevealed plot pile
						player.piles.plot.cards.push(card);
					} else {
						// put card to deck
						player.piles.deck.cards.push(card);
					}
				}
			});
		});
		game.render();
		console.log(game);
	}
	
	$("#drop_zone")[0].addEventListener('dragover', handleDragOver, false);
	$("#drop_zone")[0].addEventListener('drop', handleFileSelect, false);
});
