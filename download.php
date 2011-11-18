<?php
$content = file_get_contents("cards");
foreach (explode("\n", $content) as $line) {
	if (!trim($line))
		continue;

	list($id, $name, $url) = explode("|", $line);
	var_dump($id, $name, $url);
	
	exec("curl -o './images/$id.jpg' 'http://www.cardgamedb.com/$url'");
}
