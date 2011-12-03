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
			that.element = $("<div/>").addClass("pile card small").attr("data-type", type);
			that.element.dblclick(function(e) {
				that.onDoubleClick(e);
			});
			that.element.append($("<img/>").attr("src", "images/facedown.jpg"));
			that.element.append($("<div/>").addClass("title").text(type.toUpperCase()));
		}

		return that.element;
	};

	this.onDoubleClick = function() {
		if (that.element.attr("data-type") == "deck") {
			console.log("draw");
			game.getPlayer(client_id).draw();
		}
	};
}

Pile.prototype.constructor = Container;
