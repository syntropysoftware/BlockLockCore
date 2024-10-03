const { Connection, PublicKey } = require('@solana/web3.js');

async function checkAccountOwnership(accountPublicKey) {
    const connection = new Connection('https://api.testnet.solana.com'); // Fixed URL
    try {
        const accountInfo = await connection.getAccountInfo(new PublicKey(accountPublicKey));

        if (accountInfo) {
            console.log('Owner Program ID:', accountInfo.owner.toString());
            console.log('Account Balance:', accountInfo.lamports / 1e9, 'SOL'); // Display balance in SOL
        } else {
            console.log('Account not found or does not exist.');
        }
    } catch (error) {
        console.error('Error fetching account info:', error.message);
    }
}

// Replace with the actual public key you want to check
checkAccountOwnership('DuYhELsTo7BXWc5XgzGAAd62TXt3vuqxqfRBAkP6HuEY');

