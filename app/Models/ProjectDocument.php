<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectDocument extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $primaryKey = 'id';

    const CREATED_AT = 'uploaded_at';

    const UPDATED_AT = null;

    protected $fillable = [
        'id', 'id_lop', 'document_type', 'original_name', 'storage_path', 'mime_type',
        'size_bytes', 'uploaded_by', 'uploaded_at',
    ];

    protected function casts(): array
    {
        return ['size_bytes' => 'integer', 'uploaded_at' => 'datetime'];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'id_lop', 'id_lop');
    }
}
