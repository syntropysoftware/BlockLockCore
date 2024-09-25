const { Connection, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } = require('@solana/web3.js');
const { Program, AnchorProvider, BN, Wallet } = require('@project-serum/anchor');
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } = require("@solana/spl-token");
const fs = require('fs');

const IDL = {
  version: "0.1.0",
  name: "blocklockcore",
  instructions: [
    {
      name: "lockTokens",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "vault", isMut: true, isSigner: false },
        { name: "userTokenAccount", isMut: true, isSigner: false },
        { name: "vaultTokenAccount", isMut: true, isSigner: false },
        { name: "mint", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
  ],
};

async function lockUSDC() {
    const connection = new Connection("https://api.testnet.solana.com", "confirmed");
    
    let secretKeyString;
    try {
        secretKeyString = fs.readFileSync('/root/.config/solana/id.json', 'utf8');
    } catch (err) {
        console.error("Error reading wallet key file:", err);
        return;
    }

    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const keypair = Keypair.fromSecretKey(secretKey);

    const wallet = new Wallet(keypair);

    console.log("Wallet public key:", wallet.publicKey.toString());

    const provider = new AnchorProvider(
        connection, 
        wallet,
        { commitment: 'confirmed' }
    );

    //const programId = new PublicKey('7wizuPjcftZwL5tu9KKiEbV5KfqMWbhDLSUQuXkB8GwC');
    const programId = new PublicKey('36c5ZN4fq7qm13PyEAP4X7er1ZRgzik9SyvajxDLiAQH');
    console.log("Program ID:", programId.toString());

    let program;
    try {
        program = new Program(IDL, programId, provider);
    } catch (err) {
        console.error("Error creating Program instance:", err);
        return;
    }

    const usdcMint = new PublicKey("GWLqo7KKsSv9uRZxDXPvspFz3jKwuuxfkL3tounsMeBb");
    console.log("USDC Mint:", usdcMint.toString());

    const userTokenAccount = new PublicKey("6tgTS3t8uKQDvXQsDLgKUcRZ7F4HJp8aezx9ynVu96HM");
    console.log("User Token Account:", userTokenAccount.toString());

    let vaultPDA, bumpSeed;
    try {
        [vaultPDA, bumpSeed] = await PublicKey.findProgramAddress(
            [Buffer.from("vault"), wallet.publicKey.toBuffer()],
            program.programId
        );
    } catch (err) {
        console.error("Error finding program address:", err);
        return;
    }
    console.log("Vault PDA:", vaultPDA.toString());

    let vaultTokenAccount;
    try {
        vaultTokenAccount = await getAssociatedTokenAddress(
            usdcMint,
            vaultPDA,
            true
        );
    } catch (err) {
        console.error("Error getting associated token address:", err);
        return;
    }
    console.log("Vault Token Account:", vaultTokenAccount.toString());

    try {
        const tokenAccount = await connection.getTokenAccountBalance(userTokenAccount);
        const balance = tokenAccount.value.uiAmount;

        console.log("Current USDC balance:", balance);

        if (balance === 0) {
            console.log("You don't have any USDC in your account. Please add some USDC before locking.");
            return;
        }

        const amountToLock = balance * 0.1;

        console.log(`Locking ${amountToLock} USDC for 24 hours...`);

        const tx = await program.methods.lockTokens(new BN(amountToLock * 10**6))
            .accounts({
                user: wallet.publicKey,
                vault: vaultPDA,
                userTokenAccount: userTokenAccount,
                vaultTokenAccount: vaultTokenAccount,
                mint: usdcMint,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .transaction();

        const txSignature = await provider.sendAndConfirm(tx);

        console.log("Transaction sent. Signature:", txSignature);
        console.log("USDC locked successfully!");
    } catch (error) {
        console.error("Error:", error);
        if (error.logs) {
            console.error("Transaction logs:", error.logs);
        }
    }
}

lockUSDC().catch(console.error);
