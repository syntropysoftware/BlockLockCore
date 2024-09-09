const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js");

async function getBalance(publicKeyString) {
  const connection = new Connection("https://api.testnet.solana.com", "confirmed");
  
  const publicKey = new PublicKey(publicKeyString);

  try {
    const solBalance = await connection.getBalance(publicKey);
    const solBalanceInSol = solBalance / LAMPORTS_PER_SOL;
    
    console.log(`SOL Balance on Testnet: ${solBalanceInSol} SOL`);

    return solBalanceInSol;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return null;
  }
}

const publicKeyString = "DuYhELsTo7BXWc5XgzGAAd62TXt3vuqxqfRBAkP6HuEY";
getBalance(publicKeyString);

