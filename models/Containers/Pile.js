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
			that.element = new Container().render.call(this, type, player_id);
			that.element.dblclick(function(e) {
				that.onDoubleClick(e);
			});
			that.element.children().remove();
		}

		if (that.cards.length == 0) {
			that.element.children().remove();
		}
		if (that.cards.length > 1 && that.element.children().size() == 0) {
			that.element.append($("<img/>").addClass("card small face-down").attr("src", that.cards[0].getBackImageSrc()));
		}
		
		return that.element;
	};

	this.onDoubleClick = function() {
		if (that.element.attr("data-type") == "deck") {
			game.getPlayer(client_id).draw();
		}
	};
}

Pile.prototype.constructor = Container;
