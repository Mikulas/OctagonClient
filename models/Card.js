function Card() {
	this.element = null;
	this.card_id = null;
	this.id = null;
	this.position = {top: 0, left: 0, z: 1};
	this.kneeling = false;
	this.faceDown = false;
	this.container = null;

	var that = this;
	this.name = null;

	this._init = function() {
		that.grabName();
	};

	this.moveTo = function(container) {
		// find this card's index in container's cards array
		$.each(that.container.cards, function(i, card) {
			if (card == undefined)
				return false;

			if (card.id == that.id) {
				that.container.cards.splice(i, i + 1);
			}
		});
		container.add(that);

		game.log(player_name + " moves " + that.name + " to " + container.type);
	};

	this.grabName = function() {
		$.ajax({
			url: "cards.json",
			dataType: "json",
			type: "GET",
			success: function(data) {
				that.name = data[that.card_id];
			}
		});
	};

	this.focus = function() {
		$(".focus").removeClass("focus");
		that.element.addClass("focus");
	};

	this.stand = function() {
		that.element.removeClass("kneeling").addClass("standing").addClass("stand");
		setTimeout(function() {
			that.element.removeClass("stand");
		}, 600);
		that.kneeling = false;
		game.log(player_name + " stands " + that.name + "");
	};

	this.kneel = function() {
		that.element.removeClass("standing").addClass("kneeling").addClass("kneel");
		setTimeout(function() {
			that.element.removeClass("kneel");
		}, 600);
		that.kneeling = true;
		game.log(player_name + " kneels " + that.name + "");
	};

	this.toggleKneeling = function() {
		if (that.kneeling) {
			that.stand();
		} else {
			that.kneel();
		}
	};

	this.turnFaceUp = function() {
		that.element.removeClass("face-down").addClass("face-up");
		if (!that.kneeling) {
			that.element.addClass("turn-face-up");
			setTimeout(function() {
				that.element.removeClass("turn-face-up");
			}, 400);

		} else {
			that.element.addClass("turn-face-up-kneeling");
			setTimeout(function() {
				that.element.removeClass("turn-face-up-kneeling");
			}, 400);
		}

		setTimeout(function() {
			that.element.removeClass("turn-face-up");
		}, 400);

		// these animations take .4 seconds, being at scale 0 at .2
		setTimeout(function() {
			that.element.children('img').attr('src', that.getImageSrc());
		}, 200);
		that.faceDown = false;

		game.log(player_name + " turns " + that.name + " face up");
	};

	this.turnFaceDown = function() {
		that.element.removeClass("face-up").addClass("face-down");
		if (!that.kneeling) {
			that.element.addClass("turn-face-down");
			setTimeout(function() {
				that.element.removeClass("turn-face-down");
			}, 400);
			
		} else {
			that.element.addClass("turn-face-down-kneeling");
			setTimeout(function() {
				that.element.removeClass("turn-face-down-kneeling");
			}, 400);
		}

		// these animations take .4 seconds, being at scale 0 at .2
		setTimeout(function() {
			that.element.children('img').attr('src', that.getBackImageSrc());
		}, 200);

		that.faceDown = true;

		game.log(player_name + " turns " + that.name + " face down");
	};

	this.toggleFaceDown = function() {
		if (that.faceDown) {
			that.turnFaceUp();
		} else {
			that.turnFaceDown();
		}
	};

	this.getImageSrc = function() {
		return "images/" + that.card_id + ".jpg";
	};

	this.getBackImageSrc = function() {
		return "images/facedown.jpg";
	};

	this.updatePositionFromDom = function() {
		if (that.element == null)
			return false;
		that.position = that.element.position();
		that.position.z = that.element.css("z-index");
	};

	this.render = function(type) {
		if (that.element == null) {
			that.element = $("<div/>").addClass("card");
			that.element.disableSelection().attr("data-id", that.id);
			that.element.click(function(e) {
				that.onClick(e);
			});
			that.element.dblclick(function(e) {
				that.onDoubleClick(e);
			});

			that.element.draggable({
				revert: true,
				scope: "body",
				stack: ".card[data-id!=" + that.id + "]",
				helper: function() { // improved clone
					var clone = that.element.clone(false);
					clone.insertBefore(that.element);
					return clone;
				},
				start: function(e, ui) {
					that.element.fadeTo(100, 0.5);
					ui.helper.css("z-index", 9997);
					ui.helper.mouse = {x: e.originalEvent.offsetX, y: e.originalEvent.offsetY};
					ui.helper.originalContainer = that.element.parent();
					that.element.draggable("option", "revert", true); // reset
				},
				stop: function(e, ui) {
					that.element.fadeTo(0, 1);
				}
			});
			that.element.contextMenu(
				{menu: "context_menu"},
				function(action, el, pos) {
					if (that.container.type == "play") {
						that.handleContextMenu(action, el, pos);

					} else if (that.container.type == "hand") {
						that.container.handleContextMenu(action, el, pos);
					}
				},
				// on show menu callback
				function(e) {
					if (that.container.type == "play") {
						that.showContextMenu(e);

					} else if (that.container.type == "hand") {
						// defaults to correct settings
						return true;

					} else {
						return false;
					}
				}
			);

			that.element.append($("<img/>").addClass("raw-card").attr("src", that.getImageSrc()));
		}

		if (that.kneeling && !that.element.hasClass("kneeling")) {
			that.kneel();
		} else if (!that.kneeling && that.element.hasClass("kneeling")) {
			that.stand();
		}

		if (that.faceDown && !that.element.hasClass("face-down")) {
			that.turnFaceDown();
		} else if (!that.faceDown && that.element.hasClass("face-down")) {
			that.turnFaceUp();
		}

		if (that.container.type == "play") {
			that.element.css({
				position: "absolute",
				"z-index": that.position.z
			});
			if (that.position.left != null && that.position.top != null) {
				that.element.stop(true).animate({
					left: that.position.left,
					top: that.position.top
				}, 600);
			}
		} else {
			that.element.css({position: "relative", top: 0, left: 0});
		}

		return that.element;
	};

	this.handleContextMenu = function(action, el, pos) {
		switch(action) {
			case "kneel":
				that.kneel(); break;
			case "stand":
				that.stand(); break;
			case "face-down":
				that.turnFaceDown(); break;
			case "face-up":
				that.turnFaceUp(); break;
		}
		that.broadcast();
	};

	this.showContextMenu = function(e) {
		$("#context_menu a").hide();
		$("#context_menu [data-group=card] a").show();

		if (that.kneeling) {
			$("#context_menu [href=#kneel]").hide();
		} else {
			$("#context_menu [href=#stand]").hide();
		}
		if (that.faceDown) {
			$("#context_menu [href=#face-down]").hide();
		} else {
			$("#context_menu [href=#face-up]").hide();
		}
	};

	this.update = function(data) {
		that.id = data.id;
		that.card_id = data.cid;
		if (data.hasOwnProperty("p")) {
			that.position = {
				top: data.p.hasOwnProperty("t") ? data.p.t : 0,
				left: data.p.hasOwnProperty("l") ? data.p.l : 0,
				z: data.p.hasOwnProperty("z") ? data.p.z : 1
			};
		}
		that.kneeling = data.hasOwnProperty("k") ? data.k : false;
		that.faceDown = data.hasOwnProperty("f") ? data.f : false;
	};

	this.onClick = function(e) {
		//this.focus();
	};

	this.onDoubleClick = function(e) {
		if (that.container.type == "play")
			that.toggleKneeling();
		that.broadcast();
	};

	this.broadcast = function(e) {
		send(JSON.stringify({method: "update_card", card: that.toSerializable()}));
	};

	this.toSerializable = function() {
		var obj = {
			cid: that.card_id,
			id: that.id
		};
		if (that.position.top != 0) {
			if (!obj.hasOwnProperty("p"))
				obj.p = {};
			obj.p.t = that.position.top;
		}
		if (that.position.left != 0) {
			if (!obj.hasOwnProperty("p"))
				obj.p = {};
			obj.p.l = that.position.left;
		}
		if (that.position.z != 1) {
			if (!obj.hasOwnProperty("p"))
				obj.p = {};
			obj.p.z = that.position.z;
		}
		if (that.kneeling) {
			obj.k = that.kneeling;
		}
		if (that.faceDown) {
			obj.f = that.faceDown;
		}
		return obj;
	};

	this._init();
}
