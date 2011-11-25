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

	this.render = function() {
		if (that.element == null) {
			that.element = $('<div />').addClass("container");
			that.element.droppable({
				accept: ".card",
				scope: "body",
				drop: function(event, ui) {
					console.log("TODO: change card position in structure");
				}
			});
		}

		$.each(this.cards, function(i, card) {
			that.element.append(card.render());
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
