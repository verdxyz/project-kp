<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GovernmentAgency extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'agency_type', 'region'];

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'agency_id');
    }
}
