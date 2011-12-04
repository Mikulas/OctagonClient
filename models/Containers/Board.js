function Board() {
	var that = this;

	this.render = function() {
		that.element = new Container("play").render.call(this);
		return that.element;
	};
}

Board.prototype.constructor = Container;
