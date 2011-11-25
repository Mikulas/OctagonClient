function Hand() {
	var that = this;

	this.render = function() {
		var element = new Container().render.call(this);
		element.children().addClass("small");
		$("#hand").append(element);
	}
}

Hand.prototype.constructor = Container;
