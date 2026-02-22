<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StaticPage;

class StaticPageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pages = [
            [
                'slug' => 'terms',
                'title' => 'Terms of Service',
                'content' => '<h2>Terms of Service</h2>
<p>Welcome to Shushil12. By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>

<h3>1. Use License</h3>
<p>Permission is granted to temporarily download one copy of the materials on Shushil12\'s website for personal, non-commercial transitory viewing only.</p>

<h3>2. Disclaimer</h3>
<p>The materials on Shushil12\'s website are provided on an \'as is\' basis. Shushil12 makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

<h3>3. Limitations</h3>
<p>In no event shall Shushil12 or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Shushil12\'s website.</p>

<h3>4. Revisions</h3>
<p>Shushil12 may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>

<h3>5. Contact Information</h3>
<p>If you have any questions about these Terms of Service, please contact us through our contact page.</p>',
                'is_active' => true,
            ],
            [
                'slug' => 'faq',
                'title' => 'Frequently Asked Questions',
                'content' => '<h2>Frequently Asked Questions</h2>

<h3>General Questions</h3>

<h4>What is Shushil12?</h4>
<p>Shushil12 is a comprehensive marketplace platform for Nepal, offering classified ads, eBooks, auctions, and Nepali products.</p>

<h4>How do I create an account?</h4>
<p>Click on the "Sign up" button in the header, fill in your details, verify your email, and you\'re ready to go!</p>

<h4>Is it free to post ads?</h4>
<p>Basic ad posting is free. Premium features may require payment. Check our pricing page for details.</p>

<h3>Posting Ads</h3>

<h4>How do I post an ad?</h4>
<p>After logging in, click on "Post Ad" button, fill in the details, upload images, and submit. Your ad will be reviewed before going live.</p>

<h4>How many images can I upload?</h4>
<p>You can upload up to 4 images per ad.</p>

<h4>Can I edit my ad after posting?</h4>
<p>Yes, you can edit your ads from your dashboard. Go to "My Ads" section to manage your listings.</p>

<h3>Auctions</h3>

<h4>How do auctions work?</h4>
<p>Auctions allow sellers to list items with a starting price. Buyers can place bids, and the highest bidder wins when the auction ends.</p>

<h4>Can I cancel a bid?</h4>
<p>Yes, you can cancel your bid before the auction ends, subject to our auction policies.</p>

<h3>eBooks</h3>

<h4>How do I purchase an eBook?</h4>
<p>Browse our eBook collection, select a book, and click "Buy Now". Complete the payment process to download your eBook.</p>

<h4>What formats are available?</h4>
<p>eBooks are available in PDF format. More formats may be added in the future.</p>

<h3>Contact & Support</h3>

<h4>How can I contact support?</h4>
<p>You can reach us through our Contact Us page or use the live chat feature when available.</p>

<h4>What are your business hours?</h4>
<p>Our support team is available during business hours. Check the live chat widget for current availability.</p>',
                'is_active' => true,
            ],
            [
                'slug' => 'privacy-policy',
                'title' => 'Privacy Policy',
                'content' => '<h2>Privacy Policy</h2>
<p>Last updated: ' . date('F d, Y') . '</p>

<p>Shushil12 ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p>

<h3>1. Information We Collect</h3>

<h4>Personal Information</h4>
<p>We may collect personal information that you voluntarily provide to us when you:</p>
<ul>
    <li>Register for an account</li>
    <li>Post advertisements</li>
    <li>Make purchases</li>
    <li>Contact us</li>
    <li>Subscribe to our newsletter</li>
</ul>

<h4>Automatically Collected Information</h4>
<p>We may automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.</p>

<h3>2. How We Use Your Information</h3>
<p>We use the information we collect to:</p>
<ul>
    <li>Provide, maintain, and improve our services</li>
    <li>Process transactions and send related information</li>
    <li>Send you technical notices and support messages</li>
    <li>Respond to your comments and questions</li>
    <li>Monitor and analyze trends and usage</li>
    <li>Detect, prevent, and address technical issues</li>
</ul>

<h3>3. Information Sharing and Disclosure</h3>
<p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
<ul>
    <li>With your consent</li>
    <li>To comply with legal obligations</li>
    <li>To protect our rights and safety</li>
    <li>With service providers who assist us in operating our website</li>
</ul>

<h3>4. Data Security</h3>
<p>We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>

<h3>5. Your Rights</h3>
<p>You have the right to:</p>
<ul>
    <li>Access your personal information</li>
    <li>Correct inaccurate data</li>
    <li>Request deletion of your data</li>
    <li>Opt-out of marketing communications</li>
</ul>

<h3>6. Cookies</h3>
<p>We use cookies to enhance your experience. You can set your browser to refuse cookies, but this may limit some functionality.</p>

<h3>7. Changes to This Privacy Policy</h3>
<p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

<h3>8. Contact Us</h3>
<p>If you have questions about this Privacy Policy, please contact us through our Contact Us page.</p>',
                'is_active' => true,
            ],
            [
                'slug' => 'cookie-policy',
                'title' => 'Cookie Policy',
                'content' => '<h2>Cookie Policy</h2>
<p>Last updated: ' . date('F d, Y') . '</p>

<p>This Cookie Policy explains how Shushil12 ("we", "our", or "us") uses cookies and similar technologies when you visit our website.</p>

<h3>What Are Cookies?</h3>
<p>Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.</p>

<h3>How We Use Cookies</h3>

<h4>Essential Cookies</h4>
<p>These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas of the website.</p>

<h4>Functionality Cookies</h4>
<p>These cookies allow the website to remember choices you make (such as your language preference) and provide enhanced, personalized features.</p>

<h4>Analytics Cookies</h4>
<p>These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>

<h4>Advertising Cookies</h4>
<p>These cookies are used to deliver advertisements that are relevant to you and your interests. They also help measure the effectiveness of advertising campaigns.</p>

<h3>Third-Party Cookies</h3>
<p>We may also use third-party cookies from trusted partners for analytics and advertising purposes.</p>

<h3>Managing Cookies</h3>
<p>You can control and manage cookies in various ways. Please keep in mind that removing or blocking cookies can impact your user experience and parts of our website may no longer be fully accessible.</p>

<h4>Browser Settings</h4>
<p>Most browsers allow you to refuse or accept cookies. You can usually find these settings in the "Options" or "Preferences" menu of your browser.</p>

<h3>Changes to This Cookie Policy</h3>
<p>We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page.</p>

<h3>Contact Us</h3>
<p>If you have questions about our use of cookies, please contact us through our Contact Us page.</p>',
                'is_active' => true,
            ],
            [
                'slug' => 'about',
                'title' => 'About Us',
                'content' => '<h2>About Shushil12</h2>

<p>Shushil12 is Nepal\'s premier online marketplace, connecting buyers and sellers across the country. We provide a comprehensive platform for classified advertisements, digital products, auctions, and local business promotion.</p>

<h3>Our Mission</h3>
<p>To create a trusted, user-friendly platform that empowers Nepali businesses and individuals to buy, sell, and connect online.</p>

<h3>What We Offer</h3>

<h4>Classified Ads</h4>
<p>Post and browse classified advertisements across various categories including vehicles, property, electronics, jobs, and more.</p>

<h4>eBooks</h4>
<p>Discover and purchase digital books from Nepali authors and publishers. Support local literature and expand your digital library.</p>

<h4>Auctions</h4>
<p>Participate in exciting online auctions. Bid on unique items and find great deals from sellers across Nepal.</p>

<h4>Nepali Products</h4>
<p>Promote and discover authentic Nepali-made products. Support local businesses and find unique items made in Nepal.</p>

<h4>Community Forum</h4>
<p>Join discussions, ask questions, and connect with the community through our online forum.</p>

<h3>Why Choose Shushil12?</h3>
<ul>
    <li><strong>Trusted Platform:</strong> Secure transactions and verified sellers</li>
    <li><strong>User-Friendly:</strong> Easy to use interface in English and Nepali</li>
    <li><strong>Comprehensive:</strong> Everything you need in one place</li>
    <li><strong>Local Focus:</strong> Built for Nepal, by Nepalis</li>
    <li><strong>24/7 Support:</strong> We\'re here to help whenever you need us</li>
</ul>

<h3>Our Values</h3>
<p>We believe in:</p>
<ul>
    <li>Transparency and honesty</li>
    <li>User privacy and data security</li>
    <li>Supporting local businesses</li>
    <li>Continuous improvement</li>
    <li>Community building</li>
</ul>

<h3>Contact Us</h3>
<p>Have questions or feedback? We\'d love to hear from you! Visit our <a href="/contact">Contact Us</a> page to get in touch.</p>

<p><strong>Thank you for being part of the Shushil12 community!</strong></p>',
                'is_active' => true,
            ],
        ];

        foreach ($pages as $pageData) {
            StaticPage::updateOrCreate(
                ['slug' => $pageData['slug']],
                $pageData
            );
        }
    }
}
