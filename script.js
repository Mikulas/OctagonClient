function Game() {
	this.container = undefined;
	this.players = [];
	
	var that = this;
	
	this._init = function() {
		that.container = $("<div/>").attr("id", "board");
	};
	
	this.addPlayer = function() {
		var p = Player();
		that.players.push(p);
		return p;
	};
	
	this._init();
}

function Player() {
	this.name = undefined;
	this.counters = [];
	this.piles = [];
}

function Pile() {
	this.cards = [];
}

function Card() {
	this.container = undefined;
	this.meta = {name: undefined, cost: undefined, strength: undefined, text: undefined};
	this.image = undefined;
	
	var that = this;
	
	this._init = function() {
		that.container = $("<div/>").addClass("card");
		that.container.click(function(e) {
			that.onClick(e);
		});
	};

	this.focus = function() {
		$(".focus").removeClass("focus");
		that.container.addClass("focus");
	};
	
	this.isStanding = function() {
		return that.container.hasClass("standing");
	};
	
	this.isKneeling = function() {
		return that.container.hasClass("kneeling");
	};
	
	this.stand = function() {
		if (that.isStanding)
			return false;
		that.container.removeClass("kneeling").addClass("standing");
	};
	
	this.kneel = function() {
		if (that.isKneeling)
			return false;
		that.container.removeClass("standing").addClass("kneeling");
	};
	
	this.toggleKneeling = function() {
		if (that.isKneeling) {
			that.stand();
		} else {
			that.kenel();
		}
	};
	
	this.onClick = function(e) {
		this.focus();
	};
	
	this._init();
}

$(function() {
	// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		// Great success! All the File APIs are supported.
	} else {
		alert('The File APIs are not fully supported in this browser.');
	}

	var host = "ws://192.168.100.77:4723";
	var socket = null;
	try {
		console.info("socket connecting...");
		socket = new WebSocket(host);
		socket.onopen = function(msg) {
			console.info("socket opened");
		};
		socket.onmessage = function(e) {
			var data = JSON.parse(e.data);
			console.info(data);
			$('#output').val($('#output').val() + "\n" + e.data);
			$('.card').animate({
				left: data.left,
				top: data.top
			}, 600);
		};
		socket.onclose = function(msg) {
			console.info("socket closed");
		};
		socket.onerror = function(error) {
			console.error(error);
		};

	} catch(ex) {
		console.error(ex);
	}

	var game = new Game;
	var player = game.addPlayer();
	var pile = new Pile;
	var card = new Card;
	/*
	$("#run").click(function() {
		$("#c").toggleClass("kneeling").toggleClass("standing");
	});
	*/

	$('.card').draggable({
		stop: function(event, ui) {
			console.log(event, ui);
			socket.send(JSON.stringify(ui.position));
		}
	});
});
