<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AgencyController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectDocumentController;
use App\Http\Controllers\ProjectServicePointController;
use App\Http\Middleware\EnsureAdminAuthenticated;

Route::get('/', fn () => Inertia::render('Portal'));

Route::prefix('api')->group(function (): void {
    Route::get('/health', function () {
        DB::select('SELECT 1');
        return response()->json(['status' => 'ok']);
    });

    Route::post('/auth/login', [AdminAuthController::class, 'login'])->middleware('throttle:10,15');
    Route::get('/auth/me', [AdminAuthController::class, 'currentUser'])->middleware(EnsureAdminAuthenticated::class);
    Route::post('/auth/logout', [AdminAuthController::class, 'logout'])->middleware(EnsureAdminAuthenticated::class);

    Route::middleware(EnsureAdminAuthenticated::class)->group(function (): void {
        Route::get('/agencies', [AgencyController::class, 'index']);

        Route::get('/projects', [ProjectController::class, 'index']);
        Route::post('/projects', [ProjectController::class, 'store']);
        Route::get('/projects/{idLOP}', [ProjectController::class, 'show']);
        Route::put('/projects/{id}', [ProjectController::class, 'update']);
        Route::delete('/projects/{idLOP}', [ProjectController::class, 'destroy']);

        Route::get('/projects/{idLOP}/documents', [ProjectDocumentController::class, 'index']);
        Route::post('/projects/{idLOP}/documents/{documentType}', [ProjectDocumentController::class, 'store']);
        Route::get('/projects/{idLOP}/documents/{documentType}/file', [ProjectDocumentController::class, 'download']);
        Route::delete('/projects/{idLOP}/documents/{documentType}', [ProjectDocumentController::class, 'destroy']);

        Route::get('/reports/service-pivot', [ProjectServicePointController::class, 'pivot']);
        Route::get('/projects/{idLOP}/service-points', [ProjectServicePointController::class, 'index']);
        Route::put('/projects/{idLOP}/service-points', [ProjectServicePointController::class, 'update']);
        Route::post('/projects/{idLOP}/service-points/import', [ProjectServicePointController::class, 'import']);
    });
});
