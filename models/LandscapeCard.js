function LandscapeCard() {
	var that = this;
	
	this.stand = function() {
		return false;
	};

	this.kneel = function() {
		return false;
	};

	this.toggleKneeling = function() {
		return false;
	};

	this.render = function(type) {
		if (that.element == null) {
			that.element = $("<div/>").addClass("card landscape");
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

		if (that.container.type == "play") {
			if (that.faceDown && !that.element.hasClass("face-down")) {
				that.turnFaceDown();
			} else if (!that.faceDown && that.element.hasClass("face-down")) {
				that.turnFaceUp();
			}

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

	this.showContextMenu = function(e) {
		$("#context_menu a").hide();
		$("#context_menu [data-group=card] a").show();

		$("#context_menu [href=#kneel]").add("#context_menu [href=#stand]").hide();

		if (that.faceDown) {
			$("#context_menu [href=#face-down]").hide();
		} else {
			$("#context_menu [href=#face-up]").hide();
		}
	};
}

LandscapeCard.prototype.constructor = Card;
