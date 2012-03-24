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

	that.createNode = function() {
		var node = that._createNode();
		node.text(that.content.id);
		node.contextMenu(
			{menu: "context_menu"},
			function(action, el, pos) {
				switch (action) {
					case "kneel":
						console.info("Player knelt card #" + that.content.id);
						that.content.kneel();
						that.kneel();
						that.content.broadcastInvoke("kneel", true);
						break;
					case "stand":
						console.info("Player stood card #" + that.content.id);
						that.content.stand();
						that.stand();
						that.content.broadcastInvoke("stand", true);
						break;
				}
			},
			// on show menu callback
			function(e) {
				clearMenu();
				console.log(that.content.kneeling);
				that.content.kneeling ? addMenuItem("stand", "Stand") : addMenuItem("kneel", "Kneel");
			}
		);
		node.addClass(that.content.kneeling ? "kneeling" : "standing");
		return node;
	};

	that.kneel = function() {
		that.getNode().removeClass("standing").addClass("kneeling");
	};

	that.stand = function() {
		that.getNode().removeClass("kneeling").addClass("standing");
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
		for (var id in that.content.cards) {
			var card = that.content.cards[id].renderer.createNode();
			node.append(card);
		}

		node.sortable({
			revert: true, 
			connectWith: "[data-type=container]", 
			stack: "[data-type=card]", 
			scope: "container-" + that.content.id,
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
				
				card.moveTo(newContainer);

				card.broadcastInvoke("moveTo", false, [{pointer: true, type: "container", id: newContainer.id}]);
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
		
		$.each(that.content.order, function(o, id) {
			var card = that.content.cards[id].renderer.render();
			node.append(card);
		});
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

	that.createNode = function() {
		var node = that.__createNode().addClass("stacked");

		node.contextMenu(
			{menu: "context_menu"},
			function(action, el, pos) {
				switch (action) {
					case "shuffle":
						that.content.shuffle();
						console.info("Container #" + that.content.id + " shuffled");
						break;
					case "expand":
						that.expanded = true;
						that.getNode().children('[data-type="card"]').show();
						console.info("Player starts looking at Container #" + that.content.id);
						break;
					case "collapse":
						that.expanded = false;
						that.getNode().children('[data-type="card"]').hide();
						console.info("Player stops loking at Container #" + that.content.id);
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

	that.createNode = function() {
		var node = that._createNode();
		for (var id in that.content.containers) {
			var container = that.content.containers[id].renderer.createNode();
			node.append(container);
		}
	
		// register hot keys
		key('d', function() {
			var deck = that.content.containers.deck;
			if (Object.keys(deck.cards).length === 0) {
				console.info("Player cannot draw a card, deck depleted.");
				return false;
			}

			console.info("Player draws a card");
			var cid = deck.order[0];
			deck.order.shift();
			var card = deck.cards[cid];

			var append = true;
			card.moveTo(that.content.containers.hand, append);
			card.renderer.moveTo(card.container.renderer.getNode(), append);
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
