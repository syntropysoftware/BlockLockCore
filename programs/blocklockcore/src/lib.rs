use anchor_lang::prelude::*;

declare_id!("7wizuPjcftZwL5tu9KKiEbV5KfqMWbhDLSUQuXkB8GwC");

#[program]
pub mod blocklockcore {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
