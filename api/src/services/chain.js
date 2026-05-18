import { ethers } from "ethers";
import { config } from "../config.js";

const provider = new ethers.JsonRpcProvider(config.chain.rpcUrl, config.chain.chainId);

export const verifyPurchaseTransaction = async ({ txHash, expectedBuyer, expectedAmountWei }) => {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) {
    return { ok: false, reason: "Transaction is not confirmed successfully" };
  }

  const tx = await provider.getTransaction(txHash);
  if (!tx) {
    return { ok: false, reason: "Transaction not found" };
  }

  const to = tx.to?.toLowerCase();
  const contractAddress = config.chain.studocuContractAddress.toLowerCase();
  if (to !== contractAddress) {
    return { ok: false, reason: "Transaction was not sent to the configured contract" };
  }

  if (tx.from.toLowerCase() !== expectedBuyer.toLowerCase()) {
    return { ok: false, reason: "Transaction sender does not match buyer" };
  }

  if (expectedAmountWei && tx.value < BigInt(expectedAmountWei)) {
    return { ok: false, reason: "Transaction value is below listing price" };
  }

  return { ok: true, blockNumber: receipt.blockNumber };
};
