var socket = null;
var game = null;
var optimizations = {"~@0~": "a12af4e8-be4b-4cda-a6b6-534f97"};
var client_id = null;
var client_view = null;
var this_player = null;

function send(content) {
	var tampered = content.substr(0, content.length - 1) + ",\"client_id\":\"" + client_id + "-" + client_view + "\",\"time\":" + new Date().getTime() + "}";
	socket.send(tampered);
}

$(function() {
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
	console.log("This clients id = ", client_id + "-" + client_view);

	// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		// Great success! All the File APIs are supported.
	} else {
		alert('The File APIs are not fully supported. Please update your browser to the latest version.');
	}

	game = new Game; // defaults to empty if no broadcast is received upon connecting

	var host = "ws://192.168.100.77:4723";
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

			if (data.method == "announce_join") {
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
			showError("Server not available");
			console.info("connection closed");
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

		var files = evt.dataTransfer.files; // FileList object.
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
		this_player = player;
		$(xmlString).children().each(function(i, sec) {
			$(sec).children().each(function(i, ca) {
				for (var qty = 0; qty < $(ca).attr('qty'); ++qty) {
					var card = new Card();
					card.id = game.getUniqueId();
					card.card_id = $(ca).attr("id");
					if ($.inArray($(sec).attr("name"), ["House", "Agenda"]) != -1) {
						// put card directly to table
						player.containers.play.add(card);
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

		player.containers.deck.shuffle();
		player.draw(7);
		game.render();
		game.broadcast();
	}

	$(".card").live("mouseenter", function(e) {
		if (!$(this).hasClass("face-down")) {
			$("#magnifier").attr("src", $(this).children("img").attr("src")).fadeIn();
		}
	}).live("mouseleave", function(e) {
		if (!$(e.toElement).hasClass("raw-card")) {
			$("#magnifier").fadeOut();
		}
	});

	/*$("#hand").sortable({
		placeholder: "card small placeholder",
		axis: "x",
		forceHelperSize: true,
		forcePlaceholderSize: true,
		items: "img",
		tolerance: "pointer"
	});*/

	// temporary
	$("#draw-card").click(function() {
		this_player.draw();
		this_player.render();
	});

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

	$("#drop_zone")[0].addEventListener('dragover', handleDragOver, false);
	$("#drop_zone")[0].addEventListener('drop', handleFileSelect, false);
});
