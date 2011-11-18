<?php

class WebSocketPresenter extends BasePresenter
{

	public function actionDefault()
	{
		set_time_limit(0); // do not close socket due to time constraints
		$server = NULL;
		$port = 40700;
		$server = new WebSocketServer("31.31.72.76", $port, callback($this, 'processInput'));
		/*
		do {
			try {
				$server = new WebSocketServer("127.0.0.1", $port, callback($this, 'processInput'));
				break;
			} catch (\Nette\InvalidStateException $e) {
				$port++;
				// port not available
			}
		} while (TRUE);
		//*/
		$server->run();
		$this->terminate();
	}



	public function processInput(WebSocketUser $user, $message, WebSocketServer $server)
	{
		foreach ($server->getUsers() as $user) {
			$server->send($user->socket, json_encode("received: `$message`"));
		}
	}
}
