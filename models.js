"use strict";

Array.prototype.shuffle = function() {
	var s = [];
	while (this.length)s.push(this.splice(Math.random() * this.length, 1)[0]);
	while (s.length) this.push(s.pop());
	return this;
};

var Card = function(image) {
	this.id = ++Card.uniqueId;
	this.name = null;
	this.image = image;
	this.kneeling = false;
	this.visibleTo = []; // player id[]
	this.container = null;
	this.renderer = new CardRenderer(this);
	this.counters = {
		power: 0,
		gold: 0
	};

	this.kneel = function() {
		this.kneeling = true;
	};

	this.stand = function() {
		this.kneeling = false;
	};

	this.showTo = function(player) {
		if (!(player instanceof Player)) {
			throw TypeError("Card can only be shown to Player.");
		}
		if (this.visibleTo.indexOf(player.id) !== -1) {
			throw Error("Player " + player.id + " can already see this card.");
		}
		this.visibleTo.push(player.id); // @todo if does not exist yet
	};

	this.hideTo = function(player) {
		if (!(player instanceof Player)) {
			throw TypeError("Card can only be hidden to Player.");
		}
		if (this.visibleTo.indexOf(player.id) === -1) {
			throw Error("Player " + player.id + " cannot see this card already.");
		}
		this.visibleTo.push(player.id); // @todo if does not exist yet
	};

	this.discard = function() {
		this.moveTo(this.container.player.containers["discard"]);
	};

	this.moveTo = function(container, append) {
		if (!(container instanceof Container)) {
			throw TypeError("Card can only be moved to Container.");
		}

		container.cards[this.id] = this;
		// remove card id from original container order array
		this.container.order.splice(this.container.order.indexOf(this.id), 1);
		// remove card itself
		delete this.container.cards[this.id];

		var methodLeave = "onLeave" + this.container.type.replace(/^(.)/, function(m, dot) {return dot.toUpperCase();});
		if (this.hasOwnProperty(methodLeave))
			this[methodLeave]();
		if (this.renderer.hasOwnProperty(methodLeave))
			this.renderer[methodLeave]();
		
		this.container = container;
		
		if (typeof append === "undefined" || !append)
			this.container.order.push(this.id);
		else
			this.container.order.splice(0, 0, this.id);

		var methodEnter = "onEnter" + this.container.type.replace(/^(.)/, function(m, dot) {return dot.toUpperCase();});
		if (this.hasOwnProperty(methodEnter))
			this[methodEnter]();
		if (this.renderer.hasOwnProperty(methodEnter))
			this.renderer[methodEnter]();
	};

	this.onLeavePlay = function() {
		console.log("onLeavePlay");
		for (var i in this.counters) {
			this.counters[i] = 0;
		}
		this.kneeling = false;
	};

	this.updateCounter = function(counter, value) {
		this.counters[counter] = value;
	};

	this.getTree = function() {
		var tree = {
			id: this.id,
			name: this.name,
			kneeling: this.kneeling,
			visibleTo: this.visibleTo,
			counters: this.counters,
			image: this.image
		};
		return tree;
	};

	this.processMirror = function(tree) {
		for (var i in tree) {
			this[i] = tree[i];
		}
	};

	this.broadcastInvoke = function(call, render, args) {
		args = typeof args === "undefined" ? [] : args;

		this.container.player.game.connection.send({
			method: "invoke",
			type: "card",
			id: this.id,
			call: call,
			render: render,
			args: args
		});
	};
};
Card.uniqueId = 0;

/** @abstract */
var Container = function(Renderer, player) {
	this.id = ++Container.uniqueId;
	this.cards = {};
	this.renderer = new Renderer(this);
	this.order = []; // id[]
	this.type = null;
	
	if (!(player instanceof Player)) {
		throw TypeError("Only Player instance can be passed to Container.");
	}
	this.player = player;

	this._add = function(card) {
		if (!(card instanceof Card)) {
			throw TypeError("Only Card instance can be added to Container.");
		}

		this.cards[card.id] = card;
		card.container = this;
		this.order.push(card.id);
	};

	this.add = function(card) {
		return this._add(card);
	};

	this.shuffle = function() {
		this.order = this.order.shuffle();
	};

	this.getCard = function(id) {
		for (var cid in this.cards) {
			if (cid == id)
				return this.cards[id];
		}
		return null;
	};

	this.getTree = function() {
		var tree = {id: this.id, type: this.type, order: this.order, cards: {}};
		for (var cid in this.cards) {
			tree.cards[cid] = this.cards[cid].getTree();
		}
		return tree;
	};

	this.processMirror = function(tree) {
		for (var cid in tree.cards) {
			var c = new Card(tree.cards[cid].image);
			this.add(c);
			c.processMirror(tree.cards[cid]);
		}
		delete tree.cards;
		for (var i in tree) {
			this[i] = tree[i];
		}
	};

	this.broadcastUpdate = function(property) {
		this.player.game.connection.send({
			method: "update",
			type: "container",
			id: this.id,
			render: true,
			property: property,
			value: this[property]
		});
	};
};
Container.uniqueId = 0;

