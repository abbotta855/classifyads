<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
    // Clear existing locations
    DB::table('locations')->truncate();

    $locations = [
      // Province 1 - Koshi Province
      ['province' => 'Koshi', 'district' => 'Morang', 'local_level' => 'Biratnagar', 'local_level_type' => 'Metropolitan City', 'ward_id' => 1],
      ['province' => 'Koshi', 'district' => 'Morang', 'local_level' => 'Belbari', 'local_level_type' => 'Municipality', 'ward_id' => 2],
      ['province' => 'Koshi', 'district' => 'Morang', 'local_level' => 'Rangeli', 'local_level_type' => 'Rural Municipality', 'ward_id' => 3],
      ['province' => 'Koshi', 'district' => 'Sunsari', 'local_level' => 'Itahari', 'local_level_type' => 'Sub-Metropolitan City', 'ward_id' => 4],
      ['province' => 'Koshi', 'district' => 'Sunsari', 'local_level' => 'Dharan', 'local_level_type' => 'Sub-Metropolitan City', 'ward_id' => 5],
      ['province' => 'Koshi', 'district' => 'Sunsari', 'local_level' => 'Barahachhetra', 'local_level_type' => 'Rural Municipality', 'ward_id' => 6],
      ['province' => 'Koshi', 'district' => 'Jhapa', 'local_level' => 'Bhadrapur', 'local_level_type' => 'Municipality', 'ward_id' => 7],
      ['province' => 'Koshi', 'district' => 'Jhapa', 'local_level' => 'Mechinagar', 'local_level_type' => 'Municipality', 'ward_id' => 8],
      ['province' => 'Koshi', 'district' => 'Jhapa', 'local_level' => 'Kachankawal', 'local_level_type' => 'Rural Municipality', 'ward_id' => 9],

      // Province 2 - Madhesh Province
      ['province' => 'Madhesh', 'district' => 'Dhanusha', 'local_level' => 'Janakpur', 'local_level_type' => 'Sub-Metropolitan City', 'ward_id' => 10],
      ['province' => 'Madhesh', 'district' => 'Dhanusha', 'local_level' => 'Dhanusadham', 'local_level_type' => 'Municipality', 'ward_id' => 11],
      ['province' => 'Madhesh', 'district' => 'Dhanusha', 'local_level' => 'Bideha', 'local_level_type' => 'Rural Municipality', 'ward_id' => 12],
      ['province' => 'Madhesh', 'district' => 'Sarlahi', 'local_level' => 'Malangwa', 'local_level_type' => 'Municipality', 'ward_id' => 13],
      ['province' => 'Madhesh', 'district' => 'Sarlahi', 'local_level' => 'Barahathawa', 'local_level_type' => 'Municipality', 'ward_id' => 14],
      ['province' => 'Madhesh', 'district' => 'Sarlahi', 'local_level' => 'Haripur', 'local_level_type' => 'Rural Municipality', 'ward_id' => 15],
      ['province' => 'Madhesh', 'district' => 'Mahottari', 'local_level' => 'Jaleshwar', 'local_level_type' => 'Municipality', 'ward_id' => 16],
      ['province' => 'Madhesh', 'district' => 'Mahottari', 'local_level' => 'Bardibas', 'local_level_type' => 'Municipality', 'ward_id' => 17],

      // Province 3 - Bagmati Province
      ['province' => 'Bagmati', 'district' => 'Kathmandu', 'local_level' => 'Kathmandu', 'local_level_type' => 'Metropolitan City', 'ward_id' => 18],
      ['province' => 'Bagmati', 'district' => 'Kathmandu', 'local_level' => 'Lalitpur', 'local_level_type' => 'Metropolitan City', 'ward_id' => 19],
      ['province' => 'Bagmati', 'district' => 'Kathmandu', 'local_level' => 'Bhaktapur', 'local_level_type' => 'Sub-Metropolitan City', 'ward_id' => 20],
      ['province' => 'Bagmati', 'district' => 'Kathmandu', 'local_level' => 'Kirtipur', 'local_level_type' => 'Municipality', 'ward_id' => 21],
      ['province' => 'Bagmati', 'district' => 'Kathmandu', 'local_level' => 'Tokha', 'local_level_type' => 'Municipality', 'ward_id' => 22],
      ['province' => 'Bagmati', 'district' => 'Kathmandu', 'local_level' => 'Dakshinkali', 'local_level_type' => 'Rural Municipality', 'ward_id' => 23],
      ['province' => 'Bagmati', 'district' => 'Lalitpur', 'local_level' => 'Lalitpur', 'local_level_type' => 'Metropolitan City', 'ward_id' => 24],
      ['province' => 'Bagmati', 'district' => 'Lalitpur', 'local_level' => 'Godawari', 'local_level_type' => 'Municipality', 'ward_id' => 25],
      ['province' => 'Bagmati', 'district' => 'Lalitpur', 'local_level' => 'Mahalaxmi', 'local_level_type' => 'Municipality', 'ward_id' => 26],
      ['province' => 'Bagmati', 'district' => 'Lalitpur', 'local_level' => 'Bagmati', 'local_level_type' => 'Rural Municipality', 'ward_id' => 27],
      ['province' => 'Bagmati', 'district' => 'Bhaktapur', 'local_level' => 'Bhaktapur', 'local_level_type' => 'Sub-Metropolitan City', 'ward_id' => 28],
      ['province' => 'Bagmati', 'district' => 'Bhaktapur', 'local_level' => 'Madhyapur Thimi', 'local_level_type' => 'Municipality', 'ward_id' => 29],
      ['province' => 'Bagmati', 'district' => 'Bhaktapur', 'local_level' => 'Changunarayan', 'local_level_type' => 'Municipality', 'ward_id' => 30],
      ['province' => 'Bagmati', 'district' => 'Bhaktapur', 'local_level' => 'Suryabinayak', 'local_level_type' => 'Municipality', 'ward_id' => 31],
      ['province' => 'Bagmati', 'district' => 'Bhaktapur', 'local_level' => 'Nagarkot', 'local_level_type' => 'Rural Municipality', 'ward_id' => 32],
      ['province' => 'Bagmati', 'district' => 'Chitwan', 'local_level' => 'Bharatpur', 'local_level_type' => 'Metropolitan City', 'ward_id' => 33],
      ['province' => 'Bagmati', 'district' => 'Chitwan', 'local_level' => 'Ratnanagar', 'local_level_type' => 'Municipality', 'ward_id' => 34],
      ['province' => 'Bagmati', 'district' => 'Chitwan', 'local_level' => 'Kalika', 'local_level_type' => 'Municipality', 'ward_id' => 35],
      ['province' => 'Bagmati', 'district' => 'Chitwan', 'local_level' => 'Ichchhakamana', 'local_level_type' => 'Rural Municipality', 'ward_id' => 36],
      ['province' => 'Bagmati', 'district' => 'Makwanpur', 'local_level' => 'Hetauda', 'local_level_type' => 'Sub-Metropolitan City', 'ward_id' => 37],
      ['province' => 'Bagmati', 'district' => 'Makwanpur', 'local_level' => 'Thaha', 'local_level_type' => 'Municipality', 'ward_id' => 38],
      ['province' => 'Bagmati', 'district' => 'Makwanpur', 'local_level' => 'Bakaiya', 'local_level_type' => 'Rural Municipality', 'ward_id' => 39],
      ['province' => 'Bagmati', 'district' => 'Nuwakot', 'local_level' => 'Bidur', 'local_level_type' => 'Municipality', 'ward_id' => 40],
      ['province' => 'Bagmati', 'district' => 'Nuwakot', 'local_level' => 'Belkotgadhi', 'local_level_type' => 'Municipality', 'ward_id' => 41],
      ['province' => 'Bagmati', 'district' => 'Nuwakot', 'local_level' => 'Kakani', 'local_level_type' => 'Rural Municipality', 'ward_id' => 42],

      // Province 4 - Gandaki Province
      ['province' => 'Gandaki', 'district' => 'Kaski', 'local_level' => 'Pokhara', 'local_level_type' => 'Metropolitan City', 'ward_id' => 43],
      ['province' => 'Gandaki', 'district' => 'Kaski', 'local_level' => 'Annapurna', 'local_level_type' => 'Rural Municipality', 'ward_id' => 44],
      ['province' => 'Gandaki', 'district' => 'Kaski', 'local_level' => 'Machhapuchchhre', 'local_level_type' => 'Rural Municipality', 'ward_id' => 45],
      ['province' => 'Gandaki', 'district' => 'Syangja', 'local_level' => 'Waling', 'local_level_type' => 'Municipality', 'ward_id' => 46],
      ['province' => 'Gandaki', 'district' => 'Syangja', 'local_level' => 'Putalibazar', 'local_level_type' => 'Municipality', 'ward_id' => 47],
      ['province' => 'Gandaki', 'district' => 'Syangja', 'local_level' => 'Aandhikhola', 'local_level_type' => 'Rural Municipality', 'ward_id' => 48],
      ['province' => 'Gandaki', 'district' => 'Lamjung', 'local_level' => 'Besisahar', 'local_level_type' => 'Municipality', 'ward_id' => 49],
      ['province' => 'Gandaki', 'district' => 'Lamjung', 'local_level' => 'Madhya Nepal', 'local_level_type' => 'Municipality', 'ward_id' => 50],
      ['province' => 'Gandaki', 'district' => 'Lamjung', 'local_level' => 'Dordi', 'local_level_type' => 'Rural Municipality', 'ward_id' => 51],
      ['province' => 'Gandaki', 'district' => 'Tanahun', 'local_level' => 'Damauli', 'local_level_type' => 'Municipality', 'ward_id' => 52],
      ['province' => 'Gandaki', 'district' => 'Tanahun', 'local_level' => 'Shuklagandaki', 'local_level_type' => 'Municipality', 'ward_id' => 53],
      ['province' => 'Gandaki', 'district' => 'Tanahun', 'local_level' => 'Bhimad', 'local_level_type' => 'Municipality', 'ward_id' => 54],

      // Province 5 - Lumbini Province
      ['province' => 'Lumbini', 'district' => 'Rupandehi', 'local_level' => 'Butwal', 'local_level_type' => 'Sub-Metropolitan City', 'ward_id' => 55],
      ['province' => 'Lumbini', 'district' => 'Rupandehi', 'local_level' => 'Siddharthanagar', 'local_level_type' => 'Municipality', 'ward_id' => 56],
      ['province' => 'Lumbini', 'district' => 'Rupandehi', 'local_level' => 'Lumbini Sanskritik', 'local_level_type' => 'Municipality', 'ward_id' => 57],
      ['province' => 'Lumbini', 'district' => 'Rupandehi', 'local_level' => 'Sammarimai', 'local_level_type' => 'Rural Municipality', 'ward_id' => 58],
      ['province' => 'Lumbini', 'district' => 'Kapilvastu', 'local_level' => 'Kapilvastu', 'local_level_type' => 'Municipality', 'ward_id' => 59],
      ['province' => 'Lumbini', 'district' => 'Kapilvastu', 'local_level' => 'Buddhabhumi', 'local_level_type' => 'Municipality', 'ward_id' => 60],
      ['province' => 'Lumbini', 'district' => 'Kapilvastu', 'local_level' => 'Yashodhara', 'local_level_type' => 'Rural Municipality', 'ward_id' => 61],
      ['province' => 'Lumbini', 'district' => 'Palpa', 'local_level' => 'Tansen', 'local_level_type' => 'Municipality', 'ward_id' => 62],
      ['province' => 'Lumbini', 'district' => 'Palpa', 'local_level' => 'Rampur', 'local_level_type' => 'Municipality', 'ward_id' => 63],
      ['province' => 'Lumbini', 'district' => 'Palpa', 'local_level' => 'Ribdikot', 'local_level_type' => 'Rural Municipality', 'ward_id' => 64],
      ['province' => 'Lumbini', 'district' => 'Gulmi', 'local_level' => 'Tamghas', 'local_level_type' => 'Municipality', 'ward_id' => 65],
      ['province' => 'Lumbini', 'district' => 'Gulmi', 'local_level' => 'Resunga', 'local_level_type' => 'Municipality', 'ward_id' => 66],

      // Province 6 - Karnali Province
      ['province' => 'Karnali', 'district' => 'Surkhet', 'local_level' => 'Birendranagar', 'local_level_type' => 'Sub-Metropolitan City', 'ward_id' => 67],
      ['province' => 'Karnali', 'district' => 'Surkhet', 'local_level' => 'Bheriganga', 'local_level_type' => 'Municipality', 'ward_id' => 68],
      ['province' => 'Karnali', 'district' => 'Surkhet', 'local_level' => 'Barahatal', 'local_level_type' => 'Rural Municipality', 'ward_id' => 69],
      ['province' => 'Karnali', 'district' => 'Jumla', 'local_level' => 'Chandannath', 'local_level_type' => 'Municipality', 'ward_id' => 70],
      ['province' => 'Karnali', 'district' => 'Jumla', 'local_level' => 'Tila', 'local_level_type' => 'Rural Municipality', 'ward_id' => 71],
      ['province' => 'Karnali', 'district' => 'Jumla', 'local_level' => 'Sinja', 'local_level_type' => 'Rural Municipality', 'ward_id' => 72],
      ['province' => 'Karnali', 'district' => 'Kalikot', 'local_level' => 'Manma', 'local_level_type' => 'Municipality', 'ward_id' => 73],
      ['province' => 'Karnali', 'district' => 'Kalikot', 'local_level' => 'Pachaljharana', 'local_level_type' => 'Rural Municipality', 'ward_id' => 74],
      ['province' => 'Karnali', 'district' => 'Dailekh', 'local_level' => 'Narayan', 'local_level_type' => 'Municipality', 'ward_id' => 75],
      ['province' => 'Karnali', 'district' => 'Dailekh', 'local_level' => 'Dullu', 'local_level_type' => 'Municipality', 'ward_id' => 76],

      // Province 7 - Sudurpashchim Province
      ['province' => 'Sudurpashchim', 'district' => 'Kailali', 'local_level' => 'Dhangadhi', 'local_level_type' => 'Sub-Metropolitan City', 'ward_id' => 77],
      ['province' => 'Sudurpashchim', 'district' => 'Kailali', 'local_level' => 'Tikapur', 'local_level_type' => 'Municipality', 'ward_id' => 78],
      ['province' => 'Sudurpashchim', 'district' => 'Kailali', 'local_level' => 'Bhajani', 'local_level_type' => 'Municipality', 'ward_id' => 79],
      ['province' => 'Sudurpashchim', 'district' => 'Kailali', 'local_level' => 'Godawari', 'local_level_type' => 'Rural Municipality', 'ward_id' => 80],
      ['province' => 'Sudurpashchim', 'district' => 'Kanchanpur', 'local_level' => 'Bhimdatta', 'local_level_type' => 'Municipality', 'ward_id' => 81],
      ['province' => 'Sudurpashchim', 'district' => 'Kanchanpur', 'local_level' => 'Krishnapur', 'local_level_type' => 'Municipality', 'ward_id' => 82],
      ['province' => 'Sudurpashchim', 'district' => 'Kanchanpur', 'local_level' => 'Belauri', 'local_level_type' => 'Municipality', 'ward_id' => 83],
      ['province' => 'Sudurpashchim', 'district' => 'Kanchanpur', 'local_level' => 'Laljhadi', 'local_level_type' => 'Rural Municipality', 'ward_id' => 84],
      ['province' => 'Sudurpashchim', 'district' => 'Doti', 'local_level' => 'Dipayal Silgadhi', 'local_level_type' => 'Municipality', 'ward_id' => 85],
      ['province' => 'Sudurpashchim', 'district' => 'Doti', 'local_level' => 'Shikhar', 'local_level_type' => 'Municipality', 'ward_id' => 86],
      ['province' => 'Sudurpashchim', 'district' => 'Doti', 'local_level' => 'Aadarsha', 'local_level_type' => 'Rural Municipality', 'ward_id' => 87],
      ['province' => 'Sudurpashchim', 'district' => 'Achham', 'local_level' => 'Mangalsen', 'local_level_type' => 'Municipality', 'ward_id' => 88],
      ['province' => 'Sudurpashchim', 'district' => 'Achham', 'local_level' => 'Kamalbazar', 'local_level_type' => 'Municipality', 'ward_id' => 89],
      ['province' => 'Sudurpashchim', 'district' => 'Achham', 'local_level' => 'Bannigadhi Jayagadh', 'local_level_type' => 'Rural Municipality', 'ward_id' => 90],
    ];

    // Insert locations and set ward_id to match id
    foreach ($locations as $index => $location) {
      $id = DB::table('locations')->insertGetId([
        'province' => $location['province'],
        'district' => $location['district'],
        'local_level' => $location['local_level'],
        'local_level_type' => $location['local_level_type'],
        'ward_id' => $location['ward_id'],
        'created_at' => now(),
        'updated_at' => now(),
      ]);

      // Update ward_id to match the actual id
      DB::table('locations')
        ->where('id', $id)
        ->update(['ward_id' => $id]);
    }
    }
}
