use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Token, Mint};

declare_id!("36c5ZN4fq7qm13PyEAP4X7er1ZRgzik9SyvajxDLiAQH");

#[program]
pub mod blocklockcore {
    use super::*;

    pub fn lock_tokens(ctx: Context<LockTokens>, amount: u64) -> Result<()> {
        // Verify the mint
        require!(
            ctx.accounts.mint.key() == ctx.accounts.user_token_account.mint,
            BlocklockError::InvalidMint
        );

        let clock = Clock::get()?;
        let lock_duration = 24 * 60 * 60; // 24 hours in seconds

        ctx.accounts.user_lock_info.locked_amount = amount;
        ctx.accounts.user_lock_info.unlock_time = clock.unix_timestamp + lock_duration;
        ctx.accounts.user_lock_info.owner = ctx.accounts.user.key();

        Ok(())
    }

    pub fn unlock_tokens(ctx: Context<UnlockTokens>) -> Result<()> {
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= ctx.accounts.user_lock_info.unlock_time,
            BlocklockError::LockNotExpired
        );

        ctx.accounts.user_lock_info.locked_amount = 0;
        ctx.accounts.user_lock_info.unlock_time = 0;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct LockTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 8 + 8 + 32,
        seeds = [b"user_lock_info", user.key().as_ref()],
        bump
    )]
    pub user_lock_info: Account<'info, UserLockInfo>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UnlockTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"user_lock_info", user.key().as_ref()],
        bump,
        has_one = owner @ BlocklockError::InvalidOwner,
    )]
    pub user_lock_info: Account<'info, UserLockInfo>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    /// CHECK: This is the owner of the user_lock_info, verified by the `has_one` constraint
    pub owner: UncheckedAccount<'info>,
}

#[account]
pub struct UserLockInfo {
    pub locked_amount: u64,
    pub unlock_time: i64,
    pub owner: Pubkey,
}

#[error_code]
pub enum BlocklockError {
    #[msg("The lock period has not expired yet")]
    LockNotExpired,
    #[msg("Invalid owner")]
    InvalidOwner,
    #[msg("Invalid mint")]
    InvalidMint,
}

