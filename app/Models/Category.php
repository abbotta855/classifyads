<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
  protected $fillable = [
    'domain_category',
    'field_category',
    'item_category',
  ];
}
