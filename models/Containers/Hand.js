function Hand() {
	var client_id = null;
	var that = this;

	this.render = function(type, player_id) {
		var element = new Container().render.call(this, type, player_id);
		element.children().addClass("small");

		if (window.client_id != that.client_id && that.cards.length > 0) {
			// this player cannot see other players hand
			element.children().attr("src", that.cards[0].getBackImageSrc());
		}

		return element;
	};

	this.toSerializable = function() {
		var obj = {c: [], cid: that.client_id};
		$.each(that.cards, function(i, card) {
			obj.c.push(card.toSerializable());
		});
		return obj;
	};
}

Hand.prototype.constructor = Container;
