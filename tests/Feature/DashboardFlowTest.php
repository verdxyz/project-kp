<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class DashboardFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('government_agencies')->insert([
            'name' => 'Pemkot Salatiga',
            'agency_type' => 'Pemerintah Kota',
            'region' => 'Salatiga',
        ]);
        DB::table('global_admin')->insert([
            'singleton' => true,
            'email' => 'admin@example.com',
            'display_name' => 'Admin Support',
            'password_hash' => Hash::make('test-password'),
            'updated_at' => now(),
        ]);
    }

    public function test_login_session_and_inertia_portal(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('data-page')
            ->assertSee('Portal');

        $this->postJson('/api/auth/login', ['email' => 'admin@example.com', 'password' => 'test-password'])
            ->assertOk()
            ->assertJsonPath('user.email', 'admin@example.com');

        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('user.nama', 'Admin Support');
        $this->postJson('/api/auth/logout')->assertNoContent();
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_project_crud_and_service_point_flows(): void
    {
        $this->withSession(['admin_id' => 'global-admin'])
            ->getJson('/api/agencies')
            ->assertOk()
            ->assertJsonPath('agencies.0.name', 'Pemkot Salatiga');

        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertCreated()
            ->assertJsonPath('project.idLOP', 'LOP-TEST-001')
            ->assertJsonPath('project.agency', 'Pemkot Salatiga');

        $this->withSession(['admin_id' => 'global-admin'])
            ->getJson('/api/projects')
            ->assertOk()
            ->assertJsonPath('projects.0.idLOP', 'LOP-TEST-001');

        $this->withSession(['admin_id' => 'global-admin'])
            ->getJson('/api/projects/LOP-TEST-001')
            ->assertOk()
            ->assertJsonPath('project.projectName', 'Proyek Uji');

        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertStatus(409);

        $projectId = DB::table('projects')->where('id_lop', 'LOP-TEST-001')->value('id');
        $updated = $this->projectPayload();
        $updated['projectName'] = 'Proyek Diperbarui';
        $this->withSession(['admin_id' => 'global-admin'])
            ->putJson('/api/projects/'.$projectId, $updated)
            ->assertOk()
            ->assertJsonPath('project.projectName', 'Proyek Diperbarui');

        $this->withSession(['admin_id' => 'global-admin'])
            ->putJson('/api/projects/LOP-TEST-001/service-points', [
                'servicePoints' => [[
                    'sid' => 'SID-001', 'productType' => 'Astinet', 'capacityMbps' => 250,
                    'serviceGroup' => 'Non-POTS', 'servicePrice' => 125000,
                ]],
            ])
            ->assertOk()
            ->assertJsonPath('servicePoints.0.sid', 'SID-001');

        $this->withSession(['admin_id' => 'global-admin'])
            ->getJson('/api/reports/service-pivot')
            ->assertOk()
            ->assertJsonPath('rows.0.pointCount', 1);

        $this->withSession(['admin_id' => 'global-admin'])
            ->getJson('/api/projects/LOP-TEST-001/service-points')
            ->assertOk()
            ->assertJsonPath('servicePoints.0.sid', 'SID-001');

        $this->withSession(['admin_id' => 'global-admin'])
            ->getJson('/api/projects')
            ->assertOk()
            ->assertJsonPath('projects.0.totalCapacityMbps', 250);

        $this->withSession(['admin_id' => 'global-admin'])
            ->deleteJson('/api/projects/LOP-TEST-001')
            ->assertNoContent();
    }

    public function test_project_can_be_saved_without_pic_contact_name(): void
    {
        $payload = $this->projectPayload();
        $payload['idLOP'] = 'LOP-TEST-NO-PIC';
        $payload['pic'] = '';

        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $payload)
            ->assertCreated()
            ->assertJsonPath('project.pic', '');

        $this->assertDatabaseHas('projects', [
            'id_lop' => 'LOP-TEST-NO-PIC',
            'pic' => '',
        ]);
    }

    public function test_service_point_excel_import_keeps_import_summary(): void
    {
        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertCreated();

        $this->withSession(['admin_id' => 'global-admin'])
            ->getJson('/api/projects/LOP-TEST-001/documents')
            ->assertOk()
            ->assertJsonPath('documents', []);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['NAMA LAYANAN', 'BANDWIDTH', 'LOKASI', 'QUOTE', 'NO ORDER', 'SID', 'TANGGAL AKTIF', 'Harga Layanan'],
            ['Astinet', '200 Mbps', 'Kantor Diskominfo', 'Q-2026-001', 'ORD-2026-NP-001', 'SID-EXCEL-001', '2026-02-01', 250000],
        ]);
        $path = tempnam(sys_get_temp_dir(), 'b2g-import-');
        (new Xlsx($spreadsheet))->save($path);

        try {
            $file = new UploadedFile($path, 'service-points.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
            $response = $this->withSession(['admin_id' => 'global-admin'])
                ->post('/api/projects/LOP-TEST-001/service-points/import', ['file' => $file, 'serviceGroup' => 'Non-POTS']);
            $this->assertSame(200, $response->status(), $response->getContent());
            $response->assertJsonPath('imported', 1)
                ->assertJsonPath('replaced', 0)
                ->assertJsonPath('skipped', 0);

            $this->assertDatabaseHas('project_service_points', [
                'id_lop' => 'LOP-TEST-001',
                'sid' => 'SID-EXCEL-001',
                'product_type' => 'Astinet',
                'service_group' => 'Non-POTS',
                'capacity_mbps' => 200,
                'location' => 'Kantor Diskominfo',
                'quote' => 'Q-2026-001',
                'order_no' => 'ORD-2026-NP-001',
                'service_price' => 250000,
            ]);
        } finally {
            @unlink($path);
            $spreadsheet->disconnectWorksheets();
        }
    }

    public function test_non_pots_import_accepts_workbook_without_price_column(): void
    {
        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertCreated();

        $spreadsheet = new Spreadsheet();
        $spreadsheet->getActiveSheet()->fromArray([
            ['NAMA LAYANAN', 'BANDWIDTH', 'LOKASI', 'NO ORDER', 'SID', 'TANGGAL AKTIF'],
            ['ASTINET', 100, 'UNDIP', 'TERDAPAT QUOTE', '9876644998', '2026-10-14'],
        ]);
        $path = tempnam(sys_get_temp_dir(), 'b2g-non-pots-no-price-');
        (new Xlsx($spreadsheet))->save($path);

        try {
            $file = new UploadedFile($path, 'titik-layanan-non-pots.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
            $this->withSession(['admin_id' => 'global-admin'])
                ->post('/api/projects/LOP-TEST-001/service-points/import', ['file' => $file, 'serviceGroup' => 'Non-POTS'])
                ->assertOk()
                ->assertJsonPath('imported', 1);

            $this->assertDatabaseHas('project_service_points', [
                'id_lop' => 'LOP-TEST-001',
                'sid' => '9876644998',
                'product_type' => 'Astinet',
                'service_group' => 'Non-POTS',
                'capacity_mbps' => 100,
                'location' => 'UNDIP',
                'order_no' => 'TERDAPAT QUOTE',
                'service_price' => null,
            ]);
        } finally {
            @unlink($path);
            $spreadsheet->disconnectWorksheets();
        }
    }

    public function test_non_pots_drive_template_imports_its_numeric_sid_and_excel_date(): void
    {
        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertCreated();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Non-POTS');
        $sheet->fromArray([
            ['NAMA LAYANAN', 'BANDWIDTH', 'LOKASI', 'QUOTE', 'NO ORDER', 'SID', 'TANGGAL AKTIF', 'Harga Layanan'],
            ['INDIBIZ', 50, 'POLDA JATENG', 'TERDAPAT QUOTE', '1-9876789087', 987687480, ExcelDate::PHPToExcel(new \DateTimeImmutable('2026-10-11')), 10000000],
        ]);
        $path = tempnam(sys_get_temp_dir(), 'b2g-drive-non-pots-');
        (new Xlsx($spreadsheet))->save($path);

        try {
            $file = new UploadedFile($path, 'TEST NON POTS.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
            $this->withSession(['admin_id' => 'global-admin'])
                ->post('/api/projects/LOP-TEST-001/service-points/import', ['file' => $file, 'serviceGroup' => 'Non-POTS'])
                ->assertOk()
                ->assertJsonPath('imported', 1);

            $this->assertDatabaseHas('project_service_points', [
                'id_lop' => 'LOP-TEST-001',
                'sid' => '987687480',
                'product_type' => 'INDIBIZ',
                'service_group' => 'Non-POTS',
                'capacity_mbps' => 50,
                'location' => 'POLDA JATENG',
                'quote' => 'TERDAPAT QUOTE',
                'order_no' => '1-9876789087',
                'active_date' => '2026-10-11',
                'service_price' => 10000000,
            ]);
        } finally {
            @unlink($path);
            $spreadsheet->disconnectWorksheets();
        }
    }

    public function test_pots_excel_import_accepts_template_without_service_price(): void
    {
        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertCreated();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['NAMA LAYANAN', 'BANDWID', 'LOKASI', 'NO ORDER', 'SID', 'TANGGAL AKTIF'],
            ['HSI', '50 Mbps', 'Ruang Pelayanan', 'ORD-2026-POTS-001', 'SID-POTS-001', '2026-01-15'],
        ]);
        $path = tempnam(sys_get_temp_dir(), 'b2g-pots-import-');
        (new Xlsx($spreadsheet))->save($path);

        try {
            $file = new UploadedFile($path, 'service-points-pots.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
            $response = $this->withSession(['admin_id' => 'global-admin'])
                ->post('/api/projects/LOP-TEST-001/service-points/import', ['file' => $file, 'serviceGroup' => 'POTS']);
            $this->assertSame(200, $response->status(), $response->getContent());
            $response->assertJsonPath('imported', 1)
                ->assertJsonPath('replaced', 0);

            $this->assertDatabaseHas('project_service_points', [
                'id_lop' => 'LOP-TEST-001',
                'sid' => 'SID-POTS-001',
                'product_type' => 'HSI',
                'service_group' => 'POTS',
                'capacity_mbps' => 50,
                'location' => 'Ruang Pelayanan',
                'order_no' => 'ORD-2026-POTS-001',
                'service_price' => null,
            ]);
        } finally {
            @unlink($path);
            $spreadsheet->disconnectWorksheets();
        }
    }

    public function test_pots_import_does_not_store_service_price_even_if_column_is_present(): void
    {
        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertCreated();

        $spreadsheet = new Spreadsheet();
        $spreadsheet->getActiveSheet()->fromArray([
            ['NAMA LAYANAN', 'BANDWIDTH', 'LOKASI', 'NO ORDER', 'SID', 'TANGGAL AKTIF', 'Harga Layanan'],
            ['ASTINET', 100, 'UNDIP', 'TERDAPAT QUOTE', 9876644998, '2026-10-14', 500000000],
        ]);
        $path = tempnam(sys_get_temp_dir(), 'b2g-pots-price-');
        (new Xlsx($spreadsheet))->save($path);

        try {
            $file = new UploadedFile($path, 'service-points-pots-with-price.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
            $this->withSession(['admin_id' => 'global-admin'])
                ->post('/api/projects/LOP-TEST-001/service-points/import', ['file' => $file, 'serviceGroup' => 'POTS'])
                ->assertOk()
                ->assertJsonPath('imported', 1);

            $this->assertDatabaseHas('project_service_points', [
                'id_lop' => 'LOP-TEST-001',
                'sid' => '9876644998',
                'service_group' => 'POTS',
                'capacity_mbps' => 100,
                'location' => 'UNDIP',
                'order_no' => 'TERDAPAT QUOTE',
                'service_price' => null,
            ]);
        } finally {
            @unlink($path);
            $spreadsheet->disconnectWorksheets();
        }
    }

    public function test_pots_template_with_repeated_numeric_sid_saves_one_unique_point(): void
    {
        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertCreated();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('POTS');
        $sheet->fromArray([
            ['Nama Produk *', 'Bandwidth *', 'Lokasi Titik *', 'Nomor Quote', 'No. Order *', 'SID *', ''],
            ['ASTINET', 100, 'UNDIP', 'TERDAPAT QUOTE', 9876644998, 9876644998, 500000000],
            ['ASTINET', 100, 'UNDIP', 'TERDAPAT QUOTE', 9876644998, 9876644998, 500000000],
            ['ASTINET', 100, 'UNDIP', 'TERDAPAT QUOTE', 9876644998, 9876644998, 500000000],
        ]);
        $path = tempnam(sys_get_temp_dir(), 'b2g-pots-duplicate-sid-');
        (new Xlsx($spreadsheet))->save($path);

        try {
            $file = new UploadedFile($path, 'test-pots.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
            $this->withSession(['admin_id' => 'global-admin'])
                ->post('/api/projects/LOP-TEST-001/service-points/import', ['file' => $file, 'serviceGroup' => 'POTS'])
                ->assertOk()
                ->assertJsonPath('imported', 1)
                ->assertJsonPath('duplicateRows', 2);

            $this->assertDatabaseHas('project_service_points', [
                'id_lop' => 'LOP-TEST-001',
                'sid' => '9876644998',
                'service_group' => 'POTS',
                'product_type' => 'Astinet',
                'capacity_mbps' => 100,
                'location' => 'UNDIP',
                'order_no' => '9876644998',
                'service_price' => null,
            ]);
            $this->assertSame(1, DB::table('project_service_points')->where('id_lop', 'LOP-TEST-001')->count());
        } finally {
            @unlink($path);
            $spreadsheet->disconnectWorksheets();
        }
    }

    public function test_import_returns_json_message_when_php_cannot_save_upload_temporarily(): void
    {
        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertCreated();

        $path = tempnam(sys_get_temp_dir(), 'b2g-upload-error-');
        try {
            $file = new UploadedFile(
                $path,
                'service-points.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                UPLOAD_ERR_NO_TMP_DIR,
                true,
            );
            $this->withSession(['admin_id' => 'global-admin'])
                ->post('/api/projects/LOP-TEST-001/service-points/import', ['file' => $file, 'serviceGroup' => 'POTS'])
                ->assertBadRequest()
                ->assertJsonPath('message', 'Server gagal menyimpan file sementara. Periksa upload_tmp_dir dan izin tulis PHP.');
        } finally {
            @unlink($path);
        }
    }

    public function test_requested_pots_and_non_pots_excel_headers_import_without_sid_reentry(): void
    {
        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertCreated();

        $spreadsheet = new Spreadsheet();
        $nonPots = $spreadsheet->getActiveSheet();
        $nonPots->setTitle('Non-POTS');
        $nonPots->fromArray([
            ['Nama Produk *', 'Bandwidth *', 'Lokasi Titik *', 'Nomor Quote', 'No. Order *', 'SID *', 'Harga Layanan (Rp) *'],
            ['Astinet', '100 Mbps', 'Kota/Kabupaten Semarang', 'Q-2026-001', 'ORD-123', '64648468', 1500000],
        ]);
        $pots = $spreadsheet->createSheet();
        $pots->setTitle('POTS');
        $pots->fromArray([
            ['Nama Produk *', 'Bandwidth *', 'Lokasi Titik *', 'Nomor Quote', 'No. Order *', 'SID *'],
            ['Astinet', '100 Mbps', 'Kota/Kabupaten Semarang', 'Q-2026-002', 'ORD-124', '64648469'],
        ]);
        $path = tempnam(sys_get_temp_dir(), 'b2g-requested-templates-');
        (new Xlsx($spreadsheet))->save($path);

        try {
            foreach (['Non-POTS', 'POTS'] as $group) {
                $file = new UploadedFile($path, 'template-'.$group.'.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
                $this->withSession(['admin_id' => 'global-admin'])
                    ->post('/api/projects/LOP-TEST-001/service-points/import', ['file' => $file, 'serviceGroup' => $group])
                    ->assertOk()
                    ->assertJsonPath('imported', 1);
            }

            $this->assertDatabaseHas('project_service_points', [
                'id_lop' => 'LOP-TEST-001',
                'sid' => '64648468',
                'product_type' => 'Astinet',
                'capacity_mbps' => 100,
                'location' => 'Kota/Kabupaten Semarang',
                'quote' => 'Q-2026-001',
                'order_no' => 'ORD-123',
                'service_group' => 'Non-POTS',
                'service_price' => 1500000,
            ]);
            $this->assertDatabaseHas('project_service_points', [
                'id_lop' => 'LOP-TEST-001',
                'sid' => '64648469',
                'product_type' => 'Astinet',
                'capacity_mbps' => 100,
                'location' => 'Kota/Kabupaten Semarang',
                'quote' => 'Q-2026-002',
                'order_no' => 'ORD-124',
                'service_group' => 'POTS',
                'service_price' => null,
            ]);
        } finally {
            @unlink($path);
            $spreadsheet->disconnectWorksheets();
        }
    }

    public function test_csv_import_sorts_rows_by_service_type_column(): void
    {
        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertCreated();

        $now = now();
        foreach (['POTS' => 'OLD-POTS', 'Non-POTS' => 'OLD-NON-POTS'] as $group => $sid) {
            DB::table('project_service_points')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'id_lop' => 'LOP-TEST-001',
                'sid' => $sid,
                'product_type' => $group === 'POTS' ? 'HSI' : 'Astinet',
                'capacity_mbps' => 0,
                'service_group' => $group,
                'service_price' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $csv = implode("\r\n", [
            'Laporan Titik Layanan',
            '',
            'Jenis Layanan;NAMA LAYANAN;BANDWIDTH;LOKASI;QUOTE;NO ORDER;SID;TANGGAL AKTIF;Harga Layanan',
            'Jenis Layanan;NAMA LAYANAN;BANDWIDTH;LOKASI;QUOTE;NO ORDER;SID;TANGGAL AKTIF;Harga Layanan',
            'POTS;HSI;50 Mbps;Ruang Pelayanan;;ORD-POTS-001;SID-POTS-CSV;2026-01-15;',
            'Non-POTS;Astinet;200 Mbps;Kantor Diskominfo;Q-CSV-001;ORD-NP-001;SID-NP-CSV;2026-02-01;250000',
        ]);
        $file = UploadedFile::fake()->createWithContent('service-points.csv', $csv);

        $response = $this->withSession(['admin_id' => 'global-admin'])
            ->post('/api/projects/LOP-TEST-001/service-points/import', ['file' => $file, 'serviceGroup' => 'Non-POTS']);
        $this->assertSame(200, $response->status(), $response->getContent());
        $response->assertJsonPath('imported', 2)
            ->assertJsonPath('replaced', 2)
            ->assertJsonPath('skipped', 1);
        $this->assertDatabaseMissing('project_service_points', ['sid' => 'OLD-POTS']);
        $this->assertDatabaseMissing('project_service_points', ['sid' => 'OLD-NON-POTS']);

        $this->assertDatabaseHas('project_service_points', [
            'id_lop' => 'LOP-TEST-001',
            'sid' => 'SID-POTS-CSV',
            'service_group' => 'POTS',
            'product_type' => 'HSI',
            'service_price' => null,
        ]);
        $this->assertDatabaseHas('project_service_points', [
            'id_lop' => 'LOP-TEST-001',
            'sid' => 'SID-NP-CSV',
            'service_group' => 'Non-POTS',
            'product_type' => 'Astinet',
            'service_price' => 250000,
        ]);
    }

    public function test_invalid_mixed_import_does_not_partially_replace_service_points(): void
    {
        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertCreated();

        $now = now();
        DB::table('project_service_points')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'id_lop' => 'LOP-TEST-001',
            'sid' => 'OLD-POTS',
            'product_type' => 'HSI',
            'capacity_mbps' => 0,
            'service_group' => 'POTS',
            'service_price' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $csv = implode("\r\n", [
            'Jenis Layanan;NAMA LAYANAN;BANDWIDTH;SID;Harga Layanan',
            'POTS;HSI;50 Mbps;NEW-POTS;',
            'Non-POTS;Astinet;100 Mbps;INVALID-NON-POTS;',
        ]);
        $file = UploadedFile::fake()->createWithContent('invalid-service-points.csv', $csv);

        $this->withSession(['admin_id' => 'global-admin'])
            ->post('/api/projects/LOP-TEST-001/service-points/import', ['file' => $file, 'serviceGroup' => 'Non-POTS'])
            ->assertBadRequest();

        $this->assertDatabaseHas('project_service_points', ['sid' => 'OLD-POTS']);
        $this->assertDatabaseMissing('project_service_points', ['sid' => 'NEW-POTS']);
    }

    public function test_document_upload_download_and_delete(): void
    {
        Storage::fake('r2');
        $this->withSession(['admin_id' => 'global-admin'])
            ->postJson('/api/projects', $this->projectPayload())
            ->assertCreated();

        $upload = $this->withSession(['admin_id' => 'global-admin'])
            ->post('/api/projects/LOP-TEST-001/documents/p0', [
                'file' => UploadedFile::fake()->createWithContent('p0.pdf', '%PDF-1.4 test file'),
            ])
            ->assertCreated()
            ->assertJsonPath('document.documentType', 'p0');

        $this->withSession(['admin_id' => 'global-admin'])
            ->get('/api/projects/LOP-TEST-001/documents/p0/file')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->withSession(['admin_id' => 'global-admin'])
            ->deleteJson('/api/projects/LOP-TEST-001/documents/p0')
            ->assertNoContent();
    }

    private function projectPayload(): array
    {
        return [
            'idLOP' => 'LOP-TEST-001',
            'projectName' => 'Proyek Uji',
            'agency' => 'Pemkot Salatiga',
            'pemdaName' => 'Pemkot Salatiga',
            'budget' => 1000000,
            'servicePrice' => 900000,
            'procurementMethod' => 'E-Katalog',
            'stage' => 'F1',
            'progress' => 20,
            'startDate' => '2026-01-01',
            'endDate' => '2026-12-31',
            'pic' => 'Admin',
            'category' => 'On Channel',
            'serviceType' => 'Astinet',
            'totalCapacityMbps' => 100,
            'sid' => '',
            'status' => 'Active',
            'notes' => '',
        ];
    }
}
