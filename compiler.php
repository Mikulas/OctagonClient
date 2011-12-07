<?php

$files = array(
	"modernizr.custom.36126.js",
	"jquery.1.7.1.min.js",
	"jquery-ui.1.8.16.min.js",
	"json2.js",
	"context_menu.js",

	"Card.js",
	"Game.js",
	"Player.js",
	"Board.js",
	"Container.js",
	"Hand.js",
	"Pile.js",

	"main.js",
);

$file = fopen("compiled.js", "w");
foreach ($files as $filename) {
	foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(".")) as $path => $info) {
		if ($info->getFilename() == $filename) {
			fwrite($file, "\n" . file_get_contents($path));
		}
	}
}

fclose($file);
