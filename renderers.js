"use strict"

function clearMenu() {
	$("#context_menu li").remove();
}

function addMenuItem(action, label) {
	$("#context_menu").append($("<li/>").append($("<a/>").attr("href", "#" + action).text(label)));
}

/** @abstract */
var Renderer = function() {
	this.type = null;
	this.content = null;
	
	this.getNode = function() {
		if (this.content === null || !("id" in this.content))
			throw Error("Renderer.content was not properly set.");

		var res = $("[data-type=" + this.type + "][data-id=" + this.content.id + "]");
		return res.length ? res : null;
	};

	this._createNode = function() {
		return $('<div data-type="' + this.type + '" data-id="' + this.content.id + '"/>');
	};

	this._render = function() {
		if (!this.getNode()) {
			throw Error("DOM object not found.");
		}
	};

	this.render = function() {
		throw new Error("Child does not override Renderer.render().");
	};

	this.moveTo = function(element, append) {
		if (element.hasOwnProperty("renderer"))
			element = element.renderer.getNode();

		if (typeof append === "undefined" || !append)
			this.getNode().prependTo(element);
		else
			this.getNode().appendTo(element);
	};
}

var CardRenderer = function(card) {
	var that = new Renderer();

	that.type = "card";
	if (!(card instanceof Card)) {
			throw TypeError("Only Card instance can be passed to CardRenderer.");
	}
	that.content = card;

	that.getCounterNode = function(counter) {
		return that.getNode().children('[data-type=counter][data-id="' + counter + '"]');
	};

	that.createCounterNode = function(counter) {
		return $('<input type="number" min="0" max="99" data-type="counter" data-id="' + counter + '" value="' + that.content.counters[counter] + '">')
		.on("change input", function(e) {
			var val = $(this).val();
			if (val < 0) {
				$(this).val(0);
				val = 0;
			}
			var diff = val - that.content.counters[counter];
			if (diff !== 0) {
				that.content.container.player.game.log("Card #" + that.content.id + " " + counter + " set to " + val + " (" + (diff > 0 ? "+" :  "") + diff + ")");
				that.content.broadcastInvoke("updateCounter", true, [counter, val]);
			}
			that.content.counters[counter] = val;
		});
	};

	that.createNode = function() {
		var node = that._createNode();

		node.append($("<img/>").attr("src", "cards/" + that.content.image + ".jpg"));
		
		for (var counter in that.content.counters) {
			node.append(that.createCounterNode(counter));
		}

		node.contextMenu(
			{menu: "context_menu"},
			function(action, el, pos) {
				switch (action) {
					case "kneel":
						that.content.container.player.game.log("Player knelt card #" + that.content.id);
						that.content.kneel();
						that.kneel();
						that.content.broadcastInvoke("kneel", true);
						break;
					case "stand":
						that.content.container.player.game.log("Player stood card #" + that.content.id);
						that.content.stand();
						that.stand();
						that.content.broadcastInvoke("stand", true);
						break;
					case "discard":
						that.content.container.player.game.log("Player discards card #" + that.content.id);
						that.content.discard();
						that.content.renderer.discard();
						that.content.broadcastInvoke("discard", true);
						break;
					case "discard-random":
						var cards = that.content.container.cards;
						var key = Math.floor(Math.random() * Object.keys(cards).length);
						var i = 0;
						var card = null;
						for (var cid in cards) {
							if (i++ === key) {
								card = cards[cid];
								break;
							}
						}
						that.content.container.player.game.log("Player discards card #" + card.id + " at random");
						card.discard();
						card.renderer.discard();
						card.broadcastInvoke("discard", true);
						break;
				}
			},
			// on show menu callback
			function(e) {
				clearMenu();
				if (that.content.container.type === "play") {
					that.content.kneeling ? addMenuItem("stand", "Stand") : addMenuItem("kneel", "Kneel");

				} else if (that.content.container.type === "hand") {
					addMenuItem("discard", "Discard");
					addMenuItem("discard-random", "Discard random");
				}
			}
		);

		node.addClass(that.content.kneeling ? "kneeling" : "standing");

		return node;
	};

	that.discard = function() {
		that.moveTo(that.content.container.player.containers["discard"]);
	};

	that.kneel = function() {
		that.getNode().removeClass("standing").addClass("kneeling");
	};

	that.stand = function() {
		that.getNode().removeClass("kneeling").addClass("standing");
	};

	that.updateCounter = function(counter, value) {
		that.getCounterNode(counter).val(value);
	};

	that.onLeavePlay = function() {
		that.stand();
		for (var i in that.content.counters) {
			that.updateCounter(i, that.content.counters[i]);
		}
	};

	that.render = function() {
		that._render();
		return that.getNode();
	};

	return that;
}

var ContainerRenderer = function(container) {
	var that = new Renderer();

	that.type = "container";
	if (!(container instanceof Container)) {
			throw TypeError("Only Container instance can be passed to ContainerRenderer.");
	}
	that.content = container;

	that.__createNode = function() {
		var node = that._createNode();
		for (var i in that.content.order) {
			var card = that.content.cards[that.content.order[i]].renderer.createNode();
			node.append(card);
		}

		node.sortable({
			revert: true, 
			connectWith: "[data-type=container]", 
			stack: "[data-type=card]", 
			scope: "container-" + that.content.id,
			tolerance: 'pointer',
			cursor: '-webkit-grabbing',
			update: function(event, ui) {
				var cid = ui.item.data("id");
				var card = that.content.player.game.getCard(cid);
				
				var newPosition = card.renderer.getNode().index();
				// remove from original position
				card.container.order.splice(card.container.order.indexOf(card.id), 1);
				card.container.order.splice(newPosition, 0, card.id);

				card.container.broadcastUpdate("order");
			},
			receive: function(event, ui) {
				var cid = ui.item.data("id");
				var card = that.content.player.game.getCard(cid);
				var kid = ui.item.parent("[data-type=container]").data("id");
				var newContainer = that.content.player.game.getContainer(kid);

				card.container.player.game.log("Player moves card #" + card.id + " from " + card.container.type + " to " + newContainer.type);
				card.moveTo(newContainer);

				card.broadcastInvoke("moveTo", true, [{pointer: true, type: "container", id: newContainer.id}]);
			}
		}).disableSelection();

		return node;
	};

	that.createNode = function() {
		return that.__createNode();
	};

	that.render = function() {
		that._render();
		var node = that.getNode();
		
		for (var i in that.content.order) {
			var card = that.content.cards[that.content.order[i]];
			node.append(card);
		}
		return node;
	};

	return that;
}

