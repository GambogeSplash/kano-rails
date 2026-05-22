/// Test USDC for Kano Rails demos on Sui testnet.
/// Public, mintable by anyone via the shared faucet. Do not use this on mainnet.
module test_usdc::usdc;

use std::option;
use sui::coin::{Self, Coin, TreasuryCap};
use sui::transfer;
use sui::tx_context::TxContext;
use sui::url;

public struct USDC has drop {}

/// Shared faucet that wraps the TreasuryCap so any caller can mint.
public struct Faucet has key {
    id: UID,
    cap: TreasuryCap<USDC>,
}

const FAUCET_DROP: u64 = 1000_000_000; // 1,000 USDC (6 decimals)

fun init(witness: USDC, ctx: &mut TxContext) {
    let (cap, metadata) = coin::create_currency<USDC>(
        witness,
        6,
        b"USDC",
        b"Test USDC",
        b"Test USDC for Kano Rails demos on Sui testnet",
        option::some(url::new_unsafe_from_bytes(b"https://kanorails.vercel.app/icon")),
        ctx,
    );
    transfer::public_freeze_object(metadata);
    transfer::share_object(Faucet { id: object::new(ctx), cap });
}

/// Anyone can request 1,000 test USDC. Public, no auth.
public fun drip(faucet: &mut Faucet, ctx: &mut TxContext) {
    let coin = coin::mint(&mut faucet.cap, FAUCET_DROP, ctx);
    transfer::public_transfer(coin, tx_context::sender(ctx));
}

/// Mint to a specific recipient (useful when sponsoring onboarding).
public fun drip_to(faucet: &mut Faucet, recipient: address, ctx: &mut TxContext) {
    let coin = coin::mint(&mut faucet.cap, FAUCET_DROP, ctx);
    transfer::public_transfer(coin, recipient);
}
