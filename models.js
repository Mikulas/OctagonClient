"use strict";

Array.prototype.shuffle = function() {
	var s = [];
	while (this.length)s.push(this.splice(Math.random() * this.length, 1)[0]);
	while (s.length) this.push(s.pop());
	return this;
};

var Card = function() {
	this.id = ++Card.uniqueId;
	this.name = null;
	this.kneeling = false;
	this.visibleTo = []; // player id[]
	this.container = null;
	this.renderer = new CardRenderer(this);

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

	this.moveTo = function(container, append) {
		if (!(container instanceof Container)) {
			throw TypeError("Card can only be moved to Container.");
		}

		container.cards[this.id] = this;
		// remove card id from original container order array
		delete this.container.order[this.container.order.indexOf(this.id)];
		// remove card itself
		delete this.container.cards[this.id];
		this.container = container;
		
		if (typeof append === "undefined" || !append)
			this.container.order.push(this.id);
		else
			this.container.order.splice(0, 0, this.id);
	};

	/** function(call, arg1, arg2, ...) */
	this.broadcast = function(call) {
		var args = [];
		for (var i in arguments) {
			args.push(arguments[i]);
		}
		args.shift();

		this.container.player.game.connection.send({
			method: "invoke",
			type: "card",
			id: this.id,
			call: call,
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
		this.order.shuffle;
	};

	this.getCard = function(id) {
		for (var cid in this.cards) {
			if (cid == id)
				return this.cards[id];
		}
		return null;
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
		deck: new Container(StackedContainerRenderer, this)
	};

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
}
Player.uniqueId = 0;

var Game = function(connection) {
	this.players = {};
	this.renderer = new GameRenderer(this);

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
};
