function Board() {
	var that = this;

	this.render = function() {
		console.log("render play");
		that.element = new Container("play").render.call(this);
		return that.element;
	};
}

Board.prototype.constructor = Container;
