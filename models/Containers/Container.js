function Container(type) {
	this.element = null;
	this.cards = [];

	this.type = type;
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

	this.render = function(player_id, element) {
		console.log("\trender ", type);
		if (type == "play") {
			that.element = $("[data-type=" + type + "]");
		} else {
			that.element = $("[data-player-id=" + player_id + "] [data-type=" + type + "]");
		}

		if (!that.element.size()) {
			that.element = $('<div />');
			that.element.attr("data-type", type);

			if (player_id != undefined)
				that.element.attr("data-player-id", player_id);

			that.element.droppable({
				accept: ".card",
				scope: "body",
				drop: function(event, ui) {
					var card = game.getCard(ui.draggable.attr("data-id"));

					if (type == "play") {
						ui.draggable.removeClass("small");
					} else {
						ui.draggable.addClass("small");
					}

					// move cards freely on board
					if (this.isSameNode(ui.helper.originalContainer[0]) && type == "play") {
						ui.draggable.draggable("option", "revert", false);
						ui.draggable.css(ui.helper.offset());
						card.updatePositionFromDom();
						card.broadcast();
					}

					// moved to another container, do not revert position
					if (!this.isSameNode(ui.helper.originalContainer[0])) {
						ui.draggable.draggable("option", "revert", false);
						ui.draggable.css(ui.helper.offset());

						$(this).append(ui.draggable);

						if (type == "play") {
							ui.draggable.css({position: "absolute"});
						} else {
							if (card.kneeling)
								card.stand();
							if (card.faceDown)
								card.turnFaceUp();
							ui.draggable.css({position: "relative", top: 0, left: 0});
						}

						// change card position in logical structure
						if ($(this).attr("data-type") != "play") {
							card.moveTo(game.players[$(this).attr("data-player-id")].containers[$(this).attr("data-type")]);
						} else {
							card.moveTo(game.play);
						}
						card.updatePositionFromDom();
						game.broadcast(); // TODO optimize
					}
				},
				over: function(e, ui) {
					if (type == "play") {
						ui.helper.removeClass("small");
					}
				},
				out: function(e, ui) {
					if (type == "play") {
						ui.helper.addClass("small");
					}
				}
			});
		}

		$.each(this.cards, function(i, card) {
			that.element.append(card.render());
			console.log("\t\trendered card", that.element);
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
