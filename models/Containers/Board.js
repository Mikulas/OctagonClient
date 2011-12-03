function Board() {
	var that = this;

	this.render = function(type) {
		that.element = new Container().render.call(this, type);

		return that.element;
	};
}

Board.prototype.constructor = Container;