var PlayContainerRenderer = function(container) {
	var that = new ContainerRenderer(container);

	that.createNode = function() {
		return that.__createNode().addClass("play");
	};

	return that;
}

var StackedContainerRenderer = function(container) {
	var that = new ContainerRenderer(container);
	that.expanded = false;

	that.___createNode = function() {
		var node = that.__createNode().addClass("stacked");

		node.contextMenu(
			{menu: "context_menu"},
			function(action, el, pos) {
				switch (action) {
					case "shuffle":
						that.content.shuffle();
						that.content.player.game.log("Container #" + that.content.id + " shuffled");
						that.render();
						that.content.broadcastUpdate("order", true, that.content.order);
						break;
					case "expand":
						that.expanded = true;
						that.getNode().children('[data-type="card"]').addClass("visible");
						that.content.player.game.log("Player starts looking at Container #" + that.content.id);
						break;
					case "collapse":
						that.expanded = false;
						that.getNode().children('[data-type="card"]').removeClass("visible");
						that.content.player.game.log("Player stops loking at Container #" + that.content.id);
						break;
				}
			},
			// on show menu callback
			function(e) {
				clearMenu();
				addMenuItem("shuffle", "Shuffle");
				that.expanded ? addMenuItem("collapse", "Collapse") : addMenuItem("expand", "Expand");
			}
		);

		return node;
	};

	that.createNode = function() {
		return that.___createNode();
	};

	return that;
}

var FacedownStackedContainerRenderer = function(container) {
	var that = new StackedContainerRenderer(container);

	that.createNode = function() {
		var node = that.___createNode();
		node.addClass("facedown");
		return node;
	};

	return that;
}

var HandContainerRenderer = function(container) {
	var that = new ContainerRenderer(container);

	that.createNode = function() {
		return that.__createNode().addClass("hand");
	};

	return that;
}

var PlayerRenderer = function(player) {
	var that = new Renderer();

	that.type = "player";
	if (!(player instanceof Player)) {
			throw TypeError("Only Player instance can be passed to PlayerRenderer.");
	}
	that.content = player;

	that.getCounterNode = function(counter) {
		return that.getNode().children('[data-type=counter][data-id="' + counter + '"]');
	};

	that.createCounterNode = function(counter) {
		return $('<input type="number" min="0" max="99" data-type="counter" data-id="' + counter + '" value="' + that.content.counters[counter] + '">')
		.on("change input", function(e) {
			var val = $(this).val();
			if (val < 0) {
				$(this).val(0);
				val = 0;
			}
			var diff = val - that.content.counters[counter];
			if (diff !== 0) {
				that.content.game.log("Player #" + that.content.id + " " + counter + " set to " + val + " (" + (diff > 0 ? "+" :  "") + diff + ")");
				that.content.broadcastInvoke("updateCounter", true, [counter, val]);
			}
			that.content.counters[counter] = val;
		});
	};

	that.createNode = function() {
		var node = that._createNode();

		for (var id in that.content.counters) {
			node.append(that.createCounterNode(id));
		}

		for (var id in that.content.containers) {
			var container = that.content.containers[id].renderer.createNode();
			node.append(container);
		}
	
		// register hot keys
		key('d', function() {
			var deck = that.content.containers.deck;
			if (deck.order.length === 0) {
				that.content.game.log("Player cannot draw a card, deck depleted.");
				return false;
			}

			if (key.shift) {
				var amount = prompt("How many cards?", 2);
				console.log(amount);
			}
			that.content.game.log("Player draws a card");

			var cid = deck.order[0];
			var card = deck.cards[cid];

			var append = true;
			card.moveTo(that.content.containers.hand, append);
			card.renderer.moveTo(card.container.renderer.getNode(), append);
			card.broadcastInvoke("moveTo", true, [{pointer: true, type: "container", id: card.container.id}, append]);
		});

		return node;
	};

	that.render = function() {
		that._render();
		for (var id in that.content.containers) {
			var container = that.content.containers[id].renderer.render();
			that.getNode().append(container);
		}
		return that.getNode();
	};

	that.updateCounter = function(counter, value) {
		that.getCounterNode(counter).val(value);
	};

	return that;
}

var GameRenderer = function(game) {
	var that = new Renderer();

	that.type = "game";
	if (!(game instanceof Game)) {
			throw TypeError("Only Game instance can be passed to GameRenderer.");
	}
	that.content = game;

	that.getNode = function() {
		return $("div#game");
	};

	that.render = function() {
		for (var id in that.content.players) {
			that.getNode().append(that.content.players[id].renderer.render());
		}
		return that.getNode();
	};

	that.createNode = function() {
		for (var id in that.content.players) {
			var player = that.content.players[id].renderer.createNode();
			that.getNode().append(player);
		}
		return that.getNode();
	};

	return that;
}
