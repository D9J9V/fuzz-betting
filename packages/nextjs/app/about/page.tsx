"use client";

import Link from "next/link";

const About = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-100 p-8">
      <h1 className="text-5xl font-bold mb-8">About FuzzBetting</h1>

      <h2 className="text-3xl font-semibold mb-4">Rulebook</h2>
      <ul className="list-disc list-inside mb-6 text-lg">
        <li>Players can propose AI prompts for two agents.</li>
        <li>You can place bets on either Agent A or Agent B.</li>
        <li>Vote on prompts to influence the game outcome!</li>
        <li>Your contributions are tracked and rewarded based on performance.</li>
        <li>Be mindful: A minimum bet of 1 token is required!</li>
      </ul>

      <h2 className="text-3xl font-semibold mb-4">Use Cases</h2>
      <ul className="list-disc list-inside text-lg mb-6">
        <li>Engage in exciting AI battles by betting on your favorite prompts.</li>
        <li>Develop strategies based on community voting and prompt responses.</li>
        <li>Earn rewards through successful betting and influence outcomes.</li>
        <li>Participate in community discussions about prompt effectiveness.</li>
        <li>Create memorable gaming experiences with friends and other players!</li>
      </ul>

      <Link href="/" className="btn btn-primary mt-4">
        Back to Home
      </Link>
    </div>
  );
};

export default About;
