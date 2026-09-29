<?php
namespace App\Repositories;

use App\Core\Database;
use PDO;

abstract class BaseRepository
{
    protected PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Helper to guarantee tenant scope in all queries
     */
    protected function scopeTenant(string $sql, string $alias = ''): string
    {
        $prefix = $alias ? "{$alias}." : "";
        if (stripos($sql, 'WHERE') !== false) {
            return preg_replace('/WHERE/i', "WHERE {$prefix}organization_id = :tenant_id AND ", $sql, 1);
        }
        return "{$sql} WHERE {$prefix}organization_id = :tenant_id";
    }
}
