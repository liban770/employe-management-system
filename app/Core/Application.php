<?php
namespace App\Core;

class Application
{
    private Router $router;
    private Request $request;
    private Response $response;

    public function __construct()
    {
        Session::start();
        $this->request = new Request();
        $this->response = new Response();
        $this->router = new Router();
    }

    public function router(): Router
    {
        return $this->router;
    }

    public function run(): void
    {
        try {
            $output = $this->router->dispatch($this->request);
            if (is_string($output)) {
                $this->response->send($output);
            }
        } catch (\Throwable $e) {
            error_log("Critical Application Exception: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            
            http_response_code(500);
            $appConfig = require __DIR__ . '/../../config/app.php';
            if ($appConfig['debug']) {
                echo "<h1>Internal Server Error (Debug Mode)</h1>";
                echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
                echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
            } else {
                echo View::render('errors/500', ['title' => 'Server Error'], '');
            }
        }
    }
}
