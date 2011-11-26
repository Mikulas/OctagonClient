function Hand() {
	var client_id = null;
	var that = this;

	this.render = function(type, player_id) {
		console.log(window.client_id != that.client_id, window.client_id, that.client_id);
		if (window.client_id != that.client_id) {
			// this player cannot see other players hand
			return false;
		}

		var element = new Container().render.call(this, type, player_id);
		element.children().addClass("small");
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