var Player = function() {
	this.id = ++Player.uniqueId;
	this.renderer = new PlayerRenderer(this);
	this.game = null;

	this.counters = {
		power: 0,
		gold: 0
	};

	this.containers = {
		play: new Container(PlayContainerRenderer, this),
		hand: new Container(HandContainerRenderer, this),
		plot: new Container(StackedContainerRenderer, this),
		death: new Container(StackedContainerRenderer, this),
		discard: new Container(StackedContainerRenderer, this),
		deck: new Container(FacedownStackedContainerRenderer, this)
	};
	for (var type in this.containers) {
		this.containers[type].type = type;
	}

	this.getCard = function(id) {
		for (var kid in this.containers) {
			var card = this.containers[kid].getCard(id);
			if (card !== null)
				return card;
		}
		return null;
	};

	this.getContainer = function(id) {
		for (var kid in this.containers) {
			var container = this.containers[kid];
			if (container.id == id)
				return container;
		}
		return null;
	};

	this.updateCounter = function(counter, value) {
		this.counters[counter] = value;
	};

	this.getTree = function() {
		var tree = {id: this.id, counters: this.counters, containers: {}};
		for (var kid in this.containers) {
			tree.containers[kid] = this.containers[kid].getTree();
		}
		return tree;
	};

	this.processMirror = function(tree) {
		for (var kid in tree.containers) {
			var renderer = null;
			switch (kid) {
				case "play":
					renderer = PlayContainerRenderer; break;
				case "hand":
					renderer = HandContainerRenderer; break;
				case "plot":
				case "death":
				case "discard":
					renderer = StackedContainerRenderer; break;
				case "deck":
					renderer = FacedownStackedContainerRenderer; break;
			}
			var k = new Container(renderer, this);
			k.type = kid;
			this.containers[kid] = k;
			k.processMirror(tree.containers[kid]);
		}
		delete tree.containers;
		for (var i in tree) {
			this[i] = tree[i];
		}
	};

	this.broadcastInvoke = function(call, render, args) {
		args = typeof args === "undefined" ? [] : args;

		this.game.connection.send({
			method: "invoke",
			type: "player",
			id: this.id,
			call: call,
			render: render,
			args: args
		});
	};
}
Player.uniqueId = 0;

var Game = function(connection) {
	this.players = {};
	this.renderer = new GameRenderer(this);
	this.logMessages = [];

	if (!(connection instanceof Connection)) {
		throw TypeError("Only Connection instance can be passed to Game.");
	}
	this.connection = connection;
	this.connection.game = this;

	this.getCard = function(id) {
		for (var pid in this.players) {
			var card = this.players[pid].getCard(id);
			if (card !== null)
				return card;
		}
		return null;
	};

	this.getContainer = function(id) {
		for (var pid in this.players) {
			var container = this.players[pid].getContainer(id);
			if (container !== null)
				return container;
		}
		return null;
	};

	this.add = function(player) {
		if (!(player instanceof Player)) {
			throw TypeError("Only Player instance can be added to Game.");
		}
		this.players[player.id] = player;
		player.game = this;
	};

	this.log = function(message, invoked) {
		this.logMessages.push(message);
		console.info("LOG", message);
		if (typeof invoked === "undefined" || invoked === false)
			this.broadcastLog(message);
	};

	this.getTree = function() {
		var tree = {logMessages: this.logMessages, players: {}};
		for (var pid in this.players) {
			tree.players[pid] = this.players[pid].getTree();
		}
		return tree;
	};

	this.processMirror = function(tree) {
		for (var pid in tree.players) {
			var p = new Player();
			this.add(p);
			p.processMirror(tree.players[pid]);
		}
		delete tree.players;
		for (var i in tree) {
			this[i] = tree[i];
		}
	};

	this.broadcastLog = function(message) {
		this.connection.send({
			method: "log",
			message: message
		});
	};
};
