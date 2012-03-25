<?php

$index = 0;
foreach (scandir(__DIR__) as $file) {
	if (strrpos($file, ".o8s") !== FALSE) {
		exec("unzip " . escapeshellarg($file) . " -d extract/" . $index++);
	}
}


$p = __DIR__ . "/extract";
foreach (scandir($p) as $arch) {
	if (!is_numeric($arch))
		continue;

	$res = file_get_contents("$p/$arch/_rels/Vulca.xml.rels");
	$matches = array();
	preg_match_all('~<Relationship Target="/cards/(?P<file>\d+\.jpg)" Id="(?P<id>[^"]+)" Type="http://schemas.octgn.org/picture" />~', $res, $matches);
	
	foreach ($matches["file"] as $i => $file) {
		exec("mv " . escapeshellarg("$p/$arch/cards/$file") . " " . escapeshellarg(__DIR__ . "/cards/" . $matches["id"][$i] . ".jpg"));
	}
}
