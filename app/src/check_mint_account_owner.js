const { Connection, PublicKey } = require('@solana/web3.js');

async function checkMintAccountOwnership(connection, mintAddress) {
    const mintInfo = await connection.getParsedAccountInfo(mintAddress);
    
    if (mintInfo.value === null) {
        console.log("Mint address does not exist.");
        return;
    }

    // Check the owner
    const owner = mintInfo.value.owner.toBase58();
    console.log("Mint Account Owner:", owner);
    const splTokenProgram = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

    if (owner === splTokenProgram) {
        console.log("Mint is owned by the SPL Token program.");
    } else {
        console.log("Mint is owned by a different program.");
    }
}

const connection = new Connection("https://api.testnet.solana.com");
const mintAddress = new PublicKey("GWLqo7KKsSv9uRZxDXPvspFz3jKwuuxfkL3tounsMeBb");

checkMintAccountOwnership(connection, mintAddress)
    .catch(console.error);

