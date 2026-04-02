<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
  protected $fillable = [
    'domain_category',
    'domain_category_ne',
    'field_category',
    'field_category_ne',
    'item_category',
    'item_category_ne',
  ];
}
