"use client";

import { useState } from "react";
import ApprovalCheck from "~~/components/FuzzBetting/ApprovalCheck";
import BettingSection from "~~/components/FuzzBetting/BettingSection";
import FaucetSection from "~~/components/FuzzBetting/FaucetSection";
import PromptsListSection from "~~/components/FuzzBetting/PromptListSection";
import ProposalSection from "~~/components/FuzzBetting/ProposalSection";
import StatsSection from "~~/components/FuzzBetting/StatsSection";
import VotingSection from "~~/components/FuzzBetting/VotingSection";

const ErrorDisplay = ({ error, onDismiss }: { error: string; onDismiss: () => void }) => (
  <div className="alert alert-error">
    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span>{error}</span>
    <button className="btn btn-sm" onClick={onDismiss}>
      Dismiss
    </button>
  </div>
);

export default function FuzzBetting() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4 p-4">
      {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}
      <ApprovalCheck />
      <FaucetSection />
      <StatsSection />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProposalSection />
        <BettingSection />
        <VotingSection />
      </div>
      <PromptsListSection />
    </div>
  );
}
