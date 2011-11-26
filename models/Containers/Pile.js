function Pile() {
	var that = this;

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

	this.render = function(type, player_id) {
		if (that.element == null) {
			that.element = $("<div />");
			that.element.attr("data-type", type).attr("data-player-id", player_id);
		}
		if (that.cards.length > 1) {
			that.element.append($("<img/>").addClass("card small").attr("src", that.cards[0].getBackImageSrc()));
		}
		return that.element;
	}
}

Pile.prototype.constructor = Container;
