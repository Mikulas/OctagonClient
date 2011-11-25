function Player() {
	this.counter_container = null;
	this.id = null;
	this.counters = {power: 0, gold: 0};
	this.containers = {};

	var that = this;

	this._init = function() {
		Pile.prototype = new Container();
		this.containers.deck = new Pile();

		Pile.prototype = new Container();
		this.containers.plot = new Pile();

		Pile.prototype = new Container();
		this.containers.discard = new Pile();

		Pile.prototype = new Container();
		this.containers.death = new Pile();

		Board.prototype = new Container();
		this.containers.play = new Board();

		Hand.prototype = new Container();
		this.containers.hand = new Hand();
		console.log(game);

		this.counters = {power: 0, gold: 0};
	};

	this.getCard = function(id) {
		var found = null;
		$.each(that.containers, function(i, container) {
			var card = container.getCard(id);
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

		$("#hand").append(that.containers.hand.render(true));
	};

	this.draw = function(count) {
		if (count == undefined)
			count = 1;

		var drawn = 0;
		while (count-- > 0) {
			var card = that.containers.deck.cards.pop();
			if (card == undefined) {
				console.log("cannot draw more cards, deck depleted");
				break;
			}
			drawn++;
			that.containers.hand.cards.push(card);
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
			containers: {}
		};
		$.each(that.containers, function(i, container) {
			obj.containers[i] = container.toSerializable();
		});
		return obj;
	};

	this._init();
}