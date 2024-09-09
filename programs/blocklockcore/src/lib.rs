use anchor_lang::prelude::*;

declare_id!("GaaZCFYBJNkorUPX83t3DedR2AwP4LYcfahx1XYNLdun");

#[program]
pub mod blocklockcore {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
