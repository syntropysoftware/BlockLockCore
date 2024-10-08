const { 
    Connection, 
    PublicKey, 
    Keypair, 
    SystemProgram, 
    SYSVAR_RENT_PUBKEY, 
    LAMPORTS_PER_SOL,
    Transaction,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');
const {
    Program,
    AnchorProvider,
    BN,
    Wallet,
} = require('@project-serum/anchor');
const {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
} = require("@solana/spl-token");
const fs = require('fs');

const ACCOUNT_PUBLIC_KEY = 'DuYhELsTo7BXWc5XgzGAAd62TXt3vuqxqfRBAkP6HuEY';
const USDC_MINT_TESTNET = new PublicKey('4haaxgKzZDzx5cFMzekkVGZSwC7o3KYrSVUD2JUASCpL');

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
        {
            name: "unlockTokens",
            accounts: [
                { name: "user", isMut: true, isSigner: true },
                { name: "userLockInfo", isMut: true, isSigner: false },
                { name: "userTokenAccount", isMut: true, isSigner: false },
                { name: "mint", isMut: false, isSigner: false },
                { name: "tokenProgram", isMut: false, isSigner: false },
                { name: "owner", isMut: false, isSigner: false },
            ],
            args: [],
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

async function setupWalletAndProgram() {
    const connection = new Connection("https://api.testnet.solana.com", "confirmed");

    let secretKeyString;
    try {
        secretKeyString = fs.readFileSync('/root/.config/solana/id.json', 'utf8');
    } catch (err) {
        console.error("Error reading wallet key file:", err);
        throw err;
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

    const program = new Program(IDL, programId, provider);

    return { connection, wallet, program };
}

async function createAssociatedTokenAccountIfNotExist(connection, payer, mint, owner) {
    const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);
    const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
    
    if (!accountInfo) {
        console.log('Creating associated token account...');
        const transaction = new Transaction().add(
            createAssociatedTokenAccountInstruction(
                payer.publicKey,
                associatedTokenAddress,
                owner,
                mint
            )
        );
        await sendAndConfirmTransaction(connection, transaction, [payer]);
    }
    
    return associatedTokenAddress;
}

async function lockUSDC(amount) {
    const { connection, wallet, program } = await setupWalletAndProgram();

    const userTokenAccount = await createAssociatedTokenAccountIfNotExist(
        connection,
        wallet.payer,
        USDC_MINT_TESTNET,
        wallet.publicKey
    );

    const [userLockInfoPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("user_lock_info"), wallet.publicKey.toBuffer()],
        program.programId
    );

    try {
        const tx = await program.methods.lockTokens(new BN(amount))
            .accounts({
                user: wallet.publicKey,
                userLockInfo: userLockInfoPDA,
                userTokenAccount: userTokenAccount,
                mint: USDC_MINT_TESTNET,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .rpc();
        console.log("Lock transaction signature", tx);
    } catch (error) {
        console.error("Error locking tokens:", error);
    }
}

async function unlockUSDC() {
    const { connection, wallet, program } = await setupWalletAndProgram();

    const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT_TESTNET, wallet.publicKey);

    const [userLockInfoPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("user_lock_info"), wallet.publicKey.toBuffer()],
        program.programId
    );

    try {
        const tx = await program.methods.unlockTokens()
            .accounts({
                user: wallet.publicKey,
                userLockInfo: userLockInfoPDA,
                userTokenAccount: userTokenAccount,
                mint: USDC_MINT_TESTNET,
                tokenProgram: TOKEN_PROGRAM_ID,
                owner: wallet.publicKey,
            })
            .rpc();
        console.log("Unlock transaction signature", tx);
    } catch (error) {
        console.error("Error unlocking tokens:", error);
    }
}

async function checkLockStatus() {
    const { connection, wallet, program } = await setupWalletAndProgram();

    const [userLockInfoPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("user_lock_info"), wallet.publicKey.toBuffer()],
        program.programId
    );

    try {
        const userLockInfo = await program.account.userLockInfo.fetch(userLockInfoPDA);
        console.log("Locked amount:", userLockInfo.lockedAmount.toString());
        console.log("Unlock time:", new Date(userLockInfo.unlockTime * 1000).toLocaleString());
    } catch (error) {
        console.error("Error fetching lock status:", error);
    }
}

async function main() {
    await checkAccountOwnership(ACCOUNT_PUBLIC_KEY, new Connection("https://api.testnet.solana.com", "confirmed"));
    
    // Lock 100 USDC (remember USDC has 6 decimal places)
    await lockUSDC(100 * 1000000);
    
    await checkLockStatus();
    
    await unlockUSDC();
}

main().catch(console.error);
