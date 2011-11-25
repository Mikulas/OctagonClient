function Container() {
	this.element = null;
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
		console.log("container shuffled");
	};

	this.render = function(revert) {
		if (that.element == null) {
			that.element = $('<div />').addClass("container");
		}

		$.each(this.cards, function(i, card) {
			that.element.append(card.render(revert));
		});
		return that.element;
	};

	this.toSerializable = function() {
		var obj = {c: []};
		$.each(that.cards, function(i, card) {
			obj.c.push(card.toSerializable());
		});
		return obj;
	};
}
