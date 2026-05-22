/// Kano Rails — Payment object.
/// Created per transaction. Tier snapshot is locked at creation.
/// Holds USDC (Coin<USDC>) until settled, then releases to receiver.
module kano_rails::payment;

use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::event;
use kano_rails::reputation::{Self, ReputationObject};

// === USDC marker ===
// In production, this would be the canonical USDC type on Sui.
// For the hackathon scaffold, declare a placeholder coin type elsewhere.

// === Statuses ===

const STATUS_PENDING: u8 = 0;
const STATUS_SETTLED: u8 = 1;
const STATUS_DISPUTED: u8 = 2;
#[allow(unused_const)]
const STATUS_CANCELLED: u8 = 3;

// === Constants ===

const DISPUTE_WINDOW_MS: u64 = 172_800_000; // 48h
#[allow(unused_const)]
const ATTESTATION_COOLDOWN_MS: u64 = 604_800_000; // 7d per client per freelancer; enforced via off-chain index in V1

// === Errors ===

const EAlreadySettled: u64 = 0;
const EWrongAmount: u64 = 1;
#[allow(unused_const)]
const ENotReceiver: u64 = 2;
const ENotSender: u64 = 3;
const EDisputeWindowClosed: u64 = 4;
const ESelfPay: u64 = 5;

// === Payment object ===

public struct PaymentObject<phantom USDC> has key {
    id: UID,
    sender: address,           // @0x0 until paid
    receiver: address,         // freelancer
    amount_usdc_cents: u64,
    deadline_ms: u64,
    status: u8,
    tier_at_creation: u8,
    fee_bps: u64,
    gas_sponsored: bool,
    created_at_ms: u64,
    settled_at_ms: u64,
    dispute_window_closes_at_ms: u64,
    attestation_given: bool,
}

// === Events ===

public struct PaymentCreated has copy, drop {
    payment_id: ID,
    receiver: address,
    amount: u64,
    tier: u8,
    fee_bps: u64,
}

public struct PaymentSettled has copy, drop {
    payment_id: ID,
    sender: address,
    receiver: address,
    amount: u64,
    fee: u64,
}

public struct AttestationGiven has copy, drop {
    payment_id: ID,
    client: address,
    receiver: address,
}

// === Entry: create a payment request (freelancer) ===

public fun create<USDC>(
    rep: &ReputationObject,
    amount_usdc_cents: u64,
    deadline_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let tier = reputation::tier(rep);
    let fee_bps = reputation::fee_bps_for_tier(tier);
    let now = clock.timestamp_ms();
    let id = object::new(ctx);
    let payment_id = id.to_inner();

    let payment = PaymentObject<USDC> {
        id,
        sender: @0x0,
        receiver: reputation::owner(rep),
        amount_usdc_cents,
        deadline_ms,
        status: STATUS_PENDING,
        tier_at_creation: tier,
        fee_bps,
        gas_sponsored: tier > 0,
        created_at_ms: now,
        settled_at_ms: 0,
        dispute_window_closes_at_ms: 0,
        attestation_given: false,
    };

    event::emit(PaymentCreated {
        payment_id,
        receiver: payment.receiver,
        amount: amount_usdc_cents,
        tier,
        fee_bps,
    });

    // Shared object so the client (any address) can pay into it.
    transfer::share_object(payment);
}

// === Entry: client pays ===

public fun pay<USDC>(
    payment: &mut PaymentObject<USDC>,
    payment_coin: Coin<USDC>,
    rep: &mut ReputationObject,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(payment.status == STATUS_PENDING, EAlreadySettled);
    assert!(coin::value(&payment_coin) == payment.amount_usdc_cents, EWrongAmount);
    assert!(ctx.sender() != payment.receiver, ESelfPay);

    payment.sender = ctx.sender();
    payment.status = STATUS_SETTLED;
    payment.settled_at_ms = clock.timestamp_ms();
    payment.dispute_window_closes_at_ms = clock.timestamp_ms() + DISPUTE_WINDOW_MS;

    // Release immediately on-chain. Settlement is instant.
    // Offramp queue priority is enforced off-chain at the Yellow Card integration.
    let fee = (payment.amount_usdc_cents * payment.fee_bps) / 10000;
    // Fee routing omitted in scaffold; production splits the coin to a treasury.
    let _ = fee;
    transfer::public_transfer(payment_coin, payment.receiver);

    reputation::record_settled_payment(rep, payment.amount_usdc_cents, clock);

    event::emit(PaymentSettled {
        payment_id: payment.id.to_inner(),
        sender: payment.sender,
        receiver: payment.receiver,
        amount: payment.amount_usdc_cents,
        fee,
    });
}

// === Entry: client attests ===

public fun attest<USDC>(
    payment: &mut PaymentObject<USDC>,
    rep: &mut ReputationObject,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(ctx.sender() == payment.sender, ENotSender);
    assert!(!payment.attestation_given, EAlreadySettled);
    payment.attestation_given = true;
    reputation::record_native_attestation(rep, clock);
    event::emit(AttestationGiven {
        payment_id: payment.id.to_inner(),
        client: payment.sender,
        receiver: payment.receiver,
    });
}

// === Entry: open dispute (within window) ===

public fun open_dispute<USDC>(
    payment: &mut PaymentObject<USDC>,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(
        ctx.sender() == payment.sender || ctx.sender() == payment.receiver,
        ENotSender,
    );
    assert!(clock.timestamp_ms() < payment.dispute_window_closes_at_ms, EDisputeWindowClosed);
    payment.status = STATUS_DISPUTED;
}

// === Accessors ===

public fun receiver<USDC>(p: &PaymentObject<USDC>): address { p.receiver }
public fun amount<USDC>(p: &PaymentObject<USDC>): u64 { p.amount_usdc_cents }
public fun tier_at_creation<USDC>(p: &PaymentObject<USDC>): u8 { p.tier_at_creation }
public fun fee_bps<USDC>(p: &PaymentObject<USDC>): u64 { p.fee_bps }
public fun status<USDC>(p: &PaymentObject<USDC>): u8 { p.status }
