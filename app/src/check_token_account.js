const fs = require('fs');
const { Keypair, Transaction, sendAndConfirmTransaction, Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { getAccount, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = require('@solana/spl-token');

// Set up connection to Solana testnet
const connection = new Connection(clusterApiUrl('testnet'));

// Replace with your funded wallet keypair from the Anchor configuration
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('/root/.config/solana/id.json'))));

// Your wallet public key (or token owner)
const walletPublicKey = new PublicKey('DuYhELsTo7BXWc5XgzGAAd62TXt3vuqxqfRBAkP6HuEY');

// Token mint address (example)
const tokenMint = new PublicKey('4haaxgKzZDzx5cFMzekkVGZSwC7o3KYrSVUD2JUASCpL'); // Replace with actual mint

async function checkAndCreateTokenAccount(walletPublicKey, tokenMint) {
    try {
        // Find the associated token account
        const tokenAccount = await getAssociatedTokenAddress(tokenMint, walletPublicKey);

        try {
            // Fetch token account information (this will throw an error if the account doesn't exist)
            const tokenAccountInfo = await getAccount(connection, tokenAccount);
            console.log("Token Account Info:", tokenAccountInfo);
        } catch (error) {
            if (error.name === "TokenAccountNotFoundError") {
                console.log("Token account not found. Creating it...");

                // Create the associated token account
                const transaction = new Transaction().add(
                    createAssociatedTokenAccountInstruction(
                        payer.publicKey,       // Payer for the transaction
                        tokenAccount,          // Token account to be created
                        walletPublicKey,       // Wallet owner
                        tokenMint              // Mint address of the token
                    )
                );

                // Send the transaction
                await sendAndConfirmTransaction(connection, transaction, [payer]);
                console.log("Token account created successfully:", tokenAccount.toBase58());
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error("Error handling token account:", error);
    }
}

checkAndCreateTokenAccount(walletPublicKey, tokenMint);

