const anchor = require('@project-serum/anchor');
const { PublicKey, Keypair, Connection } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount } = require("@solana/spl-token");
const fs = require('fs');

async function lockUSDC() {
    const connection = new Connection("https://api.testnet.solana.com", "confirmed");
    
    const secretKeyString = fs.readFileSync('/root/.config/solana/id.json', 'utf8');
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const wallet = Keypair.fromSecretKey(secretKey);

    console.log("Wallet public key:", wallet.publicKey.toString());

    const provider = new anchor.AnchorProvider(
        connection, 
        new anchor.Wallet(wallet),
        { commitment: 'confirmed' }
    );

    anchor.setProvider(provider);

    // Make sure this matches the program ID in your Anchor.toml file
    const programId = new PublicKey('7wizuPjcftZwL5tu9KKiEbV5KfqMWbhDLSUQuXkB8GwC');
    console.log("Program ID:", programId.toString());

    let idlFile = fs.readFileSync('./target/idl/blocklockcore.json', 'utf8');
    let idl = JSON.parse(idlFile);

    const program = new anchor.Program(idl, programId, provider);

    const usdcMint = new PublicKey("GWLqo7KKsSv9uRZxDXPvspFz3jKwuuxfkL3tounsMeBb");
    console.log("USDC Mint:", usdcMint.toString());

    const userTokenAccount = new PublicKey("6tgTS3t8uKQDvXQsDLgKUcRZ7F4HJp8aezx9ynVu96HM");
    console.log("User Token Account:", userTokenAccount.toString());

    const [vaultPDA, bumpSeed] = await PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode("vault")), wallet.publicKey.toBuffer()],
        program.programId
    );
    console.log("Vault PDA:", vaultPDA.toString());

    const vaultTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        vaultPDA,
        true
    );
    console.log("Vault Token Account:", vaultTokenAccount.toString());

    try {
        const tokenAccount = await getAccount(connection, userTokenAccount);
        const balance = Number(tokenAccount.amount) / 10**6;

        console.log("Current USDC balance:", balance);

        if (balance === 0) {
            console.log("You don't have any USDC in your account. Please add some USDC before locking.");
            return;
        }

        const amountToLock = balance * 0.1;

        console.log(`Locking ${amountToLock} USDC for 24 hours...`);

        const tx = await program.methods.lockTokens(new anchor.BN(amountToLock * 10**6))
            .accounts({
                user: wallet.publicKey,
                vault: vaultPDA,
                userTokenAccount: userTokenAccount,
                vaultTokenAccount: vaultTokenAccount,
                mint: usdcMint,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .transaction();

        console.log("Transaction created:", tx);

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

lockUSDC();
