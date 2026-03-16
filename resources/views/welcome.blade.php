<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Classified advertising in Nepal | Ebyapar.com</title>
        <meta name="description" content="Classified advertising in Nepal to post hassle-free ad on various categories such as sale vehicle, house, land, tools etc. Ebyapar.com is as online community to buy & sale new and used items online to connect with potential buyer of large community.">
        <meta name="keywords" content="classified ad post Nepal, online advertising Nepal, ad post online Nepal, classified advertising">
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="Classified advertising in Nepal">
        <meta property="og:description" content="Classified advertising in Nepal to post hassle-free ad on various categories such as sale vehicle, house, land, tools etc. Ebyapar.com is as online community to buy & sale new and used items online to connect with potential buyer of large community.">
        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="Classified advertising in Nepal">
        <meta name="twitter:description" content="Classified advertising in Nepal to post hassle-free ad on various categories such as sale vehicle, house, land, tools etc. Ebyapar.com is as online community to buy & sale new and used items online to connect with potential buyer of large community.">
        @php
            $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true);
            $appJs = $manifest['resources/js/app.jsx']['file'] ?? null;
            $appCss = $manifest['resources/css/app.css']['file'] ?? null;
            $cssFiles = $manifest['resources/js/app.jsx']['css'] ?? [];
            $siteUrl = url('/');
        @endphp
        <!-- Schema.org structured data -->
        <script type="application/ld+json">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            'name' => 'Classified advertising in Nepal',
            'description' => 'Classified advertising in Nepal to post hassle-free ad on various categories such as sale vehicle, house, land, tools etc. Ebyapar.com is as online community to buy & sale new and used items online to connect with potential buyer of large community.',
            'url' => $siteUrl,
        ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) !!}
        </script>
        @if($appCss)
            <link rel="stylesheet" href="{{ asset('build/' . $appCss) }}">
        @endif
        @foreach($cssFiles as $cssFile)
            <link rel="stylesheet" href="{{ asset('build/' . $cssFile) }}">
        @endforeach
        @if($appJs)
            <script type="module" src="{{ asset('build/' . $appJs) }}"></script>
        @else
            @viteReactRefresh
            @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @endif
    </head>
    <body class="min-h-screen bg-[hsl(var(--background))]">
        <div id="app"></div>
        <script>
            // Prevent flash of wrong theme by applying theme immediately
            (function() {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const shouldBeDark = theme === 'dark' || (!theme && prefersDark);
                if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                }
            })();
        </script>
    </body>
</html>
