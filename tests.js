'use strict';

var failed = false;
function expect(message, passed) {
	if (!passed) {
		console.error("FAIL: " + message);
		failed++;
	}
}

function expectException(message, callback) {
	var thrown = false;
	try {
		callback();
	} catch (error) {
		thrown = true;
	}

	if (!thrown) {
		console.error("FAIL: " + message);
	}
}

function _reset() {
	Card.uniqueId = 0;
	Player.uniqueId = 0;
	Container.uniqueId = 0;
}

// - - - - - - - TESTS - - - - - - - - - - - - 
$(function() {

// Model id uniqueness
(function() {
	var p = new Player();
	_reset();
	var a = new Card();
	var b = new Card();
	var k = new Container(ContainerRenderer, p);
	expect("id uniqueness", a.id === 1 && b.id === 2 && k.id === 1);
})();

// Container setup
(function() {
	var k = new Container(ContainerRenderer, new Player());
	var l = new Container(ContainerRenderer, new Player());

	var c = new Card();
	k.add(c);
	expect("Container.add()", Object.keys(k.cards).length == 1 && Object.keys(l.cards).length == 0);
	c.moveTo(l);
	expect("Card.move()", Object.keys(k.cards).length == 0 && Object.keys(l.cards).length == 1);
})();

// Container construction, checking order
(function() {
	var k = new Container(ContainerRenderer, new Player());
	var c = new Card();
	k.add(c);
	expect("StackedContainer.add()", Object.keys(k.cards).length == 1 && k.order.length == 1);
})();

// Card visibility
(function() {
	var p = new Player();
	p.id = 1;
	var q = new Player();
	q.id = 2;
	var c = new Card();
	expect("Card.showTo()", c.visibleTo.length == 0);
	c.showTo(p);
	c.showTo(q);
	expect("Card.showTo()", c.visibleTo.length == 2);
	expectException("Card.showTo()", function() {
		c.showTo(p);
	});
	expect("Card.showTo()", c.visibleTo.length == 2);
})();

// Normal setup
(function() {
	_reset();
	var p = new Player();
	p.containers.play.add(new Card());
	p.containers.play.add(new Card());
	p.containers.play.add(new Card());
	p.containers.hand.add(new Card());
	p.containers.hand.add(new Card());
	for (var i = 0; i < 5; ++i)
		p.containers.deck.add(new Card());

	var g = new Game(new Connection());
	g.add(p);
	
	g.renderer.createNode();
	g.renderer.render();
})();

// - - - - - - - WRAP UP - - - - - - - - - - - - 

if (!failed) {
	console.info("✔ All tests passed");
} else {
	console.error("Failed " + failed + " tests.");
}

}); // end onload
