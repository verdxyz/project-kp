<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id_lop', 'project_name', 'agency_id', 'budget', 'procurement_method', 'stage', 'progress',
        'start_date', 'end_date', 'pic', 'category', 'service_type', 'total_capacity_mbps', 'sid',
        'status', 'notes', 'subsidiary_name', 'customer_name', 'dinas_name', 'pemda_name', 'service_price',
    ];

    protected function casts(): array
    {
        return [
            'budget' => 'float',
            'service_price' => 'float',
            'total_capacity_mbps' => 'float',
            'progress' => 'integer',
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
        ];
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(GovernmentAgency::class, 'agency_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProjectDocument::class, 'id_lop', 'id_lop');
    }

    public function servicePoints(): HasMany
    {
        return $this->hasMany(ProjectServicePoint::class, 'id_lop', 'id_lop');
    }
}
