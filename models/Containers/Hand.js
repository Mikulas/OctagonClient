function Hand() {
	var that = this;

	this.render = function() {
		if (that.element == null) {
			that.element = $('<div />').addClass("container");
		}
		that.element.children().remove();

		$.each(that.cards, function(i, card) {
			var element = card.render();
			element.addClass("small");
			that.element.append(element);
		});
		return that.element;
	}
}

Hand.prototype.constructor = Container;
