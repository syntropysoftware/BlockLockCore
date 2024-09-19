const { Connection, PublicKey, Keypair, sendAndConfirmTransaction, Transaction } = require("@solana/web3.js");
const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require("@solana/spl-token");
const fs = require('fs');

async function createAndMintTestUSDC() {
  const connection = new Connection("https://api.testnet.solana.com", "confirmed");
  
  // Load your wallet keypair
  const secretKeyString = fs.readFileSync('/root/.config/solana/id.json', 'utf8');
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const wallet = Keypair.fromSecretKey(secretKey);

  console.log(`Using wallet public key: ${wallet.publicKey.toBase58()}`);

  try {
    const mint = await createMint(
      connection,
      wallet,
      wallet.publicKey,
      null,
      6
    );

    console.log(`Mint created: ${mint.toBase58()}`);

    // Get or create associated token account
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      wallet.publicKey
    );

    console.log(`Token account: ${tokenAccount.address.toBase58()}`);

    // Mint 1000 tokens to your account
    const mintAmount = 1000 * 10**6; // 1000 tokens with 6 decimal places
    await mintTo(
      connection,
      wallet,
      mint,
      tokenAccount.address,
      wallet,
      mintAmount
    );

    console.log(`Minted ${mintAmount / 10**6} tokens to ${tokenAccount.address.toBase58()}`);

    return { mint: mint.toBase58(), tokenAccount: tokenAccount.address.toBase58() };
  } catch (error) {
    console.error("Error creating and minting test USDC:", error);
  }
}

createAndMintTestUSDC();

