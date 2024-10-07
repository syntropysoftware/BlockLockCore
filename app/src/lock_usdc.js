const {
    Connection,
    PublicKey,
    Keypair,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const {
    Program,
    AnchorProvider,
    BN,
    Wallet,
} = require('@project-serum/anchor');
const {
    getAssociatedTokenAddress,
    getAccount,
    createMint,
    createAssociatedTokenAccount,
    mintTo,
} = require("@solana/spl-token");
const fs = require('fs');

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ACCOUNT_PUBLIC_KEY = 'DuYhELsTo7BXWc5XgzGAAd62TXt3vuqxqfRBAkP6HuEY';

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

async function checkAccountOwnership(accountPublicKey, connection) {
    const accountInfo = await connection.getAccountInfo(new PublicKey(accountPublicKey));
    if (accountInfo) {
        console.log('Owner Program ID:', accountInfo.owner.toString());
        const balance = await connection.getBalance(new PublicKey(accountPublicKey));
        console.log(`Account Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    } else {
        console.log('Account not found');
    }
}

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
    const connection = new Connection("https://api.testnet.solana.com", "confirmed");

    await checkAccountOwnership(ACCOUNT_PUBLIC_KEY, connection);

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

    try {
        const solBalance = await connection.getBalance(wallet.publicKey);
        console.log(`SOL Balance: ${solBalance / LAMPORTS_PER_SOL} SOL`);

        const tokenAccountInfo = await getAccount(connection, tokenAccount);
        const balance = Number(tokenAccountInfo.amount) / 10 ** 6;

        console.log("Current USDC balance:", balance);

        if (balance === 0) {
            console.log("You don't have any USDC in your account. Please add some USDC before locking.");
            return;
        }

        const amountToLock = balance * 0.1; // Locking 10% of current balance
        console.log(`Locking ${amountToLock} USDC for 24 hours...`);

        const tx = await program.methods.lockTokens(new BN(amountToLock * 10 ** 6))
            .accounts({
                user: wallet.publicKey,
                userLockInfo: userLockInfoPDA,
                userTokenAccount: tokenAccount, // Locking directly from the existing token account
                mint: mint,
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

async function testTransferUSDC() {
    const connection = new Connection("https://api.testnet.solana.com", "confirmed");

    const secretKeyString = fs.readFileSync('/root/.config/solana/id.json', 'utf8');
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const keypair = Keypair.fromSecretKey(secretKey);
    const wallet = new Wallet(keypair);

    const tokenAccount = new PublicKey("6tgTS3t8uKQDvXQsDLgKUcRZ7F4HJp8aezx9ynVu96HM"); // Token Account
    const mintAddress = new PublicKey("GWLqo7KKsSv9uRZxDXPvspFz3jKwuuxfkL3tounsMeBb"); // Mint Address

    try {
        const transferTx = await mintTo(
            connection,
            wallet.payer,
            mintAddress,
            tokenAccount,
            wallet.publicKey,
            1000000 // Minting 1 USDC (considering 6 decimals)
        );

        console.log("Transfer Transaction Signature:", transferTx);
    } catch (error) {
        console.error("Error during transfer:", error);
    }
}

testTransferUSDC().catch(console.error);
lockUSDC().catch(console.error);
