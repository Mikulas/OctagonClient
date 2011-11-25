function Board() {
	var that = this;
}

// Set prototype to a new instance of Container
Board.prototype = new Container();
// Make sure to list Container as the actual constructor
Board.prototype.constructor = Container;
