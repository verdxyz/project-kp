<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProjectDocumentController extends Controller
{
    private const TYPES = [
        'p0', 'p1', 'ba_split', 'supporting_contract_doc', 'contract', 'bast', 'basto', 'other',
        'ngtma_agreement', 'nce_quote', 'rpa', 'invoice', 'billing_evidence',
    ];

    private function disk(): string
    {
        return config('filesystems.default', 'public');
    }

    public function index(string $idLOP): JsonResponse
    {
        $documents = DB::table('project_documents')
            ->where('id_lop', $idLOP)
            ->select([
                'id', 'id_lop as idLOP', 'document_type as documentType', 'original_name as originalName',
                'mime_type as mimeType', 'size_bytes as sizeBytes', 'uploaded_by as uploadedBy', 'uploaded_at as uploadedAt',
            ])
            ->orderBy('document_type')
            ->get();

        return response()->json(['documents' => $documents]);
    }

    public function store(Request $request, string $idLOP, string $documentType): JsonResponse
    {
        if (!in_array($documentType, self::TYPES, true)) {
            return response()->json(['message' => 'Jenis dokumen tidak valid.'], 400);
        }

        $file = $request->file('file');
        if (!$file) return response()->json(['message' => 'Pilih file dokumen terlebih dahulu.'], 400);
        if ($file->getSize() <= 0) return response()->json(['message' => 'File kosong tidak dapat diunggah.'], 400);
        if ($file->getSize() > 10 * 1024 * 1024) return response()->json(['message' => 'Ukuran file maksimal 10 MB.'], 413);
        if (!in_array(strtolower($file->getClientOriginalExtension()), ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'], true)) {
            return response()->json(['message' => 'Format file tidak didukung. Gunakan PDF, Office, atau gambar.'], 400);
        }

        $storagePath = 'uploads/projects/'.rawurlencode($idLOP).'/'.Str::uuid().'.'.strtolower($file->getClientOriginalExtension());
        $oldStoragePath = null;
        $disk = $this->disk();

        try {
            DB::transaction(function () use ($file, $idLOP, $documentType, $storagePath, $disk, &$oldStoragePath): void {
                $project = DB::table('projects')->where('id_lop', $idLOP)->lockForUpdate()->first();
                if (!$project) abort(response()->json(['message' => 'Proyek dengan ID LOP tersebut tidak ditemukan.'], 404));

                $oldStoragePath = DB::table('project_documents')
                    ->where('id_lop', $idLOP)->where('document_type', $documentType)->value('storage_path');

                $mimeType = $file->getMimeType() ?: $file->getClientMimeType() ?: 'application/octet-stream';
                $stream = fopen($file->getRealPath(), 'rb');
                try {
                    $stored = Storage::disk($disk)->put($storagePath, $stream);
                } finally {
                    if (is_resource($stream)) fclose($stream);
                }
                if (!$stored) throw new \RuntimeException('Gagal menyimpan file dokumen ke penyimpanan lokal.');

                DB::table('project_documents')->updateOrInsert(
                    ['id_lop' => $idLOP, 'document_type' => $documentType],
                    [
                        'id' => (string) Str::uuid(),
                        'original_name' => $file->getClientOriginalName(),
                        'storage_path' => $storagePath,
                        'mime_type' => $mimeType,
                        'size_bytes' => $file->getSize(),
                        'uploaded_by' => 'Admin Support',
                        'uploaded_at' => now(),
                    ],
                );
            });
        } catch (\Throwable $error) {
            try {
                Storage::disk($disk)->delete($storagePath);
            } catch (\Throwable) {
                // Ignore cleanup failure
            }
            if ($error instanceof \Symfony\Component\HttpKernel\Exception\HttpException) throw $error;
            throw $error;
        }

        if ($oldStoragePath && $oldStoragePath !== $storagePath) {
            try {
                Storage::disk($disk)->delete($oldStoragePath);
            } catch (\Throwable $error) {
                Log::warning('Failed to remove replaced document.', ['path' => $oldStoragePath, 'error' => $error->getMessage()]);
            }
        }

        $document = DB::table('project_documents')
            ->where('id_lop', $idLOP)->where('document_type', $documentType)
            ->select([
                'id', 'id_lop as idLOP', 'document_type as documentType', 'original_name as originalName',
                'mime_type as mimeType', 'size_bytes as sizeBytes', 'uploaded_by as uploadedBy', 'uploaded_at as uploadedAt',
            ])->first();

        return response()->json(['document' => $document], 201);
    }

    public function download(string $idLOP, string $documentType): StreamedResponse|JsonResponse
    {
        $document = DB::table('project_documents')
            ->where('id_lop', $idLOP)->where('document_type', $documentType)->first();
        if (!$document) return response()->json(['message' => 'Dokumen belum diunggah.'], 404);

        $disk = $this->disk();
        try {
            $stream = Storage::disk($disk)->readStream($document->storage_path);
        } catch (\Throwable $error) {
            return response()->json(['message' => 'File dokumen tidak ditemukan di penyimpanan lokal.'], 404);
        }
        if (!is_resource($stream)) return response()->json(['message' => 'File dokumen tidak ditemukan di penyimpanan lokal.'], 404);

        return response()->streamDownload(function () use ($stream): void {
            fpassthru($stream);
            if (is_resource($stream)) fclose($stream);
        }, $document->original_name, [
            'Content-Type' => $document->mime_type ?: 'application/octet-stream',
            'Content-Length' => (string) $document->size_bytes,
        ]);
    }

    public function destroy(string $idLOP, string $documentType): JsonResponse
    {
        if (!in_array($documentType, self::TYPES, true)) {
            return response()->json(['message' => 'Jenis dokumen tidak valid.'], 400);
        }

        $storagePath = DB::table('project_documents')
            ->where('id_lop', $idLOP)->where('document_type', $documentType)->value('storage_path');
        if (!$storagePath) return response()->json(['message' => 'Dokumen tidak ditemukan.'], 404);

        DB::table('project_documents')->where('id_lop', $idLOP)->where('document_type', $documentType)->delete();
        try {
            Storage::disk($this->disk())->delete($storagePath);
        } catch (\Throwable $error) {
            Log::warning('Failed to remove document from disk.', ['path' => $storagePath, 'error' => $error->getMessage()]);
        }

        return response()->json(null, 204);
    }
}
