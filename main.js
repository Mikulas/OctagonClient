var socket = null;
var game = null;
var optimizations = {"~@0~": "a12af4e8-be4b-4cda-a6b6-534f97"};
var client_id = null;
var client_view = null;
var player_name = null;
var connected = false;

function send(content) {
	var tampered = content.substr(0, content.length - 1) + ",\"client_id\":\"" + client_id + "-" + client_view + "\",\"time\":" + new Date().getTime() + "}";
	socket.send(tampered);
}

function d() {
	console.log(game.players[0].containers.hand.cards);
	console.log(game.play.cards);
}

$(function() {
	if (window.FileReader && window.WebSocket) {
		// Great success! All the File APIs are supported.
	} else {
		alert("Please update your browser to the latest version. Otherwise Octagon might not work property. Only latest Google Chrome is supported for the time being.");
		showError("Chrome only now");
		return false;
	}

	if (!localStorage.hasOwnProperty("client_id")) {
		localStorage.client_id = new Date().getTime() + "-" + Math.floor((Math.random() * 10e6));
	}
	client_id = localStorage.client_id;

	if (!localStorage.hasOwnProperty("client_view")) {
		localStorage.client_view = 0;
	} else {
		localStorage.client_view++;
	}
	client_view = localStorage.client_view;

	if (!localStorage.hasOwnProperty("player_name")) {
		localStorage.player_name = "";
	}
	player_name = localStorage.player_name;

	if (!localStorage.hasOwnProperty("last_server")) {
		localStorage.last_server = "";
	}
	var last_server = localStorage.last_server;

	console.log("id view name = ", client_id, client_view, player_name);

	game = new Game; // defaults to empty if no broadcast is received upon connecting

	var host = "ws://thrones.eu:4723";
	//var host = "ws://192.168.100.77:4723";
	try {
		socket = new WebSocket(host);
		socket.onopen = function(msg) {
			console.info("connected to server");
			setInterval(function() {
				send("{\"method\": \"keep-alive\"}");
			}, 30 * 1000);
		};
		socket.onmessage = function(e) {
			var data = e.data;
			$.each(optimizations, function(i, v) {
				var regex = new RegExp(i, "g");
				data = data.replace(regex, v);
			});
			
			data = JSON.parse(data);
			if (data.client_id == client_id + "-" + client_view) {
				return false;
			}

			if (data.method == "connect_response") {
				console.info("connect response received:", data);
				if (data.response == "created" || data.response == "connected") {
					connected = true;
					showNotification("Connected");
					$("#connect").css({position: "relative"}).animate({
						opacity: 0,
						top: -1000
					}, 1500);
					$("#help").show().css({position: "relative", opacity: 0, top: 500}).animate({
						opacity: 1,
						top: -400
					}, 1500);
				} else {
					showNotification("Invalid password");
				}

			} else if (data.method == "announce_join") {
				// dump whole game for new client
				console.info("CLIENT JOINED (" + data.count + ")");
				showNotification("Player joined game");
				game.broadcast();

			} else if (data.method == "announce_leave") {
				console.info("CLIENT LEFT (" + data.count + ")");
				showNotification("Player left game");

			} else if (data.method == "broadcast") {
				console.info("broadcast received: ", data.game);
				game.updateFromBroadcast(data.game);

			} else if (data.method == "update_card") {
				console.info("card update received: ", data.card);
				var card = game.getCard(data.card.id);
				card.update(data.card);
				card.render();

			} else if (data.method == "update_counter") {
				console.info("card counter received: ", data);
				var player = game.players[data.player_id];
				player.updateCounter(data);
				player.render();
			}
		};

		socket.onclose = function(msg) {
			showError("Server closed");
			console.info("connection closed");
			$("#status").removeClass("connected");
			$("#status .text").text("not connected");
		};
		socket.onerror = function(error) {
			console.error(error);
		};

	} catch(ex) {
		console.error(ex);
	}

	function handleFileSelect(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		if (!connected) {
			showNotification("Not connected yet");
			return false;
		}

		var files = evt.target.files || evt.dataTransfer.files; // FileList object
		if (files.length > 1) {
			alert("Please pick only one deck.");
			return false;
		}
		var file = files[0];

		var reader = new FileReader();
		reader.onload = (function(theFile) {
			return function(res) {
				var content = atob(res.target.result.substr(12)); // remove header `data:base64,` and decode base64
				parseO8DXml(content);
			};
		})(file);
		reader.readAsDataURL(file);
	}

	function handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
	}

	function parseO8DXml(xmlString) {
		var player = game.addPlayer();
		player.client_id = client_id;
		player.containers.hand.client_id = client_id;
		player.name = player_name;
		$(xmlString).children().each(function(i, sec) {
			$(sec).children().each(function(i, ca) {
				for (var qty = 0; qty < $(ca).attr('qty'); ++qty) {
					var card = new Card();
					card.id = game.getUniqueId();
					card.card_id = $(ca).attr("id");
					if ($.inArray($(sec).attr("name"), ["House", "Agenda"]) != -1) {
						// put card directly to table
						player.containers.hand.add(card);
					} else if ($.inArray($(sec).attr("name"), ["Plots"]) != -1) {
						// put card to unrevealed plot container
						player.containers.plot.add(card);
					} else {
						// put card to deck
						player.containers.deck.add(card);
					}
				}
			});
		});
		$("#help").add("#connect").hide();
		game.render();
		game.broadcast();
	}

	/*
	$(".card").live("mouseenter", function(e) {
		console.log($(this).offset().left > $(window).width() / 2 ? "left" : "right");
		if ($(this).offset().left > $(window).width() / 2) {
			$("#magnifier").css({left: 5, right: "auto"});
		} else {
			$("#magnifier").css({left: "auto", right: 5});
		}

		if (!$(this).hasClass("face-down") && !$(this).hasClass("pile")) {
			$("#magnifier").attr("src", $(this).children("img").attr("src")).stop(false, true).fadeIn();
		}
	}).live("mouseleave", function(e) {
		if (!$(e.toElement).hasClass("raw-card")) {
			$("#magnifier").fadeOut();
		}
	});
	//*/

	function showNotification(content, persist) {
		var $node = $('<div/>').addClass("notification").html(content).hide();
		$("#notifications").append($node);
		$node.fadeIn();
		if (persist == undefined || !persist) {
			setInterval(function() {
				$node.fadeOut();
			}, 2000);
		}
		return $node;
	}

	function showError(content) {
		return showNotification(content, true).addClass('error');
	}

	$("#username").val(last_server);
	$("#username").val(player_name);

	$("#help").add("#log").hide();

	function connect() {
		player_name = localStorage.player_name = $("#username").val();
		localStorage.last_server = $("#server").val();
		send(JSON.stringify({"method": "connect",
			"instance": $("#server").val(),
			"password": $("#password").val()
		}));
		$("#status").addClass("connected");
		$("#status .text").text("connected » " + $("#server").val());
		$("#log").show();
		return false;
	}
	$("#connect-button").click(connect);
	$("#connect-form").submit(connect);
	$("#server").val(last_server);

	$(document)[0].addEventListener('dragover', handleDragOver, false);
	$(document)[0].addEventListener('drop', handleFileSelect, false);
	$("#file")[0].addEventListener('change', handleFileSelect, false);

	// key handlers
	$(document).keydown(function(e) {
		if (!connected) {
			return false;
		}
		//console.log(e.keyCode, e);

		if (e.keyCode == 68) { // d
			if (e.shiftKey) { // capital D
				game.getPlayer(client_id).draw(prompt("How many cards you want to draw?", 2));
			} else {
				game.getPlayer(client_id).draw();
			}
		}
		e.stopPropagation();
	});

	// popup log window
	$("#log img").click(function() {
		var win = window.open("log.html", "Octagon Log", "menubar=no,width=640,height=480,toolbar=no,directories=no,status=no,location=no");
		$(win).load(function() {
			game.logList = $($(win.document).find("ul"));
			game.renderLog();
		});
	});
});
