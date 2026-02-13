import { ethers } from "ethers";
import { supabase } from "./supabase";

/**
 * PRODUCTION-GRADE BLOCKCHAIN NOTARY SERVICE
 * Implementation for Polygon (Amoy Testnet)
 * 
 * Architecture:
 * - Supabase: Source of truth for full data.
 * - Polygon: Cryptographic proof layer (SHA-256 hashes).
 * - Immutability guaranteed by on-chain anchoring.
 */

// Contract ABI provided by the user
const CONTRACT_ABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "sheepId", "type": "string" },
            { "internalType": "string", "name": "hash", "type": "string" }
        ],
        "name": "addRecord",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "string", "name": "sheepId", "type": "string" }
        ],
        "name": "getRecords",
        "outputs": [
            {
                "components": [
                    { "internalType": "string", "name": "hash", "type": "string" },
                    { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
                ],
                "internalType": "struct GuardianLedger.Record[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const CONTRACT_ADDRESS = import.meta.env.VITE_POLYGON_CONTRACT_ADDRESS || "0x624145dbac725735518ebe3e537fBCb34363E5E8";
const RPC_URL = import.meta.env.VITE_POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology";

export class BlockchainNotaryService {
    /**
     * Generates a deterministic SHA-256 hash of critical health event fields.
     * SHA256(event_id + sheep_id + event_type + event_date)
     */
    static async generateHash(event: any): Promise<string> {
        const dataString = `${event.id}${event.sheep_id}${event.type}${event.date}`;
        const msgUint8 = new TextEncoder().encode(dataString);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    /**
     * Writes the hash to Polygon Blockchain.
     */
    static async notarizeOnChain(eventId: string, sheepId: string, eventData: any): Promise<{ txHash: string, dataHash: string }> {
        const dataHash = await this.generateHash(eventData);

        if (!(window as any).ethereum && !import.meta.env.VITE_BACKEND_WALLET_PRIVATE_KEY) {
            throw new Error("No blockchain provider or backend wallet configured.");
        }

        try {
            let signer;
            if ((window as any).ethereum) {
                const provider = new ethers.BrowserProvider((window as any).ethereum);
                signer = await provider.getSigner();
            } else {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                signer = new ethers.Wallet(import.meta.env.VITE_BACKEND_WALLET_PRIVATE_KEY, provider);
            }

            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            const tx = await contract.addRecord(sheepId, dataHash);
            const receipt = await tx.wait();

            // Update Supabase with the proof
            const { error } = await supabase
                .from("health_events")
                .update({
                    blockchain_hash: dataHash,
                    blockchain_tx: receipt.hash,
                    verified: true
                })
                .eq("id", eventId);

            if (error) throw error;

            return { txHash: receipt.hash, dataHash };
        } catch (error) {
            console.error("Blockchain notarization failed:", error);
            throw error;
        }
    }

    /**
     * Verifies local data against the on-chain recorded hash.
     */
    static async verifyIntegrity(sheepId: string, localEvent: any): Promise<'verified' | 'tampered' | 'not_anchored'> {
        if (!localEvent.blockchain_hash) return 'not_anchored';

        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            // Fetch all records for this sheep from blockchain (Struct Array)
            const onChainRecords: any[] = await contract.getRecords(sheepId);

            // Recalculate local hash
            const localHash = await this.generateHash(localEvent);

            // Check if local hash exists in any of the returned struct records
            const isValid = onChainRecords.some((record: any) => record.hash === localHash);

            return isValid ? 'verified' : 'tampered';
        } catch (error) {
            console.error("Blockchain verification failed:", error);
            return 'not_anchored';
        }
    }
}
