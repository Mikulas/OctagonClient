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

	this.add = function(card) {
		that.cards.push(card);
		card.container = that;
	};

	this.render = function(type, player_id, element) {
		that.element = $("[data-type=" + type + "][data-player-id=" + player_id + "]");
		if (!that.element.size()) {
			that.element = $('<div />');
			that.element.attr("data-type", type).attr("data-player-id", player_id);
			that.element.droppable({
				accept: ".card",
				scope: "body",
				drop: function(event, ui) {
					var card = game.getCard(ui.draggable.attr("data-id"));

					// move cards freely on board
					if (this.isSameNode(ui.helper.originalContainer[0]) && that.getType() == "play") {
						ui.draggable.draggable("option", "revert", false);
						card.updatePositionFromDom();
						card.broadcast();
					}

					// revert to original position if not moved to another container
					if (!this.isSameNode(ui.helper.originalContainer[0])) {
						ui.draggable.draggable("option", "revert", false);

						$(this).append(ui.draggable);

						if (that.getType() == "play") {
							ui.draggable.css({position: "absolute"});
						} else {
							ui.draggable.css({position: "relative", top: 0, left: 0});
						}

						// change card position in logical structure
						card.moveTo(game.players[$(this).attr("data-player-id")].containers[$(this).attr("data-type")]);
						card.updatePositionFromDom();
						game.broadcast(); // TODO optimize
					}
				},
				over: function(e, ui) {
					if (that.getType() == "play") {
						ui.draggable.removeClass("small");
					}
				},
				out: function(e, ui) {
					if (that.getType() == "play") {
						ui.draggable.addClass("small");
					}
				}
			});
		}

		$.each(this.cards, function(i, card) {
			that.element.append(card.render());
		});
		return that.element;
	};

	this.getType = function() {
		if (that.element == null)
			return false;

		return that.element.attr("data-type");
	};

	this.toSerializable = function() {
		var obj = {c: []};
		$.each(that.cards, function(i, card) {
			obj.c.push(card.toSerializable());
		});
		return obj;
	};
}
