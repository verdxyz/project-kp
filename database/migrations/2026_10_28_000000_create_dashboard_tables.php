<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('global_admin', function (Blueprint $table): void {
            $table->boolean('singleton')->primary()->default(true);
            $table->string('email');
            $table->string('display_name');
            $table->string('password_hash');
            $table->timestampTz('updated_at')->useCurrent();
        });

        Schema::create('government_agencies', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('agency_type');
            $table->string('region');
        });

        Schema::create('projects', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('id_lop')->unique();
            $table->text('project_name');
            $table->foreignId('agency_id')->constrained('government_agencies');
            $table->decimal('budget', 18, 2);
            $table->string('procurement_method');
            $table->string('stage');
            $table->unsignedSmallInteger('progress')->default(0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('pic');
            $table->string('category');
            $table->text('service_type');
            $table->decimal('total_capacity_mbps', 12, 3)->nullable();
            $table->text('sid')->nullable();
            $table->string('status')->default('Active');
            $table->text('notes')->nullable();
            $table->string('subsidiary_name')->nullable();
            $table->text('customer_name')->nullable();
            $table->text('dinas_name')->nullable();
            $table->text('pemda_name');
            $table->decimal('service_price', 18, 2);
            $table->timestampsTz();
            $table->index('stage');
        });

        Schema::create('project_documents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('id_lop');
            $table->string('document_type');
            $table->text('original_name');
            $table->string('storage_path', 500)->unique();
            $table->string('mime_type', 150);
            $table->unsignedBigInteger('size_bytes');
            $table->string('uploaded_by', 150);
            $table->timestampTz('uploaded_at')->useCurrent();
            $table->foreign('id_lop')->references('id_lop')->on('projects')->cascadeOnUpdate()->cascadeOnDelete();
            $table->unique(['id_lop', 'document_type']);
            $table->index('id_lop');
        });

        Schema::create('project_service_points', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('id_lop');
            $table->string('sid', 150);
            $table->string('product_type', 150)->nullable();
            $table->decimal('capacity_mbps', 12, 3)->default(0);
            $table->string('service_group')->default('Non-POTS');
            $table->text('order_no')->nullable();
            $table->text('quote')->nullable();
            $table->text('location')->nullable();
            $table->date('active_date')->nullable();
            $table->text('bandwidth')->nullable();
            $table->decimal('service_price', 18, 2)->nullable();
            $table->timestampsTz();
            $table->foreign('id_lop')->references('id_lop')->on('projects')->cascadeOnUpdate()->cascadeOnDelete();
            $table->unique(['id_lop', 'sid']);
            $table->index('product_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_service_points');
        Schema::dropIfExists('project_documents');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('government_agencies');
        Schema::dropIfExists('global_admin');
    }
};
