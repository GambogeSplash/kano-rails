/// Kano Rails — Reputation primitive.
/// Owned by a freelancer's wallet. One per address. Additive by default.
/// Tier downgrades only via upheld dispute (see payment.move).
module kano_rails::reputation;

use std::string::String;
use sui::clock::Clock;
use sui::event;

// === Tier ===

const TIER_BRONZE: u8 = 0;
const TIER_SILVER: u8 = 1;
const TIER_GOLD: u8 = 2;

// === Sybil & weighting constants ===

const NATIVE_ATTESTATION_WEIGHT: u64 = 100;
const IMPORTED_ATTESTATION_WEIGHT: u64 = 50;
const SILVER_PAYMENTS_THRESHOLD: u64 = 3;
const SILVER_ATTESTATIONS_THRESHOLD: u64 = 1;
const GOLD_PAYMENTS_THRESHOLD: u64 = 10;
const GOLD_WEIGHTED_ATTESTATIONS_THRESHOLD: u64 = 400; // ~3 native + 2 imports
const GOLD_WALLET_AGE_DAYS: u64 = 90;
const MS_PER_DAY: u64 = 86_400_000;

// === Errors ===

const ENotOwner: u64 = 0;
#[allow(unused_const)]
const EAlreadyExists: u64 = 1;

// === Imported attestation source ===

public struct ImportedAttestation has store, copy, drop {
    source: String,        // "linkedin" | "github" | "evm-wallet"
    identifier: String,    // verified handle / address
    imported_at_ms: u64,
}

// === Reputation object ===

public struct ReputationObject has key {
    id: UID,
    owner: address,
    created_at_ms: u64,
    last_updated_ms: u64,
    completed_payments: u64,
    total_volume_usdc_cents: u64,
    native_attestation_count: u64,
    weighted_attestation_score: u64,
    imported_attestations: vector<ImportedAttestation>,
    active_disputes: u64,
    tier: u8,
}

// === Events ===

public struct ReputationCreated has copy, drop {
    reputation_id: ID,
    owner: address,
}

public struct TierChanged has copy, drop {
    reputation_id: ID,
    owner: address,
    old_tier: u8,
    new_tier: u8,
}

// === Public functions ===

public fun create(clock: &Clock, ctx: &mut TxContext): ReputationObject {
    let now = clock.timestamp_ms();
    let id = object::new(ctx);
    event::emit(ReputationCreated {
        reputation_id: id.to_inner(),
        owner: ctx.sender(),
    });
    ReputationObject {
        id,
        owner: ctx.sender(),
        created_at_ms: now,
        last_updated_ms: now,
        completed_payments: 0,
        total_volume_usdc_cents: 0,
        native_attestation_count: 0,
        weighted_attestation_score: 0,
        imported_attestations: vector[],
        active_disputes: 0,
        tier: TIER_BRONZE,
    }
}

public fun transfer_to_owner(rep: ReputationObject) {
    let owner = rep.owner;
    transfer::transfer(rep, owner);
}

public fun add_imported_attestation(
    rep: &mut ReputationObject,
    source: String,
    identifier: String,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(ctx.sender() == rep.owner, ENotOwner);
    let now = clock.timestamp_ms();
    rep.imported_attestations.push_back(ImportedAttestation {
        source,
        identifier,
        imported_at_ms: now,
    });
    rep.weighted_attestation_score = rep.weighted_attestation_score + IMPORTED_ATTESTATION_WEIGHT;
    rep.last_updated_ms = now;
    recalc_tier(rep, clock);
}

/// Called by payment module after a settle.
/// Friend visibility would be better; for hackathon scope, package-only public.
public(package) fun record_settled_payment(
    rep: &mut ReputationObject,
    volume_usdc_cents: u64,
    clock: &Clock,
) {
    rep.completed_payments = rep.completed_payments + 1;
    rep.total_volume_usdc_cents = rep.total_volume_usdc_cents + volume_usdc_cents;
    rep.last_updated_ms = clock.timestamp_ms();
    recalc_tier(rep, clock);
}

public(package) fun record_native_attestation(rep: &mut ReputationObject, clock: &Clock) {
    rep.native_attestation_count = rep.native_attestation_count + 1;
    rep.weighted_attestation_score = rep.weighted_attestation_score + NATIVE_ATTESTATION_WEIGHT;
    rep.last_updated_ms = clock.timestamp_ms();
    recalc_tier(rep, clock);
}

public(package) fun record_upheld_dispute(rep: &mut ReputationObject, clock: &Clock) {
    rep.active_disputes = rep.active_disputes + 1;
    rep.last_updated_ms = clock.timestamp_ms();
    if (rep.tier > TIER_BRONZE) {
        let old = rep.tier;
        rep.tier = rep.tier - 1;
        event::emit(TierChanged {
            reputation_id: rep.id.to_inner(),
            owner: rep.owner,
            old_tier: old,
            new_tier: rep.tier,
        });
    };
}

// === Internal ===

fun recalc_tier(rep: &mut ReputationObject, clock: &Clock) {
    let age_days = (clock.timestamp_ms() - rep.created_at_ms) / MS_PER_DAY;
    let new_tier = if (
        rep.completed_payments >= GOLD_PAYMENTS_THRESHOLD
            && rep.weighted_attestation_score >= GOLD_WEIGHTED_ATTESTATIONS_THRESHOLD
            && age_days >= GOLD_WALLET_AGE_DAYS
            && rep.active_disputes == 0
    ) {
        TIER_GOLD
    } else if (
        rep.completed_payments >= SILVER_PAYMENTS_THRESHOLD
            && rep.native_attestation_count >= SILVER_ATTESTATIONS_THRESHOLD
    ) {
        TIER_SILVER
    } else {
        TIER_BRONZE
    };
    if (new_tier != rep.tier) {
        let old = rep.tier;
        rep.tier = new_tier;
        event::emit(TierChanged {
            reputation_id: rep.id.to_inner(),
            owner: rep.owner,
            old_tier: old,
            new_tier,
        });
    };
}

// === Accessors ===

public fun tier(rep: &ReputationObject): u8 { rep.tier }
public fun owner(rep: &ReputationObject): address { rep.owner }
public fun completed_payments(rep: &ReputationObject): u64 { rep.completed_payments }
public fun fee_bps_for_tier(tier: u8): u64 {
    if (tier == TIER_GOLD) 30
    else if (tier == TIER_SILVER) 80
    else 150
}
