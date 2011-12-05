function Player() {
	this.counter_element = null;
	this.id = null;
	this.counters = {power: 0, gold: 0};
	this.containers = {};
	this.name = null;
	this.client_id = null;

	var that = this;

	this._init = function() {
		Pile.prototype = new Container("discard");
		this.containers.discard = new Pile();
		
		Pile.prototype = new Container("death");
		this.containers.death = new Pile();

		Pile.prototype = new Container("plot");
		this.containers.plot = new Pile();

		Pile.prototype = new Container("deck");
		this.containers.deck = new Pile();

		Hand.prototype = new Container("hand");
		this.containers.hand = new Hand();

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
		if (that.counter_element == null) {
			that.counter_element = $("<span/>").attr("data-player-id", this.id).addClass("counter-group");

			var $name = $("<span/>").text(that.name).addClass("name");
			$name.click(function() {
				game.openTab(that.id);
			});
			that.counter_element.append($name);

			$("header").append(that.counter_element);
			$.each(that.counters, function(i, v) {
				var $input = $("<input/>").addClass("counter " + i);
				$input.bind("change click", function() {
					that.counters[i] = $(this).val();
					that.broadcastCounter(i);
				});
				that.counter_element.append($input);

				var $icon = $("<img/>").attr("src", "icons/" + i + ".png").addClass("icon");
				$icon.click(function(e) {
					if ($input.val() < 99) {
						$input.val(++that.counters[i]);
						that.broadcastCounter(i);
					}
				}).contextmenu(function(e) {
					if ($input.val() > 0) {
						$input.val(--that.counters[i]);
						that.broadcastCounter(i);
					}
					e.preventDefault();
					return false;
				});
				that.counter_element.append($icon);
			});
		}
		$.each(that.counters, function(i, v) {
			that.counter_element.children("." + i).val(that.counters[i]);
		});

		var $piles = $(".set[data-player-id=" + that.id + "]");
		if (!$piles.size()) {
			$piles = $("<div/>").addClass("set").attr("data-player-id", that.id);
			$("#containers").append($piles);
		}

		$.each(that.containers, function(i, container) {
			var entity = container.render(that.id);
			if (entity && !entity.parent().size()) {
				if (i == "play") {
					$("#containers").append(entity);
				} else {
					$piles.append(entity);
				}
			}
		});
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
			that.containers.hand.add(card);
		}
		that.render();
		game.broadcast();
		console.log(that.name + " draws " + drawn + " card" + (drawn > 1 ? "s" : ""));
	};

	this.updateCounter = function(data) {
		that.counters[data.counter] = data.value;
	};

	this.broadcastCounter = function(counter) {
		send(JSON.stringify({
			"method": "update_counter",
			"player_id": that.id,
			"counter": counter,
			"value": that.counters[counter]
		}));
	};

	this.toSerializable = function() {
		var obj = {
			id: that.id,
			counters: that.counters,
			name: that.name,
			cid: that.client_id,
			containers: {}
		};
		$.each(that.containers, function(i, container) {
			obj.containers[i] = container.toSerializable();
		});
		return obj;
	};

	this._init();
}
