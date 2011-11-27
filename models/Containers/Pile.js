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
			that.element.children().addClass("small");
		}
		if (that.cards.length >= 1 && !that.element.children("img.helper").size() && (type == "deck" || type == "plot")) {
			that.element.append($("<img/>")
				.addClass("card small face-down helper")
				.attr("src", that.cards[0].getBackImageSrc()))
				.css({"z-index": 9996, display: "inline-block !important"});
		} else if (that.cards.length == 0) {
			that.element.children("img.helper").remove();
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
