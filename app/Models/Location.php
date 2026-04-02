<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
  protected $fillable = [
    'province',
    'province_ne',
    'district',
    'district_ne',
    'local_level',
    'local_level_ne',
    'local_level_type',
    'local_level_type_ne',
    'ward_number',
    'local_address',
    'local_address_ne',
  ];
}
