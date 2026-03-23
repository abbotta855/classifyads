<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Checks public DNS for Hostinger mail (MX, SPF, DKIM, DMARC).
 * Run on the same network as production if possible; uses PHP's DNS resolver.
 */
class VerifyMailDns extends Command
{
    protected $signature = 'mail:verify-dns
                            {domain? : Root domain, e.g. ebyapar.com (default: MAIL_EHLO_DOMAIN or APP_URL host)}';

    protected $description = 'Verify MX, SPF, DKIM, and DMARC DNS records for Hostinger SMTP mail';

    public function handle(): int
    {
        $domain = $this->argument('domain');
        if (! $domain) {
            $domain = config('mail.mailers.smtp.local_domain')
                ?: parse_url((string) config('app.url'), PHP_URL_HOST)
                ?: null;
        }
        if (! $domain || str_contains($domain, 'localhost')) {
            $this->error('Could not determine domain. Pass explicitly: php artisan mail:verify-dns ebyapar.com');

            return self::FAILURE;
        }

        $domain = strtolower(trim($domain));
        $this->info("Checking DNS for: {$domain}");
        $this->newLine();

        $ok = true;

        $ok = $this->checkMx($domain) && $ok;
        $ok = $this->checkSpf($domain) && $ok;
        $ok = $this->checkDkim($domain) && $ok;
        $ok = $this->checkDmarc($domain) && $ok;

        $this->newLine();
        if ($ok) {
            $this->info('All checks passed. If Hostinger still shows "missing records", use hPanel → Fix this and add any extra TXT/CNAME they list, then wait for TTL/propagation.');

            return self::SUCCESS;
        }

        $this->warn('Some checks failed. Fix Cloudflare (or your DNS) to match Hostinger’s Email → DNS / wizard, then re-run this command.');

        return self::FAILURE;
    }

    private function checkMx(string $domain): bool
    {
        $this->line('<fg=cyan>MX records</>');
        $records = @dns_get_record($domain, DNS_MX);
        if ($records === false || $records === []) {
            $this->error('  No MX records found.');

            return false;
        }

        $hosts = [];
        foreach ($records as $r) {
            if (isset($r['target'])) {
                $hosts[] = strtolower(rtrim($r['target'], '.'));
            }
        }

        $has1 = in_array('mx1.hostinger.com', $hosts, true);
        $has2 = in_array('mx2.hostinger.com', $hosts, true);

        foreach ($hosts as $h) {
            $this->line('  '.$h);
        }

        if ($has1 && $has2) {
            $this->info('  OK: mx1 + mx2.hostinger.com');

            return true;
        }

        $this->error('  Expected mx1.hostinger.com (prio 5) and mx2.hostinger.com (prio 10).');

        return false;
    }

    private function checkSpf(string $domain): bool
    {
        $this->line('<fg=cyan>SPF (TXT at root)</>');
        $records = @dns_get_record($domain, DNS_TXT);
        if ($records === false) {
            $records = [];
        }

        $spfStrings = [];
        foreach ($records as $r) {
            $txt = $r['txt'] ?? '';
            if (stripos($txt, 'v=spf1') !== false) {
                $spfStrings[] = $txt;
            }
        }

        if ($spfStrings === []) {
            $this->error('  No SPF (v=spf1) TXT record found on '.$domain);

            return false;
        }

        if (count($spfStrings) > 1) {
            $this->warn('  Multiple SPF TXT records found — receivers may reject mail. Keep only one SPF.');
            $ok = false;
        } else {
            $ok = true;
        }

        foreach ($spfStrings as $s) {
            $this->line('  '.$s);
        }

        $combined = implode(' ', $spfStrings);
        if (str_contains($combined, '_spf.mail.hostinger.com')) {
            $this->info('  OK: includes Hostinger SPF');

            return $ok;
        }

        $this->error('  Expected include:_spf.mail.hostinger.com in SPF');

        return false;
    }

    private function checkDkim(string $domain): bool
    {
        $this->line('<fg=cyan>DKIM (CNAME × 3)</>');
        $labels = ['hostingermail-a', 'hostingermail-b', 'hostingermail-c'];
        $allOk = true;

        foreach ($labels as $label) {
            $name = $label.'._domainkey.'.$domain;
            $records = @dns_get_record($name, DNS_CNAME);
            if ($records === false) {
                $records = [];
            }
            $target = null;
            foreach ($records as $r) {
                if (! empty($r['target'])) {
                    $target = strtolower(rtrim($r['target'], '.'));
                    break;
                }
            }

            if ($target && str_contains($target, 'dkim.mail.hostinger.com')) {
                $this->info("  OK: {$name} → {$target}");
            } else {
                $this->error("  Missing or wrong CNAME for {$name} (expected *.dkim.mail.hostinger.com)");
                $allOk = false;
            }
        }

        return $allOk;
    }

    private function checkDmarc(string $domain): bool
    {
        $this->line('<fg=cyan>DMARC (_dmarc)</>');
        $name = '_dmarc.'.$domain;
        $records = @dns_get_record($name, DNS_TXT);
        if ($records === false) {
            $records = [];
        }

        foreach ($records as $r) {
            $txt = $r['txt'] ?? '';
            if (stripos($txt, 'v=DMARC1') !== false) {
                $this->line('  '.$txt);
                $this->info('  OK: DMARC present');

                return true;
            }
        }

        $this->warn('  No DMARC TXT (optional but recommended). Add _dmarc with v=DMARC1; p=none or quarantine');

        return true;
    }
}
