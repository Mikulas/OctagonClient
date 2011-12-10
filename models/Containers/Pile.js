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
		game.log(player_name + " shuffles " + (that.type == "deck" ? that.type : that.type + " pile"));
	};

	this.render = function(player_id) {
		if (that.element == null) {
			that.element = new Container(that.type).render();
			that.element.children().remove();
			that.element.addClass("pile card small").attr("data-type", that.type);
			that.element.dblclick(function(e) {
				that.onDoubleClick(e);
			});

			that.element.append($("<img/>").attr("src", "images/facedown.jpg"));
			that.element.append($("<div/>").addClass("title").text(that.type.toUpperCase()).append($("<div></div>").addClass("count").text("20 cards")));

			that.element.contextMenu({menu: "context_menu"},
				function(action, el, pos) {
					switch(action) {
						case "shuffle":
							that.shuffle(); break;
						case "draw":
							game.getPlayer(client_id).draw(1);
							break;
						case "draw-many":
							game.getPlayer(client_id).drawMany();
							break;
						case "browse":
							that.renderBrowse();
							break;
					}
					game.broadcast(); // @TODO FIX
				},
				// on show menu callback
				function(e) {
					$("#context_menu a").hide();
					$("#context_menu [data-group=pile] a").show();
					if (that.type != "deck") {
						$("#context_menu [href^=#draw]").add("#context_menu [href=#shuffle]").hide();
					}
				}
			);
		}

		that.element.find("img").attr("src", that.cards.length == 0 ? "images/empty.jpg" : "images/facedown.jpg");
		that.element.find(".count").text(that.cards.length == 0 ? "empty" : that.cards.length == 1 ? "one card" : that.cards.length + " cards");

		return that.element;
	};

	this.renderBrowse = function() {
		// @TODO implement
		$("#browser").children().remove();
		$.each(that.cards, function(i, card) {
			$("#browser").append(card.render("browser").addClass("small"));
		});
	};

	this.onDoubleClick = function() {
		if (that.element.attr("data-type") == "deck") {
			game.getPlayer(client_id).draw();
		}
	};
}

Pile.prototype.constructor = Container;
