<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Reader\Csv;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ProjectServicePointController extends Controller
{
    private function rows(string $idLOP): array
    {
        return DB::table('project_service_points')
            ->where('id_lop', $idLOP)
            ->orderByDesc('updated_at')->orderByDesc('created_at')->orderByDesc('id')
            ->get([
                'id', 'id_lop as idLOP', 'sid', 'product_type as productType',
                'capacity_mbps as capacityMbps', 'service_group as serviceGroup', 'order_no as orderNo',
                'quote', 'location', 'active_date as activeDate', 'bandwidth', 'service_price as servicePrice',
                'created_at as createdAt', 'updated_at as updatedAt',
            ])
            ->map(function ($row): array {
                $row = (array) $row;
                $row['capacityMbps'] = (float) ($row['capacityMbps'] ?? 0);
                $row['servicePrice'] = $row['servicePrice'] === null ? null : (float) $row['servicePrice'];
                return $row;
            })->all();
    }

    public function index(string $idLOP): JsonResponse
    {
        return response()->json(['servicePoints' => $this->rows($idLOP)]);
    }

    public function update(Request $request, string $idLOP): JsonResponse
    {
        $servicePoints = $request->input('servicePoints', []);
        $ngtmaInfo = $request->input('ngtmaInfo');
        if (!is_array($servicePoints)) return response()->json(['message' => 'Data titik layanan tidak valid.'], 400);

        try {
            DB::transaction(function () use ($idLOP, $servicePoints, $ngtmaInfo): void {
                $project = DB::table('projects')->where('id_lop', $idLOP)->lockForUpdate()->first();
                if (!$project) abort(response()->json(['message' => 'Proyek tidak ditemukan.'], 404));

                if (is_array($ngtmaInfo)) {
                    DB::table('projects')->where('id_lop', $idLOP)->update([
                        'customer_name' => $ngtmaInfo['customerName'] ?? $project->customer_name,
                        'dinas_name' => $ngtmaInfo['dinasName'] ?? $project->dinas_name,
                        'subsidiary_name' => $ngtmaInfo['subsidiaryName'] ?? $project->subsidiary_name,
                        'updated_at' => now(),
                    ]);
                }

                DB::table('project_service_points')->where('id_lop', $idLOP)->delete();
                foreach ($servicePoints as $point) {
                    if (!is_array($point)) continue;
                    $isPots = strtoupper((string) ($point['serviceGroup'] ?? '')) === 'POTS';
                    $sid = trim((string) ($point['sid'] ?? ''));
                    $orderNo = trim((string) ($point['orderNo'] ?? ''));
                    if ($sid === '' && $orderNo === '' && empty($point['location']) && empty($point['productType'])) continue;
                    if ($sid === '') abort(response()->json(['message' => 'SID wajib diisi untuk setiap titik layanan.'], 400));

                    $productType = $isPots
                        ? 'HSI'
                        : (!empty($point['productType']) ? $this->normalizeProduct((string) $point['productType']) : 'Non-POTS');
                    $capacity = $isPots ? 0 : ($this->parseCapacity($point['capacityMbps'] ?? $point['bandwidth'] ?? 0) ?? 0);
                    $servicePrice = $this->parsePrice($point['servicePrice'] ?? null);
                    if ($servicePrice === null) {
                        abort(response()->json(['message' => 'Harga layanan wajib diisi dan harus lebih dari nol untuk setiap SID.'], 400));
                    }

                    DB::table('project_service_points')->insert([
                        'id' => (string) Str::uuid(),
                        'id_lop' => $idLOP,
                        'sid' => $sid,
                        'product_type' => $productType,
                        'capacity_mbps' => $capacity,
                        'service_group' => $isPots ? 'POTS' : 'Non-POTS',
                        'order_no' => $orderNo !== '' ? $orderNo : null,
                        'quote' => !empty($point['quote']) ? trim((string) $point['quote']) : null,
                        'location' => !empty($point['location']) ? trim((string) $point['location']) : null,
                        'active_date' => !empty($point['activeDate']) ? $point['activeDate'] : null,
                        'bandwidth' => !empty($point['bandwidth']) ? trim((string) $point['bandwidth']) : ($capacity ? $capacity.' Mbps' : null),
                        'service_price' => $servicePrice,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpResponseException $exception) {
            return $exception->getResponse();
        } catch (QueryException $exception) {
            if (in_array((string) $exception->getCode(), ['23000', '23505'], true)) {
                return response()->json(['message' => 'SID duplikat tidak dapat disimpan.'], 409);
            }
            throw $exception;
        }

        return response()->json([
            'message' => 'Data titik layanan berhasil diperbarui.',
            'servicePoints' => $this->rows($idLOP),
        ]);
    }

    public function import(Request $request, string $idLOP): JsonResponse
    {
        $file = $request->file('file');
        if (!$file) return response()->json(['message' => 'Pilih file Excel yang berisi daftar SID.'], 400);
        $uploadError = $file->getError();
        if ($uploadError !== UPLOAD_ERR_OK) {
            Log::warning('Service-point import upload failed.', [
                'idLOP' => $idLOP,
                'uploadError' => $uploadError,
            ]);

            $message = match ($uploadError) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Ukuran file melebihi batas upload PHP. Pastikan upload_max_filesize dan post_max_size mencukupi.',
                UPLOAD_ERR_PARTIAL => 'File hanya terunggah sebagian. Coba unggah kembali.',
                UPLOAD_ERR_NO_FILE => 'Pilih file Excel yang berisi daftar SID.',
                UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE => 'Server gagal menyimpan file sementara. Periksa upload_tmp_dir dan izin tulis PHP.',
                UPLOAD_ERR_EXTENSION => 'Upload file dihentikan oleh konfigurasi ekstensi PHP.',
                default => 'Server gagal menerima file. Coba unggah kembali.',
            };
            $status = in_array($uploadError, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 413 : 400;

            return response()->json(['message' => $message], $status);
        }
        if (!$file->isValid()) {
            Log::warning('Service-point import has no valid temporary upload file.', [
                'idLOP' => $idLOP,
                'uploadError' => $uploadError,
            ]);

            return response()->json(['message' => 'Server tidak dapat menyiapkan file sementara. Muat ulang halaman lalu coba kembali.'], 500);
        }
        if ($file->getSize() > 10 * 1024 * 1024) return response()->json(['message' => 'Ukuran file maksimal 10 MB.'], 413);
        if (!in_array(strtolower($file->getClientOriginalExtension()), ['xls', 'xlsx', 'csv'], true)) {
            return response()->json(['message' => 'Format file tidak didukung. Gunakan file XLS, XLSX, atau CSV.'], 400);
        }
        if (strtolower($file->getClientOriginalExtension()) === 'xlsx' && !class_exists(\ZipArchive::class)) {
            return response()->json(['message' => 'Ekstensi ZIP PHP belum aktif. Aktifkan php_zip.dll dan restart server untuk membaca file XLSX.'], 500);
        }

        $project = DB::table('projects')->where('id_lop', $idLOP)->first();
        if (!$project) return response()->json(['message' => 'Proyek tidak ditemukan.'], 404);
        $requestedGroup = trim((string) $request->input('serviceGroup', ''));
        if ($requestedGroup !== '' && !in_array($requestedGroup, ['POTS', 'Non-POTS'], true)) {
            return response()->json(['message' => 'Jenis file harus POTS atau Non-POTS.'], 400);
        }

        try {
            $path = $file->getRealPath();
            if (!is_string($path) || $path === '' || !is_file($path) || !is_readable($path)) {
                Log::warning('Service-point import temporary file is not readable.', [
                    'idLOP' => $idLOP,
                    'uploadError' => $uploadError,
                ]);

                return response()->json(['message' => 'Server tidak dapat membaca file sementara. Muat ulang halaman lalu coba kembali.'], 500);
            }
            $reader = IOFactory::createReaderForFile($path);
            if ($reader instanceof Csv) {
                $reader->setDelimiter($this->detectCsvDelimiter($path));
            }
            $workbook = $reader->load($path);
            $sheet = null;
            if ($requestedGroup !== '') {
                foreach ($workbook->getWorksheetIterator() as $candidate) {
                    if ($this->normalizeHeader($candidate->getTitle()) === $this->normalizeHeader($requestedGroup)) {
                        $sheet = $candidate;
                        break;
                    }
                }
            }
            $sheet ??= $workbook->getSheet(0);
            if (!$sheet) return response()->json(['message' => 'Workbook tidak memiliki sheet.'], 400);
            $sheetTitle = $sheet->getTitle();
            $rows = $sheet->toArray('', true, false, true);
        } catch (\Throwable $exception) {
            Log::warning('Service-point import could not read the uploaded file.', [
                'idLOP' => $idLOP,
                'exception' => $exception->getMessage(),
            ]);
            return response()->json(['message' => 'File Excel tidak dapat dibaca.'], 400);
        }

        if (count($rows) < 2) return response()->json(['message' => 'Sheet Excel tidak berisi data.'], 400);

        $sidAliases = ['sid', 'serviceid', 'nomorsid', 'nomorserviceid'];
        $headerAliases = array_merge(
            $sidAliases,
            ['product', 'produk', 'service', 'layanan', 'producttype', 'tipeproduk', 'tipelayanan', 'namalayanan', 'jenislayanan', 'jenispelayanan',
                'capacitymbps', 'totalcapacitymbps', 'kapasitasmbps', 'kapasitas', 'bandwidth', 'bandwith', 'bandwid',
                'noorder', 'nomororder', 'orderno', 'order', 'quote', 'noquote', 'nomorquote',
                'lokasi', 'location', 'alamat', 'tanggalaktif', 'tglaktif', 'activedate', 'startdate',
                'hargalayanan', 'price', 'amount', 'nilaikontrak',
                'servicegroup', 'servicetype', 'group', 'type', 'tipe', 'jenisgroup', 'jenisservice',
                'jenislayanan', 'jenispelayanan', 'servicecategory', 'category'],
        );
        $headerRowIndex = null;
        $headerScore = -1;
        $sidOnlyHeaderIndex = null;
        foreach (array_slice($rows, 0, 50, true) as $rowIndex => $candidateRow) {
            $normalizedHeaders = array_map(
                fn ($header) => $this->normalizeHeader((string) $header),
                $candidateRow,
            );
            if (!array_intersect($sidAliases, $normalizedHeaders)) continue;

            $score = count(array_intersect($headerAliases, $normalizedHeaders));
            if ($sidOnlyHeaderIndex === null) $sidOnlyHeaderIndex = $rowIndex;
            if ($score > $headerScore) {
                $headerRowIndex = $rowIndex;
                $headerScore = $score;
            }
        }
        $headerRowIndex ??= $sidOnlyHeaderIndex;
        if ($headerRowIndex === null) {
            return response()->json(['message' => 'Kolom SID tidak ditemukan. Gunakan header SID atau Service ID.'], 400);
        }

        $headerRow = $rows[$headerRowIndex];
        $columns = [];
        foreach ($headerRow as $key => $header) $columns[$key] = (string) $header;
        $findColumn = function (array $aliases) use ($columns): ?string {
            foreach ($columns as $key => $header) {
                if (in_array($this->normalizeHeader($header), $aliases, true)) return $key;
            }
            return null;
        };

        $sidColumn = $findColumn($sidAliases);
        if (!$sidColumn) return response()->json(['message' => 'Kolom SID tidak ditemukan. Gunakan header SID atau Service ID.'], 400);
        $productColumn = $findColumn(['product', 'produk', 'service', 'layanan', 'producttype', 'tipeproduk', 'tipelayanan', 'namalayanan', 'namaproduk'])
            ?? $findColumn(['jenislayanan', 'jenispelayanan']);
        $capacityColumn = $findColumn(['capacitymbps', 'totalcapacitymbps', 'kapasitasmbps', 'kapasitas', 'bandwidth', 'bandwith', 'bandwid']);
        $orderColumn = $findColumn(['noorder', 'nomororder', 'orderno', 'order']);
        $quoteColumn = $findColumn(['quote', 'noquote', 'nomorquote']);
        $locationColumn = $findColumn(['lokasi', 'lokasititik', 'location', 'alamat']);
        $activeDateColumn = $findColumn(['tanggalaktif', 'tglaktif', 'activedate', 'startdate']);
        $priceColumn = $findColumn(['hargalayanan', 'hargalayananrp', 'price', 'amount', 'nilaikontrak']);
        $groupColumn = $findColumn(['servicegroup', 'servicetype', 'group', 'type', 'tipe', 'jenisgroup', 'jenisservice', 'jenislayanan', 'jenispelayanan', 'servicecategory', 'category']);
        $fallbackGroup = $this->normalizeServiceGroup($requestedGroup)
            ?? $this->normalizeServiceGroup($sheetTitle)
            ?? $this->normalizeServiceGroup((string) ($project->service_type ?? ''));

        $importRows = [];
        $skippedRows = 0;
        $duplicateRows = 0;
        $invalidRows = 0;
        $dataRows = array_filter($rows, fn ($rowNumber) => $rowNumber > $headerRowIndex, ARRAY_FILTER_USE_KEY);
        foreach ($dataRows as $row) {
            $sid = trim((string) ($row[$sidColumn] ?? ''));
            if (in_array($this->normalizeHeader($sid), $sidAliases, true)) {
                $skippedRows++;
                continue;
            }
            if ($sid === '') {
                if (count(array_filter($row, fn ($value) => trim((string) $value) !== '')) > 0) $invalidRows++;
                else $skippedRows++;
                continue;
            }

            $rowGroup = $groupColumn ? $this->normalizeServiceGroup((string) ($row[$groupColumn] ?? '')) : null;
            $productGroup = $productColumn ? $this->normalizeServiceGroup((string) ($row[$productColumn] ?? '')) : null;
            $serviceGroup = $rowGroup ?? $productGroup ?? $fallbackGroup;
            if ($serviceGroup === null) {
                $invalidRows++;
                continue;
            }

            $isPots = $serviceGroup === 'POTS';
            $productValue = $productColumn ? (string) ($row[$productColumn] ?? '') : '';
            $productType = $this->normalizeProduct($productValue, $project->service_type);
            $parsedCapacity = $this->parseCapacity($capacityColumn ? ($row[$capacityColumn] ?? 0) : 0);
            $capacity = $parsedCapacity;
            $servicePrice = !$isPots && $priceColumn
                ? $this->parsePrice($row[$priceColumn] ?? null)
                : null;
            if ($capacity === null || (!$isPots && $priceColumn && $servicePrice === null)) {
                $invalidRows++;
                continue;
            }

            $activeDate = null;
            if ($activeDateColumn && ($row[$activeDateColumn] ?? '') !== '') {
                try {
                    $activeDate = $this->normalizeDate($row[$activeDateColumn], $sid);
                } catch (\InvalidArgumentException $exception) {
                    return response()->json(['message' => $exception->getMessage()], 400);
                }
            }

            if (isset($importRows[$sid])) $duplicateRows++;
            $importRows[$sid] = [
                'sid' => $sid,
                'productType' => $productType,
                'capacityMbps' => $capacity,
                'serviceGroup' => $isPots ? 'POTS' : 'Non-POTS',
                'orderNo' => $orderColumn ? (trim((string) ($row[$orderColumn] ?? '')) ?: null) : null,
                'quote' => $quoteColumn ? (trim((string) ($row[$quoteColumn] ?? '')) ?: null) : null,
                'location' => $locationColumn ? (trim((string) ($row[$locationColumn] ?? '')) ?: null) : null,
                'activeDate' => $activeDate,
                'bandwidth' => $capacity ? $capacity.' Mbps' : null,
                'servicePrice' => $servicePrice,
            ];
        }

        if ($invalidRows) {
            return response()->json([
                'message' => "{$invalidRows} baris SID memiliki jenis layanan yang tidak dikenali, Harga Layanan Non-POTS yang kosong/tidak valid, atau Kapasitas yang tidak valid. Data lama tidak diubah; perbaiki file lalu unggah kembali.",
            ], 400);
        }
        if (!$importRows) return response()->json(['message' => 'Tidak ada baris SID valid untuk diimpor.'], 400);

        try {
            $groupsToReplace = array_values(array_unique(array_column($importRows, 'serviceGroup')));
            $replaced = DB::transaction(function () use ($idLOP, $groupsToReplace, $importRows): int {
                $project = DB::table('projects')->where('id_lop', $idLOP)->lockForUpdate()->first();
                if (!$project) abort(response()->json(['message' => 'Proyek tidak ditemukan.'], 404));

                $removed = DB::table('project_service_points')
                    ->where('id_lop', $idLOP)
                    ->whereIn('service_group', $groupsToReplace)
                    ->delete();
                foreach ($importRows as $point) {
                    DB::table('project_service_points')->updateOrInsert(
                        ['id_lop' => $idLOP, 'sid' => $point['sid']],
                        [
                            'id' => (string) Str::uuid(),
                            'product_type' => $point['productType'],
                            'capacity_mbps' => $point['capacityMbps'],
                            'service_group' => $point['serviceGroup'],
                            'order_no' => $point['orderNo'],
                            'quote' => $point['quote'],
                            'location' => $point['location'],
                            'active_date' => $point['activeDate'],
                            'bandwidth' => $point['bandwidth'],
                            'service_price' => $point['servicePrice'],
                            'updated_at' => now(),
                            'created_at' => now(),
                        ],
                    );
                }
                return $removed;
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpResponseException $exception) {
            return $exception->getResponse();
        } catch (QueryException $exception) {
            if (in_array((string) $exception->getCode(), ['23000', '23505'], true)) {
                return response()->json(['message' => 'SID duplikat tidak dapat disimpan.'], 409);
            }
            throw $exception;
        }

        return response()->json([
            'imported' => count($importRows),
            'replaced' => $replaced,
            'skipped' => $skippedRows,
            'duplicateRows' => $duplicateRows,
        ]);
    }

    public function pivot(): JsonResponse
    {
        $rows = DB::table('government_agencies as a')
            ->leftJoin('projects as p', 'p.agency_id', '=', 'a.id')
            ->leftJoin('project_service_points as sp', 'sp.id_lop', '=', 'p.id_lop')
            ->groupBy('a.id', 'a.name', 'a.agency_type', 'a.region')
            ->orderByRaw("CASE WHEN a.name LIKE 'Pemkot%' THEN 1 WHEN a.name LIKE 'Pemkab%' THEN 2 ELSE 3 END")
            ->orderBy('a.name')
            ->select([
                'a.name as agencyName', 'a.agency_type as agencyType', 'a.region',
                DB::raw('COUNT(sp.id) AS "pointCount"'),
                DB::raw('COALESCE(SUM(sp.capacity_mbps), 0) AS "totalBandwidthMbps"'),
            ])
            ->get()
            ->map(fn ($row): array => [
                'agencyName' => $row->agencyName,
                'agencyType' => $row->agencyType,
                'region' => $row->region,
                'pointCount' => (int) $row->pointCount,
                'totalBandwidthMbps' => (float) $row->totalBandwidthMbps,
            ])->all();

        return response()->json(['rows' => $rows]);
    }

    private function normalizeHeader(string $value): string
    {
        return strtolower(preg_replace('/[^a-z0-9]/i', '', $value) ?? '');
    }

    private function detectCsvDelimiter(string $path): string
    {
        $handle = fopen($path, 'rb');
        if ($handle === false) throw new \RuntimeException('File CSV tidak dapat dibuka.');

        $lines = [];
        while (count($lines) < 100 && ($line = fgets($handle)) !== false) {
            if (trim($line) !== '') $lines[] = $line;
        }
        fclose($handle);

        $firstLine = preg_replace('/^\xEF\xBB\xBF/', '', $lines[0] ?? '') ?? '';
        if (preg_match('/^sep=(.)/i', trim($firstLine), $matches)) return $matches[1];

        $bestDelimiter = ',';
        $bestColumnCount = 1;
        $bestFrequency = 0;
        foreach ([',', ';', "\t", '|'] as $delimiter) {
            $frequencies = [];
            foreach ($lines as $line) {
                $columnCount = count(str_getcsv($line, $delimiter));
                if ($columnCount > 1) $frequencies[$columnCount] = ($frequencies[$columnCount] ?? 0) + 1;
            }
            if (!$frequencies) continue;

            $columnCount = max(array_keys($frequencies));
            $frequency = $frequencies[$columnCount];
            if ($columnCount > $bestColumnCount || ($columnCount === $bestColumnCount && $frequency > $bestFrequency)) {
                $bestDelimiter = $delimiter;
                $bestColumnCount = $columnCount;
                $bestFrequency = $frequency;
            }
        }

        return $bestDelimiter;
    }

    private function normalizeServiceGroup(string $value): ?string
    {
        $normalized = $this->normalizeHeader($value);
        if (str_contains($normalized, 'nonpot')) return 'Non-POTS';
        if (str_contains($normalized, 'pots')) return 'POTS';

        return null;
    }

    private function normalizeProduct(string $value, string $fallback = ''): string
    {
        $product = trim($value !== '' ? $value : $fallback);
        $normalized = strtolower($product);
        foreach (['hsi' => 'HSI', 'wms' => 'WMS', 'wifi' => 'WMS', 'astinet' => 'Astinet', 'iptransit' => 'IP Transit', 'vpn' => 'VPN'] as $match => $type) {
            if (str_contains($normalized, $match)) return $type;
        }
        return $product;
    }

    private function parseCapacity(mixed $value): ?float
    {
        if ($value === null || $value === '') return 0.0;
        if (is_numeric($value)) return (float) $value >= 0 ? (float) $value : null;
        if (!preg_match('/^([\d.,]+)\s*(kbps|mbps|gbps)?$/i', trim((string) $value), $matches)) return null;

        $amount = $matches[1];
        if (str_contains($amount, ',') && str_contains($amount, '.')) $amount = str_replace(',', '.', str_replace('.', '', $amount));
        else $amount = str_replace(',', '.', $amount);
        if (!is_numeric($amount) || (float) $amount < 0) return null;
        $multiplier = match (strtolower($matches[2] ?? 'mbps')) { 'gbps' => 1000, 'kbps' => 0.001, default => 1 };
        return round((float) $amount * $multiplier, 3);
    }

    private function parsePrice(mixed $value): ?float
    {
        if ($value === null || $value === '') return null;
        if (is_numeric($value)) return (float) $value > 0 ? (float) $value : null;
        $amount = preg_replace('/^rp\s*/i', '', trim((string) $value)) ?? '';
        $amount = preg_replace('/\s+/', '', $amount) ?? '';
        if (str_contains($amount, ',')) $amount = str_replace(',', '.', str_replace('.', '', $amount));
        else $amount = str_replace('.', '', $amount);
        return is_numeric($amount) && (float) $amount > 0 ? (float) $amount : null;
    }

    private function normalizeDate(mixed $value, string $sid): string
    {
        $invalid = fn () => throw new \InvalidArgumentException("Tanggal Aktif untuk SID {$sid} tidak valid. Gunakan tanggal Excel atau format DD/MM/YYYY.");
        if (is_numeric($value)) {
            try {
                return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
            } catch (\Throwable) {
                return $invalid();
            }
        }

        $text = trim((string) $value);
        foreach (['!Y-n-j', '!Y-m-d', '!d/m/Y'] as $format) {
            $date = \DateTimeImmutable::createFromFormat($format, $text);
            if ($date !== false && $date->format(str_replace('!', '', $format)) === $text) return $date->format('Y-m-d');
        }
        if (preg_match('/^\d+(?:[.,]\d+)?$/', $text)) return $invalid();
        try {
            return (new \DateTimeImmutable($text))->format('Y-m-d');
        } catch (\Throwable) {
            return $invalid();
        }
    }
}
