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

	this.render = function(player_id) {
		if (that.element == null) {
			that.element = $("<div/>").addClass("pile card small").attr("data-type", that.type);
			that.element.dblclick(function(e) {
				that.onDoubleClick(e);
			});
			that.element.append($("<img/>").attr("src", "images/facedown.jpg"));
			that.element.append($("<div/>").addClass("title").text(that.type.toUpperCase()));

			that.element.contextMenu({menu: "context_menu"},
				function(action, el, pos) {
					switch(action) {
						case "shuffle":
							that.shuffle(); break;
						case "draw-many":
							game.getPlayer(client_id).draw(prompt("How many cards you want to draw?", 2));
							break;
						case "browse":
							alert("not implemented"); break; // @TODO IMPLEMENT
					}
					game.broadcast(); // @TODO FIX
				},
				// on show menu callback
				function(e) {
					$("#context_menu a").hide();
					$("#context_menu [data-group=pile] a").show();
				}
			);
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
