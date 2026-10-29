<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectServicePoint extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'id_lop', 'sid', 'product_type', 'capacity_mbps', 'service_group', 'order_no',
        'quote', 'location', 'active_date', 'bandwidth', 'service_price',
    ];

    protected function casts(): array
    {
        return [
            'capacity_mbps' => 'float',
            'service_price' => 'float',
            'active_date' => 'date:Y-m-d',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'id_lop', 'id_lop');
    }
}
