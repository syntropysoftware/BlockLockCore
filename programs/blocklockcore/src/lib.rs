use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

declare_id!("7wizuPjcftZwL5tu9KKiEbV5KfqMWbhDLSUQuXkB8GwC");

#[program]
pub mod blocklockcore {
    use super::*;

    pub fn lock_tokens(ctx: Context<LockTokens>, amount: u64) -> Result<()> {
        let clock = Clock::get()?;
        let lock_duration = 24 * 60 * 60; // 24 hours in seconds

        ctx.accounts.vault.amount = amount;
        ctx.accounts.vault.lock_time = clock.unix_timestamp + lock_duration;
        ctx.accounts.vault.owner = ctx.accounts.user.key();

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.vault_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    pub fn unlock_tokens(ctx: Context<UnlockTokens>) -> Result<()> {
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= ctx.accounts.vault.lock_time,
            BlocklockError::LockNotExpired
        );

        let amount = ctx.accounts.vault_token_account.amount;

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                &[&[b"vault", ctx.accounts.user.key().as_ref(), &[ctx.bumps.vault]]],
            ),
            amount,
        )?;

        ctx.accounts.vault.amount = 0;
        ctx.accounts.vault.lock_time = 0;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct LockTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + 8 + 8 + 32,
        seeds = [b"vault", user.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = user,
        token::mint = mint,
        token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, token::Mint>,
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
        seeds = [b"vault", user.key().as_ref()],
        bump,
        has_one = owner @ BlocklockError::InvalidOwner,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
    /// CHECK: This is the owner of the vault, verified by the `has_one` constraint
    pub owner: UncheckedAccount<'info>,
}

#[account]
pub struct Vault {
    pub amount: u64,
    pub lock_time: i64,
    pub owner: Pubkey,
}

#[error_code]
pub enum BlocklockError {
    #[msg("The lock period has not expired yet")]
    LockNotExpired,
    #[msg("Invalid owner")]
    InvalidOwner,
}
