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

	this.render = function(type, player_id) {
		if (that.element == null) {
			that.element = $('<div />');
			that.element.attr("data-type", type).attr("data-player-id", player_id);
			that.element.droppable({
				accept: ".card",
				scope: "body",
				drop: function(event, ui) {
					// move cards freely on board
					if (this.isSameNode(ui.helper.originalContainer[0]) && that.getType() == "play") {
						ui.draggable.draggable("option", "revert", false);
					}

					// revert to original position if not moved to another container
					if (!this.isSameNode(ui.helper.originalContainer[0])) {
						ui.draggable.draggable("option", "revert", false);
						var cords = ui.draggable.offset();
						$(this).append(ui.draggable);
						ui.draggable.css(cords).css({position: "absolute"});

						if (that.getType() == "hand") {
							ui.draggable.addClass("small");
						} else {
							ui.draggable.removeClass("small");
						}
						//console.log("TODO: change card position in structure AND? DOM");
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
