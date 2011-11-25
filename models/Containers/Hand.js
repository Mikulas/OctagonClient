function Hand() {
	var that = this;
}

// Set prototype to a new instance of Container
Hand.prototype = new Container();
// Make sure to list Container as the actual constructor
Hand.prototype.constructor = Container;
