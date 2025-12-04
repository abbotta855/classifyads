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
      ['province' => 'Koshi', 'district' => 'Morang', 'local_level' => 'Biratnagar', 'local_level_type' => 'Metropolitan City'],
      ['province' => 'Koshi', 'district' => 'Morang', 'local_level' => 'Belbari', 'local_level_type' => 'Municipality'],
      ['province' => 'Koshi', 'district' => 'Morang', 'local_level' => 'Rangeli', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Koshi', 'district' => 'Sunsari', 'local_level' => 'Itahari', 'local_level_type' => 'Sub-Metropolitan City'],
      ['province' => 'Koshi', 'district' => 'Sunsari', 'local_level' => 'Dharan', 'local_level_type' => 'Sub-Metropolitan City'],
      ['province' => 'Koshi', 'district' => 'Sunsari', 'local_level' => 'Barahachhetra', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Koshi', 'district' => 'Jhapa', 'local_level' => 'Bhadrapur', 'local_level_type' => 'Municipality'],
      ['province' => 'Koshi', 'district' => 'Jhapa', 'local_level' => 'Mechinagar', 'local_level_type' => 'Municipality'],
      ['province' => 'Koshi', 'district' => 'Jhapa', 'local_level' => 'Kachankawal', 'local_level_type' => 'Rural Municipality'],

      // Province 2 - Madhesh Province
      ['province' => 'Madhesh', 'district' => 'Dhanusha', 'local_level' => 'Janakpur', 'local_level_type' => 'Sub-Metropolitan City'],
      ['province' => 'Madhesh', 'district' => 'Dhanusha', 'local_level' => 'Dhanusadham', 'local_level_type' => 'Municipality'],
      ['province' => 'Madhesh', 'district' => 'Dhanusha', 'local_level' => 'Bideha', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Madhesh', 'district' => 'Sarlahi', 'local_level' => 'Malangwa', 'local_level_type' => 'Municipality'],
      ['province' => 'Madhesh', 'district' => 'Sarlahi', 'local_level' => 'Barahathawa', 'local_level_type' => 'Municipality'],
      ['province' => 'Madhesh', 'district' => 'Sarlahi', 'local_level' => 'Haripur', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Madhesh', 'district' => 'Mahottari', 'local_level' => 'Jaleshwar', 'local_level_type' => 'Municipality'],
      ['province' => 'Madhesh', 'district' => 'Mahottari', 'local_level' => 'Bardibas', 'local_level_type' => 'Municipality'],

      // Province 3 - Bagmati Province
      ['province' => 'Bagmati', 'district' => 'Kathmandu', 'local_level' => 'Kathmandu', 'local_level_type' => 'Metropolitan City'],
      ['province' => 'Bagmati', 'district' => 'Kathmandu', 'local_level' => 'Lalitpur', 'local_level_type' => 'Metropolitan City'],
      ['province' => 'Bagmati', 'district' => 'Kathmandu', 'local_level' => 'Bhaktapur', 'local_level_type' => 'Sub-Metropolitan City'],
      ['province' => 'Bagmati', 'district' => 'Kathmandu', 'local_level' => 'Kirtipur', 'local_level_type' => 'Municipality'],
      ['province' => 'Bagmati', 'district' => 'Kathmandu', 'local_level' => 'Tokha', 'local_level_type' => 'Municipality'],
      ['province' => 'Bagmati', 'district' => 'Kathmandu', 'local_level' => 'Dakshinkali', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Bagmati', 'district' => 'Lalitpur', 'local_level' => 'Lalitpur', 'local_level_type' => 'Metropolitan City'],
      ['province' => 'Bagmati', 'district' => 'Lalitpur', 'local_level' => 'Godawari', 'local_level_type' => 'Municipality'],
      ['province' => 'Bagmati', 'district' => 'Lalitpur', 'local_level' => 'Mahalaxmi', 'local_level_type' => 'Municipality'],
      ['province' => 'Bagmati', 'district' => 'Lalitpur', 'local_level' => 'Bagmati', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Bagmati', 'district' => 'Bhaktapur', 'local_level' => 'Bhaktapur', 'local_level_type' => 'Sub-Metropolitan City'],
      ['province' => 'Bagmati', 'district' => 'Bhaktapur', 'local_level' => 'Madhyapur Thimi', 'local_level_type' => 'Municipality'],
      ['province' => 'Bagmati', 'district' => 'Bhaktapur', 'local_level' => 'Changunarayan', 'local_level_type' => 'Municipality'],
      ['province' => 'Bagmati', 'district' => 'Bhaktapur', 'local_level' => 'Suryabinayak', 'local_level_type' => 'Municipality'],
      ['province' => 'Bagmati', 'district' => 'Bhaktapur', 'local_level' => 'Nagarkot', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Bagmati', 'district' => 'Chitwan', 'local_level' => 'Bharatpur', 'local_level_type' => 'Metropolitan City'],
      ['province' => 'Bagmati', 'district' => 'Chitwan', 'local_level' => 'Ratnanagar', 'local_level_type' => 'Municipality'],
      ['province' => 'Bagmati', 'district' => 'Chitwan', 'local_level' => 'Kalika', 'local_level_type' => 'Municipality'],
      ['province' => 'Bagmati', 'district' => 'Chitwan', 'local_level' => 'Ichchhakamana', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Bagmati', 'district' => 'Makwanpur', 'local_level' => 'Hetauda', 'local_level_type' => 'Sub-Metropolitan City'],
      ['province' => 'Bagmati', 'district' => 'Makwanpur', 'local_level' => 'Thaha', 'local_level_type' => 'Municipality'],
      ['province' => 'Bagmati', 'district' => 'Makwanpur', 'local_level' => 'Bakaiya', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Bagmati', 'district' => 'Nuwakot', 'local_level' => 'Bidur', 'local_level_type' => 'Municipality'],
      ['province' => 'Bagmati', 'district' => 'Nuwakot', 'local_level' => 'Belkotgadhi', 'local_level_type' => 'Municipality'],
      ['province' => 'Bagmati', 'district' => 'Nuwakot', 'local_level' => 'Kakani', 'local_level_type' => 'Rural Municipality'],

      // Province 4 - Gandaki Province
      ['province' => 'Gandaki', 'district' => 'Kaski', 'local_level' => 'Pokhara', 'local_level_type' => 'Metropolitan City'],
      ['province' => 'Gandaki', 'district' => 'Kaski', 'local_level' => 'Annapurna', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Gandaki', 'district' => 'Kaski', 'local_level' => 'Machhapuchchhre', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Gandaki', 'district' => 'Syangja', 'local_level' => 'Waling', 'local_level_type' => 'Municipality'],
      ['province' => 'Gandaki', 'district' => 'Syangja', 'local_level' => 'Putalibazar', 'local_level_type' => 'Municipality'],
      ['province' => 'Gandaki', 'district' => 'Syangja', 'local_level' => 'Aandhikhola', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Gandaki', 'district' => 'Lamjung', 'local_level' => 'Besisahar', 'local_level_type' => 'Municipality'],
      ['province' => 'Gandaki', 'district' => 'Lamjung', 'local_level' => 'Madhya Nepal', 'local_level_type' => 'Municipality'],
      ['province' => 'Gandaki', 'district' => 'Lamjung', 'local_level' => 'Dordi', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Gandaki', 'district' => 'Tanahun', 'local_level' => 'Damauli', 'local_level_type' => 'Municipality'],
      ['province' => 'Gandaki', 'district' => 'Tanahun', 'local_level' => 'Shuklagandaki', 'local_level_type' => 'Municipality'],
      ['province' => 'Gandaki', 'district' => 'Tanahun', 'local_level' => 'Bhimad', 'local_level_type' => 'Municipality'],

      // Province 5 - Lumbini Province
      ['province' => 'Lumbini', 'district' => 'Rupandehi', 'local_level' => 'Butwal', 'local_level_type' => 'Sub-Metropolitan City'],
      ['province' => 'Lumbini', 'district' => 'Rupandehi', 'local_level' => 'Siddharthanagar', 'local_level_type' => 'Municipality'],
      ['province' => 'Lumbini', 'district' => 'Rupandehi', 'local_level' => 'Lumbini Sanskritik', 'local_level_type' => 'Municipality'],
      ['province' => 'Lumbini', 'district' => 'Rupandehi', 'local_level' => 'Sammarimai', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Lumbini', 'district' => 'Kapilvastu', 'local_level' => 'Kapilvastu', 'local_level_type' => 'Municipality'],
      ['province' => 'Lumbini', 'district' => 'Kapilvastu', 'local_level' => 'Buddhabhumi', 'local_level_type' => 'Municipality'],
      ['province' => 'Lumbini', 'district' => 'Kapilvastu', 'local_level' => 'Yashodhara', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Lumbini', 'district' => 'Palpa', 'local_level' => 'Tansen', 'local_level_type' => 'Municipality'],
      ['province' => 'Lumbini', 'district' => 'Palpa', 'local_level' => 'Rampur', 'local_level_type' => 'Municipality'],
      ['province' => 'Lumbini', 'district' => 'Palpa', 'local_level' => 'Ribdikot', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Lumbini', 'district' => 'Gulmi', 'local_level' => 'Tamghas', 'local_level_type' => 'Municipality'],
      ['province' => 'Lumbini', 'district' => 'Gulmi', 'local_level' => 'Resunga', 'local_level_type' => 'Municipality'],

      // Province 6 - Karnali Province
      ['province' => 'Karnali', 'district' => 'Surkhet', 'local_level' => 'Birendranagar', 'local_level_type' => 'Sub-Metropolitan City'],
      ['province' => 'Karnali', 'district' => 'Surkhet', 'local_level' => 'Bheriganga', 'local_level_type' => 'Municipality'],
      ['province' => 'Karnali', 'district' => 'Surkhet', 'local_level' => 'Barahatal', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Karnali', 'district' => 'Jumla', 'local_level' => 'Chandannath', 'local_level_type' => 'Municipality'],
      ['province' => 'Karnali', 'district' => 'Jumla', 'local_level' => 'Tila', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Karnali', 'district' => 'Jumla', 'local_level' => 'Sinja', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Karnali', 'district' => 'Kalikot', 'local_level' => 'Manma', 'local_level_type' => 'Municipality'],
      ['province' => 'Karnali', 'district' => 'Kalikot', 'local_level' => 'Pachaljharana', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Karnali', 'district' => 'Dailekh', 'local_level' => 'Narayan', 'local_level_type' => 'Municipality'],
      ['province' => 'Karnali', 'district' => 'Dailekh', 'local_level' => 'Dullu', 'local_level_type' => 'Municipality'],

      // Province 7 - Sudurpashchim Province
      ['province' => 'Sudurpashchim', 'district' => 'Kailali', 'local_level' => 'Dhangadhi', 'local_level_type' => 'Sub-Metropolitan City'],
      ['province' => 'Sudurpashchim', 'district' => 'Kailali', 'local_level' => 'Tikapur', 'local_level_type' => 'Municipality'],
      ['province' => 'Sudurpashchim', 'district' => 'Kailali', 'local_level' => 'Bhajani', 'local_level_type' => 'Municipality'],
      ['province' => 'Sudurpashchim', 'district' => 'Kailali', 'local_level' => 'Godawari', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Sudurpashchim', 'district' => 'Kanchanpur', 'local_level' => 'Bhimdatta', 'local_level_type' => 'Municipality'],
      ['province' => 'Sudurpashchim', 'district' => 'Kanchanpur', 'local_level' => 'Krishnapur', 'local_level_type' => 'Municipality'],
      ['province' => 'Sudurpashchim', 'district' => 'Kanchanpur', 'local_level' => 'Belauri', 'local_level_type' => 'Municipality'],
      ['province' => 'Sudurpashchim', 'district' => 'Kanchanpur', 'local_level' => 'Laljhadi', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Sudurpashchim', 'district' => 'Doti', 'local_level' => 'Dipayal Silgadhi', 'local_level_type' => 'Municipality'],
      ['province' => 'Sudurpashchim', 'district' => 'Doti', 'local_level' => 'Shikhar', 'local_level_type' => 'Municipality'],
      ['province' => 'Sudurpashchim', 'district' => 'Doti', 'local_level' => 'Aadarsha', 'local_level_type' => 'Rural Municipality'],
      ['province' => 'Sudurpashchim', 'district' => 'Achham', 'local_level' => 'Mangalsen', 'local_level_type' => 'Municipality'],
      ['province' => 'Sudurpashchim', 'district' => 'Achham', 'local_level' => 'Kamalbazar', 'local_level_type' => 'Municipality'],
      ['province' => 'Sudurpashchim', 'district' => 'Achham', 'local_level' => 'Bannigadhi Jayagadh', 'local_level_type' => 'Rural Municipality'],
    ];

    // Generate local address names
    $localAddressNames = [
      'Main Street', 'Park Avenue', 'Central Plaza', 'Market Square', 'City Center',
      'River Road', 'Hill View', 'Green Valley', 'Sunset Boulevard', 'Oak Street',
      'Maple Drive', 'Cedar Lane', 'Pine Avenue', 'Elm Street', 'Birch Road',
      'Willow Way', 'Cherry Lane', 'Rose Garden', 'Lily Street', 'Tulip Avenue',
      'Garden Path', 'Meadow Lane', 'Forest Road', 'Lake View', 'Mountain Drive',
      'Valley Road', 'Highland Avenue', 'Riverside Drive', 'Lakeside Road', 'Seaside Avenue',
      'Downtown Plaza', 'Uptown Square', 'Business District', 'Residential Area', 'Commercial Zone',
      'Shopping Center', 'Community Hall', 'School Street', 'Hospital Road', 'Library Lane',
      'Temple Street', 'Church Road', 'Mosque Avenue', 'Stadium Road', 'Park Lane'
    ];

    // Insert locations with wards and local addresses
    foreach ($locations as $location) {
      // Determine number of wards based on local_level_type
      $wardCount = 0;
      if ($location['local_level_type'] === 'Metropolitan City' || $location['local_level_type'] === 'Sub-Metropolitan City') {
        $wardCount = 40;
      } elseif ($location['local_level_type'] === 'Municipality') {
        $wardCount = 25;
      } elseif ($location['local_level_type'] === 'Rural Municipality') {
        $wardCount = 15;
      }

      // Create a ward for each local_level
      for ($ward = 1; $ward <= $wardCount; $ward++) {
        // Generate 5 random local addresses for this ward
        $selectedAddresses = [];
        $availableAddresses = $localAddressNames;
        
        for ($i = 0; $i < 5; $i++) {
          if (empty($availableAddresses)) {
            // If we run out of unique addresses, add a number to make it unique
            $selectedAddresses[] = 'Local Area ' . ($i + 1);
          } else {
            $randomIndex = array_rand($availableAddresses);
            $selectedAddresses[] = $availableAddresses[$randomIndex];
            unset($availableAddresses[$randomIndex]);
            $availableAddresses = array_values($availableAddresses); // Re-index array
          }
        }
        
        // Join addresses with comma and space
        $localAddress = implode(', ', $selectedAddresses);

      DB::table('locations')->insert([
        'province' => $location['province'],
        'district' => $location['district'],
        'local_level' => $location['local_level'],
        'local_level_type' => $location['local_level_type'],
          'ward_number' => $ward,
          'local_address' => $localAddress,
        'created_at' => now(),
        'updated_at' => now(),
      ]);
      }
    }
    }
}
