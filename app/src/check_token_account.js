const fs = require('fs');
const { Keypair, Transaction, sendAndConfirmTransaction, Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { getAccount, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = require('@solana/spl-token');

const connection = new Connection(clusterApiUrl('testnet'));

const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('/root/.config/solana/id.json'))));

const walletPublicKey = new PublicKey('DuYhELsTo7BXWc5XgzGAAd62TXt3vuqxqfRBAkP6HuEY');

const tokenMint = new PublicKey('4haaxgKzZDzx5cFMzekkVGZSwC7o3KYrSVUD2JUASCpL');

async function checkAndCreateTokenAccount(walletPublicKey, tokenMint) {
    try {
        // Find the associated token account
        const tokenAccount = await getAssociatedTokenAddress(tokenMint, walletPublicKey);

        try {
            const tokenAccountInfo = await getAccount(connection, tokenAccount);
            console.log("Token Account Info:", tokenAccountInfo);
        } catch (error) {
            if (error.name === "TokenAccountNotFoundError") {
                console.log("Token account not found. Creating it...");

                const transaction = new Transaction().add(
                    createAssociatedTokenAccountInstruction(
                        payer.publicKey,       // Payer for the transaction
                        tokenAccount,          // Token account to be created
                        walletPublicKey,       // Wallet owner
                        tokenMint              // Mint address of the token
                    )
                );

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

