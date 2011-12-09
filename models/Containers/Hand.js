function Hand() {
	var client_id = null;
	var that = this;

	this.render = function(player_id) {
		var register = that.element == null;
		that.element = new Container(that.type).render.call(this, player_id);
		if (register) {
			$(window).resize(function() {
				that.resizeElement();
			});

			that.element.contextMenu({menu: "context_menu"},
				function(action, el, pos) {
					switch(action) {
						case "random-discard":
							that.discardRandom(player_id); break;
					}
					game.broadcast(); // @todo fixme
				},
				// on show menu callback
				function(e) {
					var card = game.getCard($(e.srcElement).parent().attr("data-id"));

					$("#context_menu a").hide();
					$("#context_menu [data-group=hand] a").show();
					if (that.cards.length <= 0) {
						$("#context_menu [href=#random-discard]").hide();
					}
				}
			);
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
		var width = $(document).width() - $("[data-type=plot]").width() - $("[data-type=death]").width() - $("[data-type=discard]").width() - $("[data-type=death]").width() - 20 - 90; // 20 is scrollbar quickfix, 90 is for padding (not a failsafe solution)
		that.element.width(width);
	};


	this.toSerializable = function() {
		var obj = {c: [], cid: that.client_id};
		$.each(that.cards, function(i, card) {
			obj.c.push(card.toSerializable());
		});
		return obj;
	};

	this.discard = function(player_id, card_internal_index) {
		var card = that.cards[card_internal_index];
		card.element.remove(); // remove from current container (usually play)
		var container = game.players[player_id].containers["discard"];
		card.moveTo(container);
	};

	this.discardRandom = function(player_id) {
		that.discard(player_id, Math.floor(Math.random() * that.cards.length));
	};
}

Hand.prototype.constructor = Container;
