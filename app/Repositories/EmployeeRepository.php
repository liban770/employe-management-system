<?php
namespace App\Repositories;

use PDO;

class EmployeeRepository extends BaseRepository
{
    public function getPaginated(int $tenantId, int $limit = 20, int $offset = 0, ?string $search = null, ?int $deptId = null, ?string $status = null): array
    {
        $sql = "SELECT e.*, d.name AS department_name, p.title AS position_title,
                       CONCAT(m.first_name, ' ', m.last_name) AS manager_name
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN positions p ON e.position_id = p.id
                LEFT JOIN employees m ON e.manager_id = m.id
                WHERE e.organization_id = :tenant_id AND e.deleted_at IS NULL";

        $params = [':tenant_id' => $tenantId];

        if ($search) {
            $sql .= " AND (e.first_name LIKE :search OR e.last_name LIKE :search OR e.employee_code LIKE :search OR e.email LIKE :search)";
            $params[':search'] = "%{$search}%";
        }

        if ($deptId) {
            $sql .= " AND e.department_id = :dept_id";
            $params[':dept_id'] = $deptId;
        }

        if ($status) {
            $sql .= " AND e.status = :status";
            $params[':status'] = $status;
        }

        $sql .= " ORDER BY e.id DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function findById(int $tenantId, int $id): ?array
    {
        $sql = "SELECT e.*, d.name AS department_name, p.title AS position_title,
                       CONCAT(m.first_name, ' ', m.last_name) AS manager_name
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN positions p ON e.position_id = p.id
                LEFT JOIN employees m ON e.manager_id = m.id
                WHERE e.organization_id = :tenant_id AND e.id = :id AND e.deleted_at IS NULL";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':tenant_id' => $tenantId, ':id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(int $tenantId, array $data): int
    {
        $sql = "INSERT INTO employees (
                    organization_id, user_id, department_id, position_id, manager_id,
                    employee_code, first_name, last_name, email, phone, gender,
                    date_of_birth, joining_date, employment_type, status, address,
                    emergency_contact_name, emergency_contact_phone, emergency_contact_relation, avatar
                ) VALUES (
                    :organization_id, :user_id, :department_id, :position_id, :manager_id,
                    :employee_code, :first_name, :last_name, :email, :phone, :gender,
                    :date_of_birth, :joining_date, :employment_type, :status, :address,
                    :emergency_contact_name, :emergency_contact_phone, :emergency_contact_relation, :avatar
                )";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':organization_id' => $tenantId,
            ':user_id' => $data['user_id'] ?? null,
            ':department_id' => $data['department_id'],
            ':position_id' => $data['position_id'],
            ':manager_id' => $data['manager_id'] ?? null,
            ':employee_code' => $data['employee_code'],
            ':first_name' => $data['first_name'],
            ':last_name' => $data['last_name'],
            ':email' => $data['email'],
            ':phone' => $data['phone'] ?? null,
            ':gender' => $data['gender'],
            ':date_of_birth' => $data['date_of_birth'] ?? null,
            ':joining_date' => $data['joining_date'],
            ':employment_type' => $data['employment_type'] ?? 'full_time',
            ':status' => $data['status'] ?? 'active',
            ':address' => $data['address'] ?? null,
            ':emergency_contact_name' => $data['emergency_contact_name'] ?? null,
            ':emergency_contact_phone' => $data['emergency_contact_phone'] ?? null,
            ':emergency_contact_relation' => $data['emergency_contact_relation'] ?? null,
            ':avatar' => $data['avatar'] ?? null,
        ]);

        return (int)$this->db->lastInsertId();
    }

    public function update(int $tenantId, int $id, array $data): bool
    {
        $fields = [];
        $params = [':tenant_id' => $tenantId, ':id' => $id];

        foreach ($data as $col => $val) {
            $fields[] = "{$col} = :{$col}";
            $params[":{$col}"] = $val;
        }

        $sql = "UPDATE employees SET " . implode(', ', $fields) . " WHERE organization_id = :tenant_id AND id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function softDelete(int $tenantId, int $id): bool
    {
        $sql = "UPDATE employees SET deleted_at = NOW(), status = 'terminated' WHERE organization_id = :tenant_id AND id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':tenant_id' => $tenantId, ':id' => $id]);
    }
}
