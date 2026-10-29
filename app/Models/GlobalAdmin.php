<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GlobalAdmin extends Model
{
    protected $table = 'global_admin';

    protected $primaryKey = 'singleton';

    public $incrementing = false;

    protected $keyType = 'bool';

    public $timestamps = false;

    protected $fillable = ['singleton', 'email', 'display_name', 'password_hash', 'updated_at'];

    protected $hidden = ['password_hash'];
}
