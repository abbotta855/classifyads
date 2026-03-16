<?php

namespace App\Mail;

use App\Models\Auction;
use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AuctionPaymentConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public $auction;
    public $transaction;
    public $isBuyer;

    /**
     * Create a new message instance.
     */
    public function __construct(Auction $auction, Transaction $transaction, bool $isBuyer = true)
    {
        $this->auction = $auction;
        $this->transaction = $transaction;
        $this->isBuyer = $isBuyer;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->isBuyer 
            ? 'Payment Confirmation - Auction Purchase'
            : 'Payment Received - Auction Sale';
            
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
            view: 'emails.auction-payment-confirmation',
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
