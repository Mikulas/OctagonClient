function Pile() {
	var that = this;

	this.shuffle = function() {
		var tmp, current, top = that.cards.length;
		while (--top >= 0) {
			current = Math.floor(Math.random() * (top + 1));
			tmp = that.cards[current];
			that.cards[current] = that.cards[top];
			that.cards[top] = tmp;
		}
		console.log("pile shuffled");
	};
}

// Set  prototype to a new instance of Container
Pile.prototype = new Container();
// Make sure to list Container as the actual constructor
Pile.prototype.constructor = Container;
