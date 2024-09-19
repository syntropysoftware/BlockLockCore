const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount } = require("@solana/spl-token");

async function getBalances(publicKeyString, mintAddress) {
  const connection = new Connection("https://api.testnet.solana.com", "confirmed");
  const publicKey = new PublicKey(publicKeyString);
  const mint = new PublicKey(mintAddress);

  try {
    const solBalance = await connection.getBalance(publicKey);
    const solBalanceInSol = solBalance / LAMPORTS_PER_SOL;
    console.log(`SOL Balance on Testnet: ${solBalanceInSol} SOL`);

    const tokenAddress = await getAssociatedTokenAddress(mint, publicKey);

    const tokenAccount = await getAccount(connection, tokenAddress);

    console.log(`Test USDC Balance: ${tokenAccount.amount / BigInt(10**6)} USDC`);

  } catch (error) {
    console.error("Error fetching balances:", error);
  }
}

const publicKeyString = "DuYhELsTo7BXWc5XgzGAAd62TXt3vuqxqfRBAkP6HuEY";
const mintAddress = "GWLqo7KKsSv9uRZxDXPvspFz3jKwuuxfkL3tounsMeBb"; 
getBalances(publicKeyString, mintAddress);
