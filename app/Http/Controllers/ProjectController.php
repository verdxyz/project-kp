<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    private const STAGES = ['F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'Loss', 'Cancel'];
    private const CATEGORIES = ['On Channel', 'GTMA', 'NGTMA'];
    private const METHODS = ['E-Katalog', 'Pengadaan Langsung', 'Penunjukan Langsung', 'Tender Cepat', 'Tender'];
    private const STATUSES = ['Active', 'At Risk', 'Completed', 'Lost', 'Cancelled'];

    private function projectsQuery()
    {
        $driver = DB::connection()->getDriverName();
        $numericType = match ($driver) {
            'pgsql' => 'DOUBLE PRECISION',
            'mysql' => 'DOUBLE',
            default => 'REAL',
        };

        return DB::table('projects as p')
            ->join('government_agencies as a', 'a.id', '=', 'p.agency_id')
            ->select([
                'p.id', 'p.id_lop as idLOP', 'p.project_name as projectName',
                'a.name as agency', 'a.agency_type as agencyType', 'a.region',
                DB::raw("CAST(p.budget AS {$numericType}) AS budget"),
                'p.procurement_method as procurementMethod',
                DB::raw("CAST(p.service_price AS {$numericType}) AS servicePrice"),
                'p.pemda_name as pemdaName', 'p.stage', 'p.progress',
                'p.start_date as startDate', 'p.end_date as endDate', 'p.pic', 'p.category',
                'p.service_type as serviceType',
                DB::raw("CAST(COALESCE((SELECT SUM(sp.capacity_mbps) FROM project_service_points sp WHERE sp.id_lop = p.id_lop), p.total_capacity_mbps) AS {$numericType}) AS \"totalCapacityMbps\""),
                'p.sid', 'p.status', 'p.notes', 'p.subsidiary_name as subsidiaryName',
                'p.customer_name as customerName', 'p.dinas_name as dinasName',
                DB::raw('(SELECT COUNT(*) FROM project_service_points sp WHERE sp.id_lop = p.id_lop) AS "servicePointCount"'),
                DB::raw("CAST(COALESCE((SELECT SUM(sp.service_price) FROM project_service_points sp WHERE sp.id_lop = p.id_lop), 0) AS {$numericType}) AS \"servicePointTotalPrice\""),
                'p.created_at as createdAt', 'p.updated_at as updatedAt',
            ]);
    }

    public function index(): JsonResponse
    {
        return response()->json(['projects' => $this->projectsQuery()->orderByDesc('p.updated_at')->get()]);
    }

    public function show(string $idLOP): JsonResponse
    {
        $project = $this->projectsQuery()->where('p.id_lop', $idLOP)->first();
        if (!$project) return response()->json(['message' => 'Proyek tidak ditemukan.'], 404);

        return response()->json(['project' => $project]);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->save($request, null);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return $this->save($request, $id);
    }

    private function save(Request $request, ?string $id): JsonResponse
    {
        $body = $request->all();
        $errors = [];
        $requiredText = [
            'idLOP' => 'ID LOP wajib diisi.',
            'projectName' => 'Nama proyek wajib diisi.',
            'agency' => 'Instansi wajib dipilih.',
            'pemdaName' => 'Nama Pemda wajib diisi.',
            'serviceType' => 'Jenis layanan wajib diisi.',
        ];
        foreach ($requiredText as $field => $message) {
            if (!is_string($body[$field] ?? null) || trim($body[$field]) === '') $errors[] = $message;
        }
        if (!is_numeric($body['budget'] ?? null) || (float) $body['budget'] < 0) $errors[] = 'Anggaran tidak boleh negatif.';
        if (!is_numeric($body['servicePrice'] ?? null) || (float) $body['servicePrice'] < 0) $errors[] = 'Harga layanan tidak boleh negatif.';
        if (!in_array($body['stage'] ?? null, self::STAGES, true)) $errors[] = 'Tahap proyek tidak valid.';
        if (!in_array($body['category'] ?? null, self::CATEGORIES, true)) $errors[] = 'Kategori kontrak tidak valid.';
        if (!in_array($body['procurementMethod'] ?? null, self::METHODS, true)) $errors[] = 'Metode pengadaan tidak valid.';
        if (isset($body['totalCapacityMbps']) && $body['totalCapacityMbps'] !== '' &&
            (!is_numeric($body['totalCapacityMbps']) || (float) $body['totalCapacityMbps'] < 0)) {
            $errors[] = 'Kapasitas layanan harus berupa angka nol atau lebih.';
        }
        if (isset($body['sid']) && $body['sid'] !== null && !is_string($body['sid'])) $errors[] = 'SID harus berupa teks.';
        if (($body['category'] ?? null) === 'NGTMA' && (!is_string($body['subsidiaryName'] ?? null) || trim($body['subsidiaryName']) === '')) {
            $errors[] = 'Nama Anak Perusahaan wajib diisi untuk kategori NGTMA.';
        }
        if (isset($body['status']) && !in_array($body['status'], self::STATUSES, true)) $errors[] = 'Status proyek tidak valid.';
        foreach (['startDate', 'endDate'] as $field) {
            if (!empty($body[$field]) && !strtotime((string) $body[$field])) $errors[] = 'Tanggal proyek tidak valid.';
        }
        if (!empty($body['startDate']) && !empty($body['endDate']) && strtotime($body['endDate']) < strtotime($body['startDate'])) {
            $errors[] = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
        }
        if ($errors) return response()->json(['message' => implode(' ', array_unique($errors))], 400);

        $agency = DB::table('government_agencies')->where('name', trim($body['agency']))->first();
        if (!$agency) return response()->json(['message' => 'Instansi tidak termasuk daftar master 13 pelanggan.'], 400);

        $progressByStage = ['F0' => 0, 'F1' => 20, 'F2' => 40, 'F3' => 60, 'F4' => 80, 'F5' => 100, 'Loss' => 0, 'Cancel' => 0];
        $progress = is_numeric($body['progress'] ?? null) ? (int) $body['progress'] : $progressByStage[$body['stage']];
        $status = match ($body['stage']) {
            'F5' => 'Completed', 'Loss' => 'Lost', 'Cancel' => 'Cancelled',
            default => $body['status'] ?? 'Active',
        };
        $values = [
            'id_lop' => trim($body['idLOP']),
            'project_name' => trim($body['projectName']),
            'agency_id' => $agency->id,
            'budget' => (float) $body['budget'],
            'procurement_method' => $body['procurementMethod'],
            'stage' => $body['stage'],
            'progress' => max(0, min(100, $progress)),
            'start_date' => !empty($body['startDate']) ? $body['startDate'] : null,
            'end_date' => !empty($body['endDate']) ? $body['endDate'] : null,
            'pic' => trim((string) ($body['pic'] ?? '')),
            'category' => $body['category'],
            'service_type' => trim($body['serviceType']),
            'total_capacity_mbps' => ($body['totalCapacityMbps'] ?? '') === '' ? null : ($body['totalCapacityMbps'] ?? null),
            'sid' => is_string($body['sid'] ?? null) && trim($body['sid']) !== '' ? trim($body['sid']) : null,
            'status' => $status,
            'notes' => is_string($body['notes'] ?? null) ? $body['notes'] : '',
            'subsidiary_name' => is_string($body['subsidiaryName'] ?? null) && trim($body['subsidiaryName']) !== '' ? trim($body['subsidiaryName']) : null,
            'customer_name' => is_string($body['customerName'] ?? null) && trim($body['customerName']) !== '' ? trim($body['customerName']) : null,
            'dinas_name' => is_string($body['dinasName'] ?? null) && trim($body['dinasName']) !== '' ? trim($body['dinasName']) : null,
            'pemda_name' => trim($body['pemdaName']),
            'service_price' => (float) $body['servicePrice'],
            'updated_at' => now(),
        ];

        try {
            DB::transaction(function () use ($id, $values, $body): void {
                $projectId = $id ?? (string) Str::uuid();
                if ($id && DB::table('projects')->where('id', $id)->exists()) {
                    DB::table('projects')->where('id', $id)->update($values);
                } else {
                    DB::table('projects')->insert(['id' => $projectId, 'created_at' => now(), ...$values]);
                }

                if (!empty($values['sid'])) {
                    $hasPoints = DB::table('project_service_points')->where('id_lop', $values['id_lop'])->exists();
                    if (!$hasPoints) {
                        DB::table('project_service_points')->insert([
                            'id' => (string) Str::uuid(),
                            'id_lop' => $values['id_lop'],
                            'sid' => $values['sid'],
                            'product_type' => $this->normalizeProductType($values['service_type']),
                            'capacity_mbps' => $values['total_capacity_mbps'] ?? 0,
                            'service_group' => 'Non-POTS',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            });
        } catch (QueryException $exception) {
            if (in_array((string) $exception->getCode(), ['23000', '23505'], true)) {
                return response()->json(['message' => 'ID LOP sudah digunakan oleh proyek lain.'], 409);
            }
            throw $exception;
        }

        $project = $this->projectsQuery()->where('p.id_lop', $values['id_lop'])->first();
        return response()->json(['project' => $project], $id ? 200 : 201);
    }

    private function normalizeProductType(string $serviceType): string
    {
        $normalized = strtolower($serviceType);
        foreach (['hsi' => 'HSI', 'wms' => 'WMS', 'wifi' => 'WMS', 'astinet' => 'Astinet', 'ip transit' => 'IP Transit', 'vpn' => 'VPN'] as $match => $type) {
            if (str_contains($normalized, $match)) return $type;
        }

        return trim($serviceType);
    }

    public function destroy(string $idLOP): JsonResponse
    {
        $storagePaths = [];
        $deleted = DB::transaction(function () use ($idLOP, &$storagePaths): bool {
            $storagePaths = DB::table('project_documents')->where('id_lop', $idLOP)->pluck('storage_path')->all();
            return DB::table('projects')->where('id_lop', $idLOP)->delete() > 0;
        });
        if (!$deleted) return response()->json(['message' => 'Proyek tidak ditemukan.'], 404);

        foreach ($storagePaths as $storagePath) {
            try {
                Storage::disk('r2')->delete($storagePath);
            } catch (\Throwable $error) {
                Log::warning('Failed to remove project document from R2.', ['path' => $storagePath, 'error' => $error->getMessage()]);
            }
        }

        return response()->json(null, 204);
    }
}
