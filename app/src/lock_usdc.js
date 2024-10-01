const { Connection, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { Program, AnchorProvider, BN, Wallet } = require('@project-serum/anchor');
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount, createMint, createAssociatedTokenAccount, mintTo } = require("@solana/spl-token");
const fs = require('fs');

const IDL = {
  version: "0.1.0",
  name: "blocklockcore",
  instructions: [
    {
      name: "lockTokens",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "userLockInfo", isMut: true, isSigner: false },
        { name: "userTokenAccount", isMut: true, isSigner: false },
        { name: "mint", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
  ],
  accounts: [
    {
      name: "UserLockInfo",
      type: {
        kind: "struct",
        fields: [
          { name: "lockedAmount", type: "u64" },
          { name: "unlockTime", type: "i64" },
          { name: "owner", type: "publicKey" },
        ],
      },
    },
  ],
};

async function setupLocalEnvironment(connection, payer) {
    const mint = await createMint(
        connection,
        payer,
        payer.publicKey,
        null,
        6
    );
    console.log("Local USDC Mint created:", mint.toBase58());

    const tokenAccount = await createAssociatedTokenAccount(
        connection,
        payer,
        mint,
        payer.publicKey
    );
    console.log("User Token Account created:", tokenAccount.toBase58());

    await mintTo(
        connection,
        payer,
        mint,
        tokenAccount,
        payer,
        1000000000
    );

    return { mint, tokenAccount };
}

async function lockUSDC() {
    const connection = new Connection("http://localhost:8899", "confirmed");

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

    const programId = new PublicKey('36c5ZN4fq7qm13PyEAP4X7er1ZRgzik9SyvajxDLiAQH');
    console.log("Program ID:", programId.toString());

    let program;
    try {
        program = new Program(IDL, programId, provider);
    } catch (err) {
        console.error("Error creating Program instance:", err);
        return;
    }

    const { mint, tokenAccount } = await setupLocalEnvironment(connection, keypair);

    let userLockInfoPDA, bumpSeed;
    try {
        [userLockInfoPDA, bumpSeed] = await PublicKey.findProgramAddress(
            [Buffer.from("user_lock_info"), wallet.publicKey.toBuffer()],
            program.programId
        );
    } catch (err) {
        console.error("Error finding program address:", err);
        return;
    }
    console.log("User Lock Info PDA:", userLockInfoPDA.toString());

    //const customTokenProgramId = new PublicKey("7wizuPjcftZwL5tu9KKiEbV5KfqMWbhDLSUQuXkB8GwC");
    const customTokenProgramId = new PublicKey("36c5ZN4fq7qm13PyEAP4X7er1ZRgzik9SyvajxDLiAQH");

    try {
        const solBalance = await connection.getBalance(wallet.publicKey);
        console.log(`SOL Balance: ${solBalance / LAMPORTS_PER_SOL} SOL`);

        const tokenAccountInfo = await getAccount(connection, tokenAccount);
        const balance = Number(tokenAccountInfo.amount) / 10**6;

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
                userLockInfo: userLockInfoPDA,
                userTokenAccount: tokenAccount,
                mint: mint,
                systemProgram: SystemProgram.programId,
                tokenProgram: customTokenProgramId,
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

