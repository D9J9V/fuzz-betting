"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full h-screen bg-gradient-to-br from-primary to-base-100 text-primary-content">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold drop-shadow-lg">Welcome to FuzzBetting!</h1>
          <p className="text-2xl mt-4 animate-fadeIn">Bet on AI-driven prompts and have fun!</p>
        </div>

        <div className="mb-6">
          <Link href="/fuzzbetting">
            <button className="bg-yellow-400 hover:bg-yellow-500 text-base-100 font-bold py-2 px-4 rounded-full shadow-lg transition-transform transform hover:scale-105">
              <span className="text-3xl">🚀 Start Playing</span>
            </button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around w-full max-w-screen-lg mb-12">
          <div className="flex flex-col bg-base-100 text-primary-content p-6 rounded-lg shadow-lg max-w-xs text-center mt-4 sm:mt-0">
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-blue-600" />
            <h3 className="text-2xl font-bold mt-4">Block Explorer</h3>
            <p className="mt-2">Explore your local transactions</p>
            <Link href="/blockexplorer">
              <p className="text-lg mt-2 text-blue-600 hover:text-blue-800 cursor-pointer">Explore Now</p>
            </Link>
          </div>

          {/* New Card Linking to About Page */}
          <div className="flex flex-col bg-base-100 text-primary-content p-6 rounded-lg shadow-lg max-w-xs text-center mt-4 sm:mt-0">
            <h3 className="text-2xl font-bold mt-4">About FuzzBetting</h3>
            <p className="mt-2">Learn the rules and explore cool use cases.</p>
            <Link href="/about">
              <p className="text-lg mt-2 text-blue-600 hover:text-blue-800 cursor-pointer">View About Page</p>
            </Link>
          </div>
        </div>

        {connectedAddress && (
          <div className="mt-4">
            <p className="text-lg">
              Connected Address: <Address address={connectedAddress} />
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease forwards;
        }
      `}</style>
    </>
  );
};

export default Home;
