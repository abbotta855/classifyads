<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
  protected $fillable = [
    'province',
    'district',
    'local_level',
    'local_level_type',
    'ward_id',
  ];
}
