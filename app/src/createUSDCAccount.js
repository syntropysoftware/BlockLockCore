const { Connection, PublicKey, Keypair, sendAndConfirmTransaction, Transaction } = require("@solana/web3.js");
const { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const fs = require('fs');

async function createUSDCAccount() {
  const connection = new Connection("https://api.testnet.solana.com", "confirmed");
  
  const secretKeyString = fs.readFileSync('/root/.config/solana/id.json', 'utf8');
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const wallet = Keypair.fromSecretKey(secretKey);

  console.log(`Using wallet public key: ${wallet.publicKey.toBase58()}`);

  const usdcMint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

  try {
    const associatedTokenAddress = await getAssociatedTokenAddress(
      usdcMint,
      wallet.publicKey
    );

    console.log(`Associated token address: ${associatedTokenAddress.toBase58()}`);

    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedTokenAddress,
        wallet.publicKey,
        usdcMint
      )
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
    console.log(`Transaction signature: ${signature}`);
    console.log(`USDC account created: ${associatedTokenAddress.toBase58()}`);

  } catch (error) {
    console.error("Error creating USDC account:", error);
  }
}

createUSDCAccount();
