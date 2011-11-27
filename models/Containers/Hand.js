function Hand() {
	var client_id = null;
	var that = this;

	this.render = function(type, player_id) {
		var register = that.element == null;
		that.element = new Container().render.call(this, type, player_id);
		if (register) {
			$(window).resize(function() {
				that.resizeElement();
			});
		}

		that.element.children().addClass("small");

		if (window.client_id != that.client_id && that.cards.length > 0) {
			// this player cannot see other players hand
			that.element.children().attr("src", that.cards[0].getBackImageSrc());
		}

		that.resizeElement();

		return that.element;
	};

	this.resizeElement = function() {
		var width = $(document).width() - $("[data-type=plot]").width() - $("[data-type=death]").width() - $("[data-type=discard]").width() - $("[data-type=death]").width() - 20; // 20 is scrollbar quickfix
		that.element.width(width);
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
