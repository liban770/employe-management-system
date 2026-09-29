<?php
namespace App\Core;

class Response
{
    private int $statusCode = 200;
    private array $headers = [];

    public function setStatusCode(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }

    public function header(string $key, string $value): self
    {
        $this->headers[$key] = $value;
        return $this;
    }

    public function redirect(string $url): void
    {
        header("Location: $url", true, 302);
        exit;
    }

    public function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    public function send(string $content): void
    {
        http_response_code($this->statusCode);
        foreach ($this->headers as $key => $val) {
            header("$key: $val");
        }
        echo $content;
    }
}
