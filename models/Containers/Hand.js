function Hand() {
	var that = this;

	this.render = function(type, player_id) {
		var element = new Container().render.call(this, type, player_id);
		element.children().addClass("small");
		return element;
	}
}

Hand.prototype.constructor = Container;
