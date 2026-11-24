"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, Loader2 } from "lucide-react";
import { formatGen } from "@/lib/contracts/types";
import { useWallet } from "@/lib/genlayer/wallet";
import { useProofContract, useProofWrite } from "@/lib/hooks/useReadProof";
import { currentNetwork } from "@/lib/network";
import { useNetwork } from "@/lib/useNetwork";
import { Button } from "./ui/button";

/**
 * GEN credited to the connected wallet (deposits, a show's prices, dispute stakes and bounties, returned budgets). GEN only leaves ReadProof
 * through `withdraw`, to the caller; on Bradbury the app prepays the fee of that transfer.
 */
export function OwedCard() {
  const { address, isConnected } = useWallet();
  const contract = useProofContract();
  const { writeAsync, pending } = useProofWrite();
  const net = useNetwork();
  const q = useQuery({
    queryKey: ["owed", net.id, address],
    enabled: !!contract && !!address,
    queryFn: () => contract!.owedTo(address!),
    staleTime: 20_000,
  });
  if (!isConnected || !address) return null;
  const owed = q.data ?? 0n;
  return (
    <div className="brand-card p-5 space-y-2 text-sm">
      <h3 className="display text-lg font-bold">Your GEN in ReadProof</h3>
      <p className="display text-3xl font-bold">{q.isLoading ? "…" : `${formatGen(owed, 4)} GEN`}</p>
      <p className="text-xs text-muted-foreground">
        Deposits, a show's prices (to the wallet its feed declares), dispute stakes and bounties, and a closed deal's unreserved budget are credited here; a deal's budget and a dispute's stake are taken from here (the app deposits what is missing first). Withdraw sends them to this wallet
        {net.id === "bradbury" ? "; the transaction prepays the fee of that transfer" : ""}.
      </p>
      <Button size="sm" disabled={owed === 0n || !!pending} onClick={() => writeAsync({ kind: "withdraw" }).catch(() => {})}>
        {pending === "withdraw" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
        Withdraw
      </Button>
    </div>
  );
}
