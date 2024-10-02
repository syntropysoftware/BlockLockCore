import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Blocklockcore } from "../target/types/blocklockcore";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { PublicKey } from '@solana/web3.js';
import { assert } from 'chai'; 

describe("blocklockcore", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  console.log(anchor.workspace); // Debugging log

  const program = anchor.workspace.Blocklockcore as Program<Blocklockcore>;

  let mint: PublicKey;
  let userTokenAccount: PublicKey;

  before(async () => {
    mint = await createMint(provider.connection, provider.wallet.payer, provider.wallet.publicKey, null, 9);
    userTokenAccount = await createAccount(provider.connection, provider.wallet.payer, mint, provider.wallet.publicKey);
    await mintTo(provider.connection, provider.wallet.payer, mint, userTokenAccount, provider.wallet.payer, 1000000000);
  });

  it("Locks tokens", async () => {
    const [userLockInfoPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("user_lock_info"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .lockTokens(new anchor.BN(1000000))
      .accounts({
        user: provider.wallet.publicKey,
        userLockInfo: userLockInfoPDA,
        userTokenAccount: userTokenAccount,
        mint: mint,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("Lock transaction signature", tx);
  });

  it("Fails to unlock tokens before lock period", async () => {
    const [userLockInfoPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("user_lock_info"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .unlockTokens()
        .accounts({
          user: provider.wallet.publicKey,
          userLockInfo: userLockInfoPDA,
          userTokenAccount: userTokenAccount,
          owner: provider.wallet.publicKey,
        })
        .rpc();
      assert.fail("The transaction should have failed");
    } catch (error) {
      assert.include(error.message, "The lock period has not expired yet");
    }
  });
});

