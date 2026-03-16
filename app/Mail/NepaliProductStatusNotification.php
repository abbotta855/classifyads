<?php

namespace App\Mail;

use App\Models\NepaliProduct;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NepaliProductStatusNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $product;
    public $status;
    public $reason;

    /**
     * Create a new message instance.
     */
    public function __construct(NepaliProduct $product, string $status, string $reason = null)
    {
        $this->product = $product;
        $this->status = $status;
        $this->reason = $reason;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->status === 'approved'
            ? 'Your Nepali Product Has Been Approved!'
            : 'Update on Your Nepali Product Submission';

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.nepali-product-status',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}

