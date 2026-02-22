import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const CLUSTER = import.meta.env.VITE_SOLANA_CLUSTER || "devnet";
const DONATION_WALLET = (import.meta.env.VITE_DONATION_WALLET || "").trim();

function getPhantomProvider() {
  const provider = window?.solana;
  if (!provider?.isPhantom) {
    throw new Error("Phantom wallet not found. Install Phantom to donate.");
  }
  return provider;
}

export function getSolanaCluster() {
  return CLUSTER;
}

export function getDonationAddress() {
  if (!DONATION_WALLET || DONATION_WALLET.includes("paste_your")) {
    throw new Error("Missing VITE_DONATION_WALLET in .env");
  }
  return new PublicKey(DONATION_WALLET);
}

export function getConnection() {
  return new Connection(clusterApiUrl(CLUSTER), "confirmed");
}

export async function donateSol({ solAmount }) {
  const lamports = Math.round(Number(solAmount) * LAMPORTS_PER_SOL);
  if (!Number.isFinite(lamports) || lamports <= 0) {
    throw new Error("Enter a valid SOL amount.");
  }

  const provider = getPhantomProvider();
  const connection = getConnection();
  const toPubkey = getDonationAddress();

  const connectResp = await provider.connect();
  const fromPubkey = new PublicKey(connectResp.publicKey.toString());

  const latest = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    })
  );

  tx.feePayer = fromPubkey;
  tx.recentBlockhash = latest.blockhash;

  let signature = "";
  if (typeof provider.signAndSendTransaction === "function") {
    const resp = await provider.signAndSendTransaction(tx);
    signature = resp.signature;
  } else {
    const signedTx = await provider.signTransaction(tx);
    signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
    });
  }

  await connection.confirmTransaction(
    {
      signature,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    },
    "confirmed"
  );

  return signature;
<<<<<<< HEAD
}
=======
}
>>>>>>> ff74e85 (Added PostVisit page, Gemini models, Solana integration and updated API config)
