var socket = null;
var game = null;
var optimizations = {"~@0~": "a12af4e8-be4b-4cda-a6b6-534f97"};
var client_id = null;
var client_view = null;
var this_player = null;

function send(content) {
	var tampered = content.substr(0, content.length - 1) + ",\"client_id\":\"" + client_id + "-" + client_view + "\",\"time\":" + new Date().getTime() + "}";
	socket.send(tampered);
}

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
			var player = new Player;
			player.id = i;
			player.counters = pl.counters;
			player.piles = {};
			$.each(pl.piles, function(i, pi) {
				var pile = new Pile;
				pile.cards = [];
				$.each(pi.c, function(i, ca) {
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
			$.each(player.piles.play.render(), function(i, container) {
				$("#board").append(container);
			});
			player.render();
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

function Player() {
	this.counter_container = null;
	this.id = null;
	this.counters = {power: 0, gold: 0};
	this.piles = {};

	var that = this;

	this._init = function() {
		this.piles.deck = new Pile;
		this.piles.plot = new Pile;
		this.piles.discard = new Pile;
		this.piles.death = new Pile;
		this.piles.play = new Pile;
		this.piles.hand = new Pile;
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

	this.render = function() {
		if (that.counter_container == null) {
			that.counter_container = $("<div/>").attr("data-player-id", this.id);
			$("#counters").append(that.counter_container);
			$.each(that.counters, function(i, v) {
				var $input = $("<input type=\"number\"/>").addClass("counter " + i);
				$input.bind("change click", function() {
					that.counters[i] = $(this).val();
					send(JSON.stringify({
						"method": "update_counter",
						"player_id": $input.parent().attr("data-player-id"),
						"counter": i,
						"value": $(this).val()
					}));
				});
				that.counter_container.append($input);
			});
		}
		$.each(that.counters, function(i, v) {
			that.counter_container.children("." + i).val(that.counters[i]);
		});

		$("#hand").children().remove();
		$.each(that.piles.hand.render(true), function(i, container) {
			container.addClass("small");
			$("#hand").append(container);
		});
	};

	this.draw = function(count) {
		if (count == undefined)
			count = 1;

		var drawn = 0;
		while (count-- > 0) {
			var card = that.piles.deck.cards.pop();
			if (card == undefined) {
				console.log("cannot draw more cards, deck depleted");
				break;
			}
			drawn++;
			that.piles.hand.cards.push(card);
		}
		console.log("player draws " + drawn + " card" + (drawn > 1 ? "s" : ""));
	};

	this.updateCounter = function(data) {
		that.counters[data.counter] = data.value;
	};

	this.toSerializable = function() {
		var obj = {
			id: that.id,
			counters: that.counters,
			piles: {}
		};
		$.each(that.piles, function(i, pile) {
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

	this.shuffle = function() {
		var tmp, current, top = that.cards.length;
		while (--top >= 0) {
			current = Math.floor(Math.random() * (top + 1));
			tmp = that.cards[current];
			that.cards[current] = that.cards[top];
			that.cards[top] = tmp;
		}
		console.log("pile shuffled");
	};

	this.render = function(revert) {
		var containers = [];
		$.each(this.cards, function(i, card) {
			containers.push(card.render(revert));
		});
		return containers;
	};

	this.toSerializable = function() {
		var obj = {c: []};
		$.each(that.cards, function(i, card) {
			obj.c.push(card.toSerializable());
		});
		return obj;
	};
}

function Card() {
	this.container = null;
	this.card_id = null;
	this.id = null;
	this.position = {top: 0, left: 0, z: 1};
	this.kneeling = false;
	this.faceDown = false;

	var that = this;
	
	this._init = function() {
		
	};

	this.focus = function() {
		$(".focus").removeClass("focus");
		that.container.addClass("focus");
	};
	
	this.stand = function() {
		that.container.removeClass("kneeling").addClass("standing");
		that.kneeling = false;
	};
	
	this.kneel = function() {
		that.container.removeClass("standing").addClass("kneeling");
		that.kneeling = true;
	};
	
	this.toggleKneeling = function() {
		if (that.kneeling) {
			that.stand();
		} else {
			that.kneel();
		}
	};

	this.turnFaceUp = function() {
		that.container.removeClass("face-down").addClass("face-up");
		// this animation takes .4 seconds, being at scale 0 at .2
		setTimeout(function() {
			that.container.children('img').attr('src', that.getImageSrc());
		}, 200);
		that.faceDown = false;
	};

	this.turnFaceDown = function() {
		that.container.removeClass("face-up").addClass("face-down");
		// this animation takes .4 seconds, being at scale 0 at .2
		setTimeout(function() {
			that.container.children('img').attr('src', that.getBackImageSrc());
		}, 200);
		that.faceDown = true;
	};

	this.toggleFaceDown = function() {
		if (that.faceDown) {
			that.turnFaceUp();
		} else {
			that.turnFaceDown();
		}
	};

	this.getImageSrc = function() {
		return "http://192.168.100.77/OctgnWeb/images/" + that.card_id + ".jpg";
	};

	this.getBackImageSrc = function() {
		return "http://192.168.100.77/OctgnWeb/images/facedown.jpg";
	};

	this.render = function(revert) {
		that.container = $(".card#" + that.id);
		if (!that.container.size()) {
			that.container = $("<div/>").attr("id", that.id).addClass("card");
			that.container.click(function(e) {
				that.onClick(e);
			});
			that.container.dblclick(function(e) {
				that.onDoubleClick(e);
			});
			console.log(revert, revert != undefined && revert);
			that.container.draggable({
				revert: revert != undefined && revert,
				start: function(event, ui) {
					$(this).stop(true);
					ui.helper.data('dropped', false);
				},
				stop: function(event, ui) {
					if (!revert || ui.helper.data('dropped')) {
						console.log("MOVED", !revert, ui.helper.data('dropped'));
						that.position = ui.position;
						that.position.z = that.container.css("z-index");
						that.broadcast();
					}
				},
				stack: ".card:not(#" + that.id + ")"
			});

			that.container.contextMenu({menu: "context_menu"},
				function(action, el, pos) {
					switch(action) {
						case "kneel":
							that.kneel(); break;
						case "stand":
							that.stand(); break;
						case "face-down":
							that.turnFaceDown(); break;
						case "face-up":
							that.turnFaceUp(); break;
					}
					that.broadcast();
				},
				// on show menu callback
				function(e) {
					var card = game.getCard($(e.srcElement).parent().attr('id'));
					if (card.kneeling) {
						$("#context_menu [href=#kneel]").hide();
						$("#context_menu [href=#stand]").show();
					} else {
						$("#context_menu [href=#kneel]").show();
						$("#context_menu [href=#stand]").hide();
					}
					if (card.faceDown) {
						$("#context_menu [href=#face-down]").hide();
						$("#context_menu [href=#face-up]").show();
					} else {
						$("#context_menu [href=#face-down]").show();
						$("#context_menu [href=#face-up]").hide();
					}
				}
			);

			that.container.append($("<img/>").addClass("raw-card").attr("src", that.getImageSrc()));
			that.container.css({
				left: 0,
				top: 0
			});
			//$("#board").append(that.container);
			return that.container;
		}

		if (that.kneeling && !that.container.hasClass("kneeling")) {
			that.kneel();
		} else if (!that.kneeling && that.container.hasClass("kneeling")) {
			that.stand();
		}

		if (that.faceDown && !that.container.hasClass("face-down")) {
			that.turnFaceDown();
		} else if (!that.faceDown && that.container.hasClass("face-down")) {
			that.turnFaceUp();
		}

		that.container.css({"z-index": that.position.z});
		if (that.position.left != null && that.position.top != null) {
			that.container.stop(true).animate({
				left: that.position.left,
				top: that.position.top
			}, 600);
		}
	};

	this.update = function(data) {
		that.id = data.id;
		that.card_id = data.cid;
		if (data.hasOwnProperty("p"))
			that.position = {
				top: data.p.hasOwnProperty("t") ? data.p.t : 0,
				left: data.p.hasOwnProperty("l") ? data.p.l : 0,
				z: data.p.hasOwnProperty("z") ? data.p.z : 1
			};
		that.kneeling = data.hasOwnProperty("k") ? data.k : false;
		that.faceDown = data.hasOwnProperty("f") ? data.f : false;
	};
	
	this.onClick = function(e) {
		//this.focus();
	};

	this.onDoubleClick = function(e) {
		that.toggleKneeling();
		that.broadcast();
	};

	this.broadcast = function(e) {
		send(JSON.stringify({method: "update_card", card: that.toSerializable()}));
	};

	this.toSerializable = function() {
		var obj = {
			cid: that.card_id,
			id: that.id
		};
		if (that.position.top != 0) {
			if (!obj.hasOwnProperty("p"))
				obj.p = {};
			obj.p.t = that.position.top;
		}
		if (that.position.left != 0) {
			if (!obj.hasOwnProperty("p"))
				obj.p = {};
			obj.p.l = that.position.left;
		}
		if (that.position.z != 1) {
			if (!obj.hasOwnProperty("p"))
				obj.p = {};
			obj.p.z = that.position.z;
		}
		if (that.kneeling) {
			obj.k = that.kneeling;
		}
		if (that.faceDown) {
			obj.f = that.faceDown;
		}
		return obj;
	};
	
	this._init();
}

$(function() {
	$("#board").disableSelection();

	if (!localStorage.hasOwnProperty("client_id")) {
		localStorage.client_id = new Date().getTime() + "-" + Math.floor((Math.random() * 10e6));
	}
	client_id = localStorage.client_id;

	if (!localStorage.hasOwnProperty("client_view")) {
		localStorage.client_view = 0;
	} else {
		localStorage.client_view++;
	}
	client_view = localStorage.client_view;
	console.log("This clients id = ", client_id + "-" + client_view);

	// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		// Great success! All the File APIs are supported.
	} else {
		alert('The File APIs are not fully supported. Please update your browser to the latest version.');
	}

	game = new Game; // defaults to empty if no broadcast is received upon connecting

	var host = "ws://192.168.100.77:4723";
	try {
		socket = new WebSocket(host);
		socket.onopen = function(msg) {
			console.info("connected to server");
			setInterval(function() {
				send("{\"method\": \"keep-alive\"}");
			}, 30 * 1000);
		};
		socket.onmessage = function(e) {
			var data = e.data;
			$.each(optimizations, function(i, v) {
				var regex = new RegExp(i, "g");
				data = data.replace(regex, v);
			});
			data = JSON.parse(data);
			if (data.client_id == client_id + "-" + client_view) {
				return false;
			}

			if (data.method == "announce_join") {
				// dump whole game for new client
				console.info("CLIENT JOINED (" + data.count + ")");
				showNotification("Player joined game");
				game.broadcast();

			} else if (data.method == "announce_leave") {
				console.info("CLIENT LEFT (" + data.count + ")");
				showNotification("Player left game");

			} else if (data.method == "broadcast") {
				console.info("broadcast received: ", data.game);
				game.updateFromBroadcast(data.game);

			} else if (data.method == "update_card") {
				console.info("card update received: ", data.card);
				var card = game.getCard(data.card.id);
				card.update(data.card);
				card.render();

			} else if (data.method == "update_counter") {
				console.info("card counter received: ", data);
				var player = game.players[data.player_id];
				player.updateCounter(data);
				player.render();
			}
		};

		/*
		 $('#output').val($('#output').val() + "\n" + e.data);
		 */
		socket.onclose = function(msg) {
			showError("Server not available");
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
		this_player = player;
		$(xmlString).children().each(function(i, sec) {
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

		player.piles.deck.shuffle();
		player.draw(7);
		game.render();
		game.broadcast();
	}

	$(".card").live("mouseenter", function(e) {
		if (!$(this).hasClass("face-down")) {
			$("#magnifier").attr("src", $(this).children("img").attr("src")).fadeIn();
		}
	}).live("mouseleave", function(e) {
		if (!$(e.toElement).hasClass("raw-card")) {
			$("#magnifier").fadeOut();
		}
	});

	/*$("#hand").sortable({
		placeholder: "card small placeholder",
		axis: "x",
		forceHelperSize: true,
		forcePlaceholderSize: true,
		items: "img",
		tolerance: "pointer"
	});*/

	$("#board").droppable({
		accept: '.card',
		drop: function(event, ui) {
			ui.draggable.data('dropped', true);
			console.log("dropped");
		}
	});

	// temporary
	$("#draw-card").click(function() {
		this_player.draw();
		this_player.render();
	});

	function showNotification(content, persist) {
		var $node = $('<div/>').addClass("notification").html(content).hide();
		$("#notifications").append($node);
		$node.fadeIn();
		if (persist == undefined || !persist) {
			setInterval(function() {
				$node.fadeOut();
			}, 2000);
		}
		return $node;
	}

	function showError(content) {
		return showNotification(content, true).addClass('error');
	}

	$("#drop_zone")[0].addEventListener('dragover', handleDragOver, false);
	$("#drop_zone")[0].addEventListener('drop', handleFileSelect, false);
});
