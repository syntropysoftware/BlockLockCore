const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const { Token, TOKEN_PROGRAM_ID } = require("@solana/spl-token");

async function getBalances(publicKeyString) {
  // Connect to the Solana devnet (or mainnet-beta for production)
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Create a PublicKey object from the provided public key string
  const publicKey = new PublicKey(publicKeyString);

  try {
    // Fetch SOL balance
    const solBalance = await connection.getBalance(publicKey);
    const solBalanceInSol = solBalance / LAMPORTS_PER_SOL;
    
    console.log(`SOL Balance: ${solBalanceInSol} SOL`);

    // Fetch all token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    console.log("Token Balances:");
    for (let tokenAccount of tokenAccounts.value) {
      const tokenMint = tokenAccount.account.data.parsed.info.mint;
      const tokenBalance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
      
      console.log(`  ${tokenMint}: ${tokenBalance}`);
    }

    return {
      sol: solBalanceInSol,
      tokens: tokenAccounts.value.map(ta => ({
        mint: ta.account.data.parsed.info.mint,
        balance: ta.account.data.parsed.info.tokenAmount.uiAmount
      }))
    };
  } catch (error) {
    console.error("Error fetching balances:", error);
    return null;
  }
}

// Example usage
const publicKeyString = "DuYhELsTo7BXWc5XgzGAAd62TXt3vuqxqfRBAkP6HuEY"; // Replace with your public key
getBalances(publicKeyString);

