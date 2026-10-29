<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $agencies = [
            ['Pemkot Salatiga', 'Pemerintah Kota', 'Salatiga'],
            ['Pemkot Semarang', 'Pemerintah Kota', 'Semarang'],
            ['Pemkab Semarang', 'Pemerintah Kabupaten', 'Semarang'],
            ['Pemkab Kendal', 'Pemerintah Kabupaten', 'Kendal'],
            ['Pemkab Batang', 'Pemerintah Kabupaten', 'Batang'],
            ['Pemkab Pekalongan', 'Pemerintah Kabupaten', 'Pekalongan'],
            ['Pemkot Pekalongan', 'Pemerintah Kota', 'Pekalongan'],
            ['Pemkab Pemalang', 'Pemerintah Kabupaten', 'Pemalang'],
            ['Pemkot Tegal', 'Pemerintah Kota', 'Tegal'],
            ['Pemkab Tegal', 'Pemerintah Kabupaten', 'Tegal'],
            ['Pemkab Brebes', 'Pemerintah Kabupaten', 'Brebes'],
            ['Provinsi Jawa Tengah', 'Pemerintah Provinsi', 'Semarang'],
            ['Polda Jawa Tengah', 'Kepolisian Daerah', 'Semarang'],
        ];

        foreach ($agencies as [$name, $type, $region]) {
            DB::table('government_agencies')->updateOrInsert(
                ['name' => $name],
                ['agency_type' => $type, 'region' => $region],
            );
        }

        $email = trim((string) env('ADMIN_EMAIL'));
        $name = trim((string) env('ADMIN_NAME', 'Admin Support B2G'));
        $password = (string) env('ADMIN_PASSWORD');

        if ($email !== '' && $password !== '') {
            DB::table('global_admin')->updateOrInsert(
                ['singleton' => true],
                [
                    'email' => strtolower($email),
                    'display_name' => $name,
                    'password_hash' => Hash::make($password),
                    'updated_at' => now(),
                ],
            );
        }
    }
}
