<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="icon" type="image/svg+xml" href="{{ asset('favicon.svg') }}">
        <meta name="description" content="B2G Project &amp; Contract Management Dashboard — Telkom Indonesia, Witel Jateng Utara. Kelola pengadaan pemerintah, pipeline proyek, dan dokumen audit dalam satu platform.">
        <meta name="keywords" content="B2G, Telkom Indonesia, pengadaan pemerintah, SiRUP, kontrak, manajemen proyek">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <title>B2Gov Portal — Telkom Indonesia | Manajemen Proyek Pemerintah</title>
        <meta name="csrf-token" content="{{ csrf_token() }}">
        @inertiaHead
        @viteReactRefresh
        @vite('src/main.tsx')
    </head>
    <body>
        @inertia
    </body>
</html>
