function Card() {
	this.element = null;
	this.card_id = null;
	this.id = null;
	this.position = {top: 0, left: 0, z: 1};
	this.kneeling = false;
	this.faceDown = false;
	this.container = null;

	var that = this;

	this._init = function() {
		
	};

	this.moveTo = function(container) {
		// find this card's index in container's cards array
		console.log(that.container.cards);
		$.each(that.container.cards, function(i, card) {
			if (card == undefined)
				return false;

			if (card.id == that.id) {
				that.container.cards.splice(i, i + 1);
			}
		});
		container.add(that);
	};

	this.focus = function() {
		$(".focus").removeClass("focus");
		that.element.addClass("focus");
	};

	this.stand = function() {
		that.element.removeClass("kneeling").addClass("standing");
		that.kneeling = false;
	};

	this.kneel = function() {
		that.element.removeClass("standing").addClass("kneeling");
		that.kneeling = true;
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
		// this animation takes .4 seconds, being at scale 0 at .2
		setTimeout(function() {
			that.element.children('img').attr('src', that.getImageSrc());
		}, 200);
		that.faceDown = false;
	};

	this.turnFaceDown = function() {
		that.element.removeClass("face-up").addClass("face-down");
		// this animation takes .4 seconds, being at scale 0 at .2
		setTimeout(function() {
			that.element.children('img').attr('src', that.getBackImageSrc());
		}, 200);
		that.faceDown = true;
	};

	this.toggleFaceDown = function() {
		if (that.faceDown) {
			that.turnFaceUp();
		} else {
			that.turnFaceDown();
		}
	};

	this.getImageSrc = function() {
		return "http://192.168.100.77/OctgnWeb/images/" + that.card_id + ".jpg";
	};

	this.getBackImageSrc = function() {
		return "http://192.168.100.77/OctgnWeb/images/facedown.jpg";
	};

	this.updatePositionFromDom = function() {
		if (that.element == null)
			return false;
		that.position = that.element.position();
		that.position.z = that.element.css("z-index");
	};

	this.render = function() {
		if (that.element == null) {
			that.element = $("<div/>").attr("data-id", that.id).addClass("card");
			that.element.disableSelection();
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
				start: function(e, ui) {
					ui.helper.mouse = {x: e.originalEvent.offsetX, y: e.originalEvent.offsetY};
					ui.helper.originalContainer = that.element.parent();
					that.element.draggable("option", "revert", true); // reset
				}
			});
			/*
			that.element.contextMenu({menu: "context_menu"},
				function(action, el, pos) {
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
				},
				// on show menu callback
				function(e) {
					var card = game.getCard($(e.srcElement).parent().attr("data-id"));
					if (card.kneeling) {
						$("#context_menu [href=#kneel]").hide();
						$("#context_menu [href=#stand]").show();
					} else {
						$("#context_menu [href=#kneel]").show();
						$("#context_menu [href=#stand]").hide();
					}
					if (card.faceDown) {
						$("#context_menu [href=#face-down]").hide();
						$("#context_menu [href=#face-up]").show();
					} else {
						$("#context_menu [href=#face-down]").show();
						$("#context_menu [href=#face-up]").hide();
					}
				}
			);
			//*/

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

		if (that.container.getType() == "play") {
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
